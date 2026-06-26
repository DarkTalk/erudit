import type { Metadata } from "next";
import { ModePickerPage } from "@/components/ModePickerPage";

export const metadata: Metadata = {
  title: "Эрудит онлайн — играть бесплатно без регистрации",
  description:
    "Онлайн-версия классической игры Эрудит (Скрабл). Играйте с друзьями по ссылке, с ботом или с случайным соперником",
};

export default function Page() {
  return <ModePickerPage />;
}
