"use client";

import { useSyncExternalStore } from "react";
import RetroButton from "./RetroButton";
import RetroCard from "./RetroCard";
import Chip from "./Chip";

const ONBOARDING_SEEN_KEY = "onboardingSeen";
const ONBOARDING_SEEN_EVENT = "onboarding-seen-change";

const STEPS = [
  {
    color: "pink",
    title: "Como funciona",
    text: "Cada rodada tem um tema com um Top 100 secreto. Chute um item da lista antes do tempo acabar.",
  },
  {
    color: "cyan",
    title: "Quanto mais baixo, melhor",
    text: "Pontos = posição no ranking. Acertar a posição 1 vale 1 ponto; acertar a posição 98 vale 98. Chutar o óbvio vale pouco!",
  },
  {
    color: "yellow",
    title: "Vença a partida",
    text: "Cada item só pontua uma vez por partida. Some mais pontos que os outros jogadores até o fim para vencer.",
  },
] as const;

function subscribe(callback: () => void) {
  window.addEventListener(ONBOARDING_SEEN_EVENT, callback);
  return () => window.removeEventListener(ONBOARDING_SEEN_EVENT, callback);
}

function getSnapshot() {
  return localStorage.getItem(ONBOARDING_SEEN_KEY) !== "true";
}

function getServerSnapshot() {
  return false;
}

export default function OnboardingOverlay() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function handleStart() {
    localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    window.dispatchEvent(new Event(ONBOARDING_SEEN_EVENT));
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-center text-3xl font-bold tracking-widest text-retro-yellow drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
          TOP 100
        </h1>
        <p className="text-center text-sm tracking-wide text-white">
          O jogo de rankings ocultos
        </p>

        <div className="space-y-3">
          {STEPS.map((step, index) => (
            <RetroCard key={step.title} color={step.color}>
              <div className="flex items-start gap-3">
                <Chip color={step.color}>{index + 1}</Chip>
                <div>
                  <h2 className="font-bold uppercase">{step.title}</h2>
                  <p className="mt-1 text-sm text-gray-700">{step.text}</p>
                </div>
              </div>
            </RetroCard>
          ))}
        </div>

        <RetroButton onClick={handleStart} className="w-full">
          Começar
        </RetroButton>
      </div>
    </div>
  );
}
