import { GoogleGenerativeAI } from '@google/generative-ai';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateRanking(theme: string) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
  });

  const prompt = `
Gere um ranking TOP 100 sobre o seguinte tema:

Tema: ${theme}

Regras:
- Exatamente 100 itens
- Ordenados do mais popular/importante para o menos
- Apenas lista numerada
- Sem explicações
`;

  //   const result = await model.generateContent(prompt);
  const result = (await Promise.race([
    model.generateContent(prompt),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout Gemini')), 100000),
    ),
  ])) as import('@google/generative-ai').GenerateContentResult;

  const text = result.response.text();
  console.log('Resposta bruta do Gemini:', text);

  const lines = text
    .split('\n')
    .map((line) => line.replace(/^\d+[\\.\-\\)]\s*/, '').trim())
    .filter(Boolean);

  if (lines.length < 5) {
    throw new Error('Gemini retornou poucos itens');
  }

  // Converte para seu formato atual
  return lines.slice(0, 100).map((value, index) => ({
    position: index + 1,
    value,
  }));
}
