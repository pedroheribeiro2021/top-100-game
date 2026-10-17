type RankingItem = {
  position: number;
  value: string;
  aliases?: string[];
};

type GeneratedItem = {
  value: string;
  aliases: string[];
};

/**
 * DOMAIN §5: tema com menos de 100 itens existentes ("planetas", "estados do
 * Brasil") vira ranking menor, desde que tenha pelo menos isto.
 */
export const MIN_AI_RANKING_ITEMS = 30;
const MAX_RANKING_ITEMS = 100;
const MAX_ALIASES_PER_ITEM = 4;
// 100 itens em JSON com aliases levam ~15–20s no Gemini com raciocínio baixo.
const GENERATION_TIMEOUT_MS = 40000;

export type RankingGenerationResult = {
  ranking: RankingItem[];
  source: ProviderConfig['name'];
  warning: string | null;
};

type ProviderResult = {
  content: string;
  model: string;
};

type ProviderConfig = {
  name: 'gemini' | 'groq' | 'openrouter';
  model: string;
  apiKey: string | undefined;
  endpoint: string;
  headers?: Record<string, string>;
  // Modelos com raciocínio (Gemini) gastam tokens antes da resposta.
  maxTokens?: number;
  extraBody?: Record<string, unknown>;
};

type ProviderHealth = {
  provider: ProviderConfig['name'];
  configured: boolean;
  model: string;
  ok: boolean;
  status?: number;
  message: string;
};

function getProviderConfigs(): ProviderConfig[] {
  const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const openRouterModel = process.env.OPENROUTER_MODEL || 'openrouter/free';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  return [
    {
      // Endpoint compatível com OpenAI do Gemini (free tier do Google AI Studio).
      name: 'gemini',
      model: geminiModel,
      apiKey: process.env.GEMINI_API_KEY,
      endpoint:
        'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      maxTokens: 8192,
      extraBody: { reasoning_effort: 'low' },
    },
    {
      name: 'groq',
      model: groqModel,
      apiKey: process.env.GROQ_API_KEY,
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    },
    {
      name: 'openrouter',
      model: openRouterModel,
      apiKey: process.env.OPENROUTER_API_KEY,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'HTTP-Referer':
          process.env.OPENROUTER_SITE_URL || 'https://top-100-game.local',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'top-100-game',
      },
    },
  ];
}

export class RankingGenerationError extends Error {
  constructor(
    message: string,
    readonly details: Array<{
      provider: string;
      model: string;
      status?: number;
      message: string;
    }>,
  ) {
    super(message);
    this.name = 'RankingGenerationError';
  }
}

// Jogadores digitam os palpites: o item precisa ser o nome que alguém
// escreveria, e os aliases cobrem as outras grafias comuns (DOMAIN §4).
const SYSTEM_PROMPT = [
  'Voce gera rankings para um jogo multiplayer em portugues do Brasil, em que os jogadores tentam adivinhar os itens digitando.',
  'Responda SOMENTE com JSON valido, sem markdown e sem comentarios, no formato:',
  '{"items":[{"value":"Nome do item","aliases":["outra grafia","apelido"]}]}',
  'Regras para "value": o nome mais comum em portugues do Brasil; curto; sem ano, pais, descricao ou detalhe entre parenteses; sem numeracao.',
  'Regras para "aliases": de 0 a 4 outras formas que um jogador digitaria para o mesmo item (sobrenome sozinho de pessoa famosa, sigla, nome original em ingles, apelido conhecido). Nunca um alias que sirva para outro item da lista.',
  'Itens unicos, ordenados do mais popular/obvio para o menos popular/obscuro.',
  `Se o tema tiver menos de ${MAX_RANKING_ITEMS} itens que existem de verdade, liste todos os que existem e pare; nunca invente nem repita itens.`,
].join(' ');

function buildMessages(theme: string, existingItems: string[] = []) {
  if (existingItems.length === 0) {
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Tema: ${theme}\nGere o ranking com ate ${MAX_RANKING_ITEMS} itens.`,
      },
    ];
  }

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        `Tema: ${theme}`,
        `Ja temos estes ${existingItems.length} itens:`,
        existingItems.map((item, index) => `${index + 1}. ${item}`).join('\n'),
        `Continue a partir do item ${existingItems.length + 1}, ate no maximo o item ${MAX_RANKING_ITEMS}, sem repetir nenhum item acima.`,
        'Se nao existirem mais itens de verdade para esse tema, responda {"items":[]}.',
      ].join('\n'),
    },
  ];
}

// JSON com aliases ocupa bem mais tokens que a lista simples de antes.
function getMaxTokens(existingItems: string[]) {
  if (existingItems.length === 0) return 6000;
  return 4000;
}

async function postJson(
  provider: ProviderConfig,
  body: Record<string, unknown>,
): Promise<ProviderResult> {
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
      ...provider.headers,
    },
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : {};

  if (!response.ok) {
    const errorMessage =
      extractProviderErrorMessage(data) || response.statusText;
    const error = new Error(errorMessage) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const content = extractChatContent(data);
  if (!content) {
    throw new Error(`Empty content returned by ${provider.name}`);
  }

  return {
    content,
    model: provider.model,
  };
}

function safeJsonParse(rawText: string): Record<string, unknown> {
  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function extractProviderErrorMessage(data: unknown): string | null {
  // O endpoint compatível do Gemini às vezes devolve o erro dentro de um array.
  if (Array.isArray(data)) return extractProviderErrorMessage(data[0]);
  if (!data || typeof data !== 'object' || !('error' in data)) return null;

  const error = data.error;
  if (!error || typeof error !== 'object') return null;

  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return null;
}

function extractChatContent(data: Record<string, unknown>) {
  const choices = data.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;

  const firstChoice = choices[0];
  if (!firstChoice || typeof firstChoice !== 'object') return null;

  const message = 'message' in firstChoice ? firstChoice.message : null;
  if (!message || typeof message !== 'object') return null;

  if ('content' in message) {
    if (typeof message.content === 'string') {
      return message.content;
    }

    if (Array.isArray(message.content)) {
      return message.content
        .map((part: unknown) => {
          if (!part || typeof part !== 'object') return '';
          if ('text' in part && typeof part.text === 'string') return part.text;
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }
  }

  return null;
}

function extractItemsFromJson(text: string) {
  const normalized = text.trim();
  const fenceMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonCandidate = (fenceMatch?.[1] || normalized).trim();

  const directItems = tryParseItems(jsonCandidate);
  if (directItems) return directItems;

  const objectMatch = jsonCandidate.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const parsedItems = tryParseItems(objectMatch[0]);
    if (parsedItems) return parsedItems;
  }

  return null;
}

function tryParseItems(jsonText: string): GeneratedItem[] | null {
  try {
    const parsed = JSON.parse(jsonText) as { items?: unknown };
    if (!Array.isArray(parsed.items)) return null;

    return parsed.items
      .map((item: unknown): GeneratedItem | null => {
        // Aceita {"value","aliases"} e também string solta.
        if (typeof item === 'string') {
          return { value: sanitizeItem(item), aliases: [] };
        }
        if (!item || typeof item !== 'object') return null;
        if (!('value' in item) || typeof item.value !== 'string') return null;

        const aliases =
          'aliases' in item && Array.isArray(item.aliases)
            ? item.aliases.filter((a: unknown): a is string => typeof a === 'string')
            : [];

        return {
          value: sanitizeItem(item.value),
          aliases: aliases.map(sanitizeItem).filter(Boolean),
        };
      })
      .filter((item): item is GeneratedItem => item !== null && !!item.value);
  } catch {
    return null;
  }
}

function extractItemsFromLines(text: string): GeneratedItem[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*\d+[.)-]?\s*/, '').trim())
    .map((line) => ({ value: sanitizeItem(line), aliases: [] }))
    .filter((item) => !!item.value && !/[{}[\]]/.test(item.value));
}

/** Tira aspas/marcadores das bordas e detalhes entre parênteses ("Titanic (1997)"). */
function sanitizeItem(value: string) {
  return value
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^["'\-•\s]+/, '')
    .replace(/["'\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function itemKey(value: string) {
  return value.toLocaleLowerCase('pt-BR');
}

/**
 * Remove itens repetidos e aliases que repetem um item ou que aparecem em
 * mais de um item — um palpite nunca pode casar com dois itens.
 */
function dedupeItems(items: GeneratedItem[]): GeneratedItem[] {
  const valueKeys = new Set<string>();
  const unique: GeneratedItem[] = [];

  for (const item of items) {
    const key = itemKey(item.value);
    if (!key || valueKeys.has(key)) continue;
    valueKeys.add(key);
    unique.push(item);
  }

  const aliasOwners = new Map<string, number>();
  unique.forEach((item) =>
    new Set(item.aliases.map(itemKey)).forEach((key) =>
      aliasOwners.set(key, (aliasOwners.get(key) ?? 0) + 1),
    ),
  );

  return unique.map((item) => {
    const aliases = item.aliases.filter((alias) => {
      const key = itemKey(alias);
      return !valueKeys.has(key) && aliasOwners.get(key) === 1;
    });

    return {
      value: item.value,
      aliases: Array.from(new Set(aliases)).slice(0, MAX_ALIASES_PER_ITEM),
    };
  });
}

function buildRankingFromText(text: string): GeneratedItem[] {
  const items = extractItemsFromJson(text) ?? extractItemsFromLines(text);
  return dedupeItems(items).slice(0, MAX_RANKING_ITEMS);
}

async function generateWithProvider(
  provider: ProviderConfig,
  theme: string,
): Promise<RankingGenerationResult> {
  if (!provider.apiKey) {
    throw new Error(`${provider.name.toUpperCase()}_API_KEY_NOT_CONFIGURED`);
  }

  let items: GeneratedItem[] = [];

  for (let attempt = 0; attempt < 3 && items.length < MAX_RANKING_ITEMS; attempt++) {
    const existingValues = items.map((item) => item.value);
    let result: ProviderResult;

    try {
      result = await Promise.race([
        postJson(provider, {
          model: provider.model,
          messages: buildMessages(theme, existingValues),
          temperature: attempt === 0 ? 0.3 : 0.5,
          max_tokens: provider.maxTokens ?? getMaxTokens(existingValues),
          ...provider.extraBody,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`${provider.name.toUpperCase()}_TIMEOUT`)),
            GENERATION_TIMEOUT_MS,
          ),
        ),
      ]);
    } catch (error) {
      // Falha na continuação não descarta o que já veio: o tamanho mínimo
      // decide abaixo se dá para jogar (tema pequeno, DOMAIN §5).
      if (items.length === 0) throw error;
      console.warn(`Ranking continuation failed for provider ${provider.name}.`, {
        items: items.length,
        message: (error as Error).message,
      });
      break;
    }

    const previousCount = items.length;
    items = dedupeItems([...items, ...buildRankingFromText(result.content)]);

    // Continuação sem item novo = o tema acabou (tema pequeno, DOMAIN §5).
    if (items.length === previousCount) break;
  }

  if (items.length < MIN_AI_RANKING_ITEMS) {
    throw new Error('INSUFFICIENT_ITEMS_FROM_PROVIDER');
  }

  const ranking = items.slice(0, MAX_RANKING_ITEMS).map((item, index) => ({
    position: index + 1,
    value: item.value,
    ...(item.aliases.length > 0 ? { aliases: item.aliases } : {}),
  }));

  return {
    ranking,
    source: provider.name,
    warning: `Ranking generated by ${provider.name} using model ${provider.model}.`,
  };
}

async function probeProvider(
  provider: ProviderConfig,
): Promise<ProviderHealth> {
  if (!provider.apiKey) {
    return {
      provider: provider.name,
      configured: false,
      model: provider.model,
      ok: false,
      message: `${provider.name.toUpperCase()}_API_KEY_NOT_CONFIGURED`,
    };
  }

  try {
    await Promise.race([
      postJson(provider, {
        model: provider.model,
        messages: [
          {
            role: 'system',
            content: 'Responda apenas com a palavra ok.',
          },
          {
            role: 'user',
            content: 'ok',
          },
        ],
        temperature: 0.1,
        max_tokens: provider.maxTokens ?? 8,
        ...provider.extraBody,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`${provider.name.toUpperCase()}_TIMEOUT`)),
          12000,
        ),
      ),
    ]);

    return {
      provider: provider.name,
      configured: true,
      model: provider.model,
      ok: true,
      message: 'ok',
    };
  } catch (error: unknown) {
    const err = error as Error & { status?: number };
    return {
      provider: provider.name,
      configured: true,
      model: provider.model,
      ok: false,
      status: err.status,
      message: err.message,
    };
  }
}

export async function checkRankingProviders() {
  const providers = await Promise.all(
    getProviderConfigs().map((provider) => probeProvider(provider)),
  );

  return {
    ok: providers.some((provider) => provider.ok),
    providers,
  };
}

export async function generateRanking(
  theme: string,
): Promise<RankingGenerationResult> {
  const failures: RankingGenerationError['details'] = [];

  for (const provider of getProviderConfigs()) {
    try {
      return await generateWithProvider(provider, theme);
    } catch (error: unknown) {
      const err = error as Error & { status?: number };
      failures.push({
        provider: provider.name,
        model: provider.model,
        status: err.status,
        message: err.message,
      });

      console.error(
        `Ranking generation failed for provider ${provider.name}.`,
        {
          model: provider.model,
          status: err.status,
          message: err.message,
        },
      );
    }
  }

  throw new RankingGenerationError('ALL_PROVIDERS_FAILED', failures);
}
