import type { Metadata } from "next";
import { ModePickerPage } from "@/components/ModePickerPage";

export const metadata: Metadata = {
  title: "Эрудит играть онлайн без регистрации",
};

export default function Page() {
  return <ModePickerPage />;
}
