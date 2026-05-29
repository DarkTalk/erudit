"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="text-center mb-10">
        <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-amber-200 via-violet-200 to-fuchsia-200 bg-clip-text text-transparent font-serif">
          Эрудит
        </h1>
        <p className="text-white/50 mt-3 text-lg max-w-md mx-auto">
          Составляйте слова, набирайте очки и играйте с друзьями по одной ссылке
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createGame()}
          placeholder="Ваше имя"
          maxLength={20}
          className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 transition-all text-center text-lg"
        />

        <button
          type="button"
          onClick={createGame}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xl shadow-violet-500/20"
        >
          {loading ? "Создание..." : "Создать игру"}
        </button>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      <div className="mt-16 grid grid-cols-3 gap-6 text-center max-w-lg">
        <Feature icon="🔗" title="По ссылке" desc="Пригласите друзей одной ссылкой" />
        <Feature icon="📖" title="51K+ слов" desc="Большой словарь существительных" />
        <Feature icon="⚡" title="Онлайн" desc="Игра в реальном времени" />
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-white/80 font-medium text-sm">{title}</p>
      <p className="text-white/40 text-xs mt-1">{desc}</p>
    </div>
  );
}
