import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";

export const metadata: Metadata = {
  title: "Эрудит с друзьями — комната по ссылке онлайн",
  description:
    "Создайте комнату и отправьте ссылку друзьям — они подключатся без регистрации. Игра в реальном времени, режимы «Обычный» и «Кроссворд», таймер на ход.",
};

export default function FriendsPage() {
  return <HomePage />;
}
