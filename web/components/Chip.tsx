import { ReactNode } from "react";
import { RetroColor } from "./RetroCard";

const BG_CLASS: Record<RetroColor, string> = {
  pink: "bg-retro-pink text-white",
  cyan: "bg-retro-cyan text-gray-900",
  yellow: "bg-retro-yellow text-gray-900",
  green: "bg-retro-green text-white",
  red: "bg-retro-red text-white",
};

type Props = {
  color: RetroColor;
  children: ReactNode;
  className?: string;
};

/** Quadrado colorido (docs/DESIGN.md) usado para posicoes/ranks e indicadores curtos. */
export default function Chip({ color, children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center border-2 border-gray-900 font-mono text-sm font-bold ${BG_CLASS[color]} ${className}`}
    >
      {children}
    </span>
  );
}
