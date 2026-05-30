import clsx from "clsx";
import { tilePoints } from "@/lib/tiles";

interface TileProps {
  letter: string;
  isBlank?: boolean;
  points?: number;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
}

export function Tile({
  letter,
  isBlank,
  points,
  size = "md",
  selected,
  disabled,
  onClick,
  draggable,
  onDragStart,
  className,
}: TileProps) {
  const displayLetter = isBlank && letter === "?" ? "" : letter.toUpperCase();
  const pts = points ?? (isBlank ? 0 : tilePoints(letter));

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      draggable={draggable && !disabled}
      onDragStart={onDragStart}
      onClick={onClick}
      className={clsx(
        "relative flex items-center justify-center rounded-md font-serif font-bold",
        "bg-gradient-to-b from-amber-100 to-amber-300 text-amber-950",
        "border-2 border-amber-400/60 shadow-md",
        "transition-all duration-150 select-none",
        sizeClasses[size],
        selected && "ring-2 ring-[var(--color-board)] scale-105 -translate-y-1 shadow-lg",
        !disabled && onClick && "hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer",
        disabled && "opacity-60 cursor-default",
        isBlank && "from-stone-100 to-stone-300 border-stone-400/60",
        className
      )}
    >
      <span className="leading-none">{displayLetter}</span>
      {pts > 0 && (
        <span className="absolute bottom-0.5 right-0.5 text-[8px] font-sans font-semibold opacity-70">
          {pts}
        </span>
      )}
    </button>
  );
}
