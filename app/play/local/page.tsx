import type { Metadata } from "next";
import { LocalGamePage } from "@/components/LocalGamePage";

export const metadata: Metadata = {
  title: "Эрудит за одним экраном — 2–4 игрока на устройстве",
  description:
    "Передавайте телефон или планшет по очереди — от 2 до 4 игроков за одним экраном. Отличный вариант для компании в дороге.",
};

export default function LocalPlayPage() {
  return <LocalGamePage />;
}
