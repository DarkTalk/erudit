import type { Metadata } from "next";
import { BotGamePage } from "@/components/BotGamePage";

export const metadata: Metadata = {
  title: "Эрудит против компьютера — разные сложности",
  description:
    "Играйте в Эрудит с компьютером в любое время. Выбирайте сложность бота, тренируйте словарный запас и учитесь строить выгодные комбинации без спешки.",
};

export default function BotPage() {
  return <BotGamePage />;
}
