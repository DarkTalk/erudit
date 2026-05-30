import clsx from "clsx";
import { tilePoints } from "@/lib/tiles";

interface TileProps {
  letter: string;
  isBlank?: boolean;
  points?: number;
  size?: "sm" | "md" | "lg";
  variant?: "rack" | "board";
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
  variant = "rack",
  selected,
  disabled,
  onClick,
  draggable,
  onDragStart,
  className,
}: TileProps) {
  const displayLetter = isBlank && letter === "?" ? "" : letter.toUpperCase();
  const pts = points ?? (isBlank ? 0 : tilePoints(letter));
  const isRack = variant === "rack";

  const sizeClasses = {
    sm: "w-7 h-7 text-[clamp(8px,2vw,14px)]",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-lg",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      draggable={draggable && !disabled}
      onDragStart={onDragStart}
      onClick={onClick}
      className={clsx(
        "relative flex items-center justify-center rounded-[4px] font-serif font-semibold",
        "bg-[#3d2f1e] text-[#f5e8d0]",
        "shadow-[0_2px_0_#1a100a]",
        "transition-[transform,box-shadow] duration-150 ease-out select-none",
        sizeClasses[size],
        variant === "board" && "animate-tile-place !cursor-default",
        isRack &&
          !disabled &&
          onClick &&
          "hover:-translate-y-0.5 hover:shadow-[0_4px_0_#1a100a] cursor-pointer",
        selected &&
          isRack &&
          "ring-2 ring-[#9a5a3a]/50 -translate-y-0.5 shadow-[0_4px_0_#1a100a]",
        isBlank && "bg-[#4a3d2c] text-[#e8dcc8]",
        className
      )}
    >
      <span className="leading-none tracking-wide">{displayLetter}</span>
      {pts > 0 && (
        <span
          className={clsx(
            "absolute font-sans font-medium leading-none pointer-events-none",
            "text-[#f5e8d0]/45",
            size === "sm" ? "bottom-[2px] right-[2px] text-[6px]" : "bottom-0.5 right-0.5 text-[8px]"
          )}
        >
          {pts}
        </span>
      )}
    </button>
  );
}
