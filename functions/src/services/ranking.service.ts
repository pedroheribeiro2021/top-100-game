type RankingItem = {
  position: number;
  value: string;
};

export type RankingGenerationResult = {
  ranking: RankingItem[];
  source: 'groq' | 'openrouter';
  warning: string | null;
};

type ProviderResult = {
  content: string;
  model: string;
};

type ProviderConfig = {
  name: 'groq' | 'openrouter';
  model: string;
  apiKey: string | undefined;
  endpoint: string;
  headers?: Record<string, string>;
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

  return [
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

function buildMessages(theme: string, existingItems: string[] = []) {
  const remainingItems = 100 - existingItems.length;

  if (existingItems.length === 0) {
    return [
      {
        role: 'system',
        content: [
          'Voce gera rankings para um jogo multiplayer.',
          'Responda somente com os itens do ranking.',
          'Sem markdown, sem comentarios e sem introducao.',
          'Entregue exatamente 100 itens, um por linha.',
          'Os itens devem ser curtos, claros e unicos.',
          'Ordene do mais popular/relevante para o menos popular/relevante.',
        ].join(' '),
      },
      {
        role: 'user',
        content: [
          `Tema: ${theme}`,
          'Gere um top 100 para esse tema.',
          'Cada item deve ocupar uma linha separada.',
          'Nao use numeracao obrigatoriamente, mas pode usar se quiser.',
          'Nao escreva explicacoes.',
        ].join('\n'),
      },
    ];
  }

  return [
    {
      role: 'system',
      content: [
        'Voce gera rankings para um jogo multiplayer.',
        'Responda somente com os itens faltantes, um por linha.',
        'Sem markdown, sem comentarios, sem repetir itens ja usados.',
        'Nao reinicie o ranking do zero.',
        'Ordene do mais popular/relevante para o menos popular/relevante.',
      ].join(' '),
    },
    {
      role: 'user',
      content: [
        `Tema: ${theme}`,
        `Ja temos estes ${existingItems.length} itens:`,
        existingItems.map((item, index) => `${index + 1}. ${item}`).join('\n'),
        `Continue a lista a partir do item ${existingItems.length + 1} ate o item 100.`,
        `Entregue exatamente ${remainingItems} itens faltantes, um por linha.`,
        'Nao repita nenhum item acima.',
      ].join('\n'),
    },
  ];
}

function getMaxTokens(existingItems: string[]) {
  if (existingItems.length === 0) return 900;
  if (existingItems.length < 60) return 700;
  return 500;
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

function extractProviderErrorMessage(data: Record<string, unknown>) {
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

function tryParseItems(jsonText: string) {
  try {
    const parsed = JSON.parse(jsonText) as { items?: unknown };
    if (!Array.isArray(parsed.items)) return null;

    return parsed.items
      .filter((item): item is string => typeof item === 'string')
      .map((item) => sanitizeItem(item))
      .filter(Boolean);
  } catch {
    return null;
  }
}

function extractItemsFromLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*\d+[.)-]?\s*/, '').trim())
    .map((line) => sanitizeItem(line))
    .filter(Boolean);
}

function sanitizeItem(value: string) {
  return value
    .replace(/^["'\-•\s]+/, '')
    .replace(/["'\s]+$/, '')
    .trim();
}

function dedupeItems(items: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const key = item.toLocaleLowerCase('pt-BR');
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function buildRankingFromText(text: string) {
  const jsonItems = extractItemsFromJson(text);
  const fallbackItems = extractItemsFromLines(text);
  const items = dedupeItems(
    jsonItems && jsonItems.length > 0 ? jsonItems : fallbackItems,
  );
  return items.slice(0, 100);
}

async function generateWithProvider(
  provider: ProviderConfig,
  theme: string,
): Promise<RankingGenerationResult> {
  if (!provider.apiKey) {
    throw new Error(`${provider.name.toUpperCase()}_API_KEY_NOT_CONFIGURED`);
  }

  let items: string[] = [];

  for (let attempt = 0; attempt < 3 && items.length < 100; attempt++) {
    const result = await Promise.race([
      postJson(provider, {
        model: provider.model,
        messages: buildMessages(theme, items),
        temperature: attempt === 0 ? 0.3 : 0.5,
        max_tokens: getMaxTokens(items),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`${provider.name.toUpperCase()}_TIMEOUT`)),
          25000,
        ),
      ),
    ]);

    const extractedItems = buildRankingFromText(result.content);
    items = dedupeItems([...items, ...extractedItems]);
  }

  if (items.length < 100) {
    throw new Error('INSUFFICIENT_ITEMS_FROM_PROVIDER');
  }

  const ranking = items.slice(0, 100).map((value, index) => ({
    position: index + 1,
    value,
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
        max_tokens: 8,
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
