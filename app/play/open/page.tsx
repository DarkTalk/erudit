import type { Metadata } from "next";
import { OpenGamePage } from "@/components/OpenGamePage";

export const metadata: Metadata = {
  title: "Эрудит онлайн — найти соперника",
  description:
    "Откройте комнату и ждите соперника или присоединитесь к уже открытой игре. Быстрый старт без лишних настроек — нашли соперника и сразу играете.",
};

export default function OpenPage() {
  return <OpenGamePage />;
}
