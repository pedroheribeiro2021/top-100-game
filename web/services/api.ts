const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001/YOUR_PROJECT_ID/us-central1/api";

export async function getGameByCode(code: string) {
  const response = await fetch(`${API_URL}/game/${code}`);
  if (!response.ok) throw new Error("Game not found");
  return response.json();
}

export async function createGame(theme: string) {
  const response = await fetch(`${API_URL}/game`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme }),
  });

  if (!response.ok) throw new Error("Failed to create game");
  return response.json();
}

export async function submitAnswer(
  gameCode: string,
  playerId: string,
  answer: string
) {
  const response = await fetch(`${API_URL}/game/${gameCode}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, answer }),
  });

  if (!response.ok) throw new Error("Failed to submit answer");
  return response.json();
}