const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001/top-100-game/us-central1/api";

//
// CREATE GAME
//
export async function createGame(theme: string) {
  const response = await fetch(`${API_URL}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme }),
  });

  if (!response.ok) throw new Error("Failed to create game");
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

  if (!response.ok) throw new Error("Failed to join game");
  return response.json();
}

//
// START GAME
//
export async function startGame(id: string) {
  const response = await fetch(`${API_URL}/games/${id}/start`, {
    method: "POST",
  });

  if (!response.ok) throw new Error("Failed to start game");
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
