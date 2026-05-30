import Link from "next/link";

export function BackLink({ href = "/", label = "← Назад" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-board)] transition-colors mb-6"
    >
      {label}
    </Link>
  );
}
