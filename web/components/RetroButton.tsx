import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "border-retro-pink-dark bg-retro-pink retro-shadow-pink text-white",
  secondary: "border-retro-yellow-dark bg-retro-yellow retro-shadow-yellow text-gray-900",
  outline: "border-retro-cyan-dark bg-white retro-shadow-cyan text-gray-900",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export default function RetroButton({
  variant = "primary",
  className = "",
  disabled,
  children,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled}
      className={`border-4 px-4 py-2 font-mono font-bold tracking-wide uppercase transition-transform ${VARIANT_CLASS[variant]} ${
        disabled
          ? "cursor-not-allowed opacity-40 shadow-none"
          : "active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
