import { GoogleGenerativeAI } from '@google/generative-ai';

const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  }

  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

function buildFallbackRanking(theme: string) {
  return Array.from({ length: 100 }, (_, index) => ({
    position: index + 1,
    value: `${theme} - item ${index + 1}`,
  }));
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
export async function generateRanking(theme: string) {
  const model = genAI.getGenerativeModel({
    // model: 'gemini-3-flash-preview',
    model: 'gemini-2.0-flash-lite',
  });

export async function generateRanking(theme: string) {
  const prompt = `
Gere um ranking TOP 100 sobre o seguinte tema:

Tema: ${theme}

Regras:
- Exatamente 100 itens
- Ordenados do mais popular/importante para o menos
- Apenas lista numerada
- Sem explicações
`;

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const genAI = getClient();
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = (await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout Gemini')), 60000),
        ),
      ])) as import('@google/generative-ai').GenerateContentResult;

      const text = result.response.text();
      const lines = text
        .split('\n')
        .map((line: string) => line.replace(/^\d+[.)-]\s*/, '').trim())
        .filter(Boolean);

      if (lines.length < 20) {
        throw new Error('GEMINI_INSUFFICIENT_ITEMS');
      }

      return lines.slice(0, 100).map((value: string, index: number) => ({
        position: index + 1,
        value,
      }));
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const status = err?.status;
      const shouldRetry = status === 429 || status === 503;

      if (attempt < maxAttempts && shouldRetry) {
        await sleep(attempt * 1500);
        continue;
      }

      console.error('Gemini unavailable, using fallback ranking.', {
        status,
        message: err?.message,
      });

      return buildFallbackRanking(theme);
    }
  }

  return buildFallbackRanking(theme);
}
