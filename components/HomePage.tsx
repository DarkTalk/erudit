"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "w-full px-5 py-4 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-board)] focus:ring-2 focus:ring-[var(--color-board-light)] transition-all text-center text-lg";

export function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async () => {
    if (!name.trim()) {
      setError("Введите имя");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      localStorage.setItem(
        `erudit_session_${data.gameId}`,
        JSON.stringify({ playerId: data.playerId, playerName: name.trim() })
      );
      router.push(`/game/${data.gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const joinGame = () => {
    if (!name.trim()) {
      setError("Введите имя");
      return;
    }
    const code = gameCode.trim();
    if (!code) {
      setError("Введите код игры");
      return;
    }
    setError(null);
    sessionStorage.setItem("erudit_pending_name", name.trim());
    router.push(`/game/${code}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="text-center mb-10 max-w-lg">
        <h1 className="text-5xl sm:text-6xl font-bold font-serif text-[var(--color-board)] tracking-tight">
          Эрудит
        </h1>
        <p className="text-[var(--color-ink-muted)] mt-3 text-lg leading-relaxed">
          Составляйте слова, набирайте очки и играйте с друзьями по одной ссылке
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !gameCode.trim() && createGame()}
          placeholder="Ваше имя"
          maxLength={20}
          className={inputClass}
        />

        <input
          type="text"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && joinGame()}
          placeholder="Код игры (для входа)"
          maxLength={12}
          className={`${inputClass} text-base tracking-widest font-mono`}
        />

        <button
          type="button"
          onClick={createGame}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-[var(--color-board)] text-white font-semibold text-lg hover:bg-[var(--color-board-hover)] transition-colors disabled:opacity-50"
        >
          {loading ? "Создание..." : "Создать игру"}
        </button>

        <button
          type="button"
          onClick={joinGame}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-ink)] font-semibold text-lg hover:border-[var(--color-board)] hover:bg-[var(--color-board-light)] transition-colors disabled:opacity-50"
        >
          Присоединиться к игре
        </button>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </div>

      <div className="mt-16 grid grid-cols-3 gap-8 text-center max-w-xl">
        <Feature title="По ссылке" desc="Пригласите друзей одной ссылкой" />
        <Feature title="51K+ слов" desc="Большой словарь существительных" />
        <Feature title="Онлайн" desc="Игра в реальном времени" />
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <p className="text-[var(--color-ink)] font-semibold text-sm">{title}</p>
      <p className="text-[var(--color-ink-muted)] text-xs mt-1.5 leading-relaxed">{desc}</p>
    </div>
  );
}
