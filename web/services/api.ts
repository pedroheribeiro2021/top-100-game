const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001/api";

export type ThemeSummary = {
  id: string;
  title: string;
  category: string;
};

export class CreateGameError extends Error {
  constructor(
    message: string,
    readonly suggestions?: ThemeSummary[],
  ) {
    super(message);
  }
}

//
// LIST THEMES (banco de temas)
//
export async function getThemes(): Promise<ThemeSummary[]> {
  const response = await fetch(`${API_URL}/themes`);

  if (!response.ok) throw new Error("Failed to fetch themes");
  return response.json();
}

//
// CREATE GAME
//
export async function createGame(params: {
  theme?: string;
  themeId?: string;
  random?: boolean;
  hostName: string;
  maxRounds?: number;
  roundTimeLimit?: number;
}) {
  const response = await fetch(`${API_URL}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new CreateGameError(
      err?.error || "Failed to create game",
      err?.suggestions,
    );
  }
  return response.json();
}

//
// GET GAME BY ID
//
export async function getGameById(id: string) {
  const response = await fetch(`${API_URL}/games/${id}`);

  if (!response.ok) throw new Error("Game not found");
  return response.json();
}

//
// JOIN GAME
//
export async function joinGame(gameCode: string, playerName: string) {
  const response = await fetch(`${API_URL}/games/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameCode, playerName }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || "Failed to join game");
  }
  return response.json();
}

//
// START GAME
//
export async function startGame(id: string, playerId: string) {
  const response = await fetch(`${API_URL}/games/${id}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || "Failed to start game");
  }
  return response.json();
}

//
// SUBMIT ANSWER
//
export async function submitAnswer(
  id: string,
  playerId: string,
  answer: string,
) {
  const response = await fetch(`${API_URL}/games/${id}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, answer }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to submit answer");
  }
  return response.json();
}

export async function advanceRound(gameId: string) {
  const response = await fetch(`${API_URL}/games/${gameId}/advance`, {
    method: "POST",
  });

  if (!response.ok) throw new Error("Failed to advance round");

  return response.json();
}

//
// REMATCH (jogar novamente na mesma sala)
//
export async function rematchGame(gameId: string, playerId: string) {
  const response = await fetch(`${API_URL}/games/${gameId}/rematch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, random: true }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || "Failed to start rematch");
  }
  return response.json();
}
