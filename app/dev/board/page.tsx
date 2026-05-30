import { notFound } from "next/navigation";
import { BoardPreview } from "./BoardPreview";

export default function DevBoardPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <BoardPreview />;
}
