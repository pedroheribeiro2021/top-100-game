import { ReactNode } from "react";

export type RetroColor = "pink" | "cyan" | "yellow" | "green" | "red";

const BORDER_CLASS: Record<RetroColor, string> = {
  pink: "border-retro-pink retro-shadow-pink",
  cyan: "border-retro-cyan retro-shadow-cyan",
  yellow: "border-retro-yellow retro-shadow-yellow",
  green: "border-retro-green retro-shadow-green",
  red: "border-retro-red retro-shadow-red",
};

type Props = {
  color?: RetroColor;
  className?: string;
  children: ReactNode;
};

export default function RetroCard({ color = "pink", className = "", children }: Props) {
  return (
    <div
      className={`border-4 bg-white p-4 text-gray-900 ${BORDER_CLASS[color]} ${className}`}
    >
      {children}
    </div>
  );
}
