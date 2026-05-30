"use client";

import { useMemo } from "react";
import { GameBoard } from "@/components/GameBoard";
import { createHomeDemoBoard } from "@/lib/demo-board";

export function HomeDemoBoard() {
  const board = useMemo(() => createHomeDemoBoard(), []);

  return (
    <div className="flex justify-center pt-2">
      <GameBoard board={board} pending={[]} interactive={false} compact />
    </div>
  );
}
