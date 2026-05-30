export const LETTER_POINTS: Record<string, number> = {
  а: 1, б: 3, в: 2, г: 2, д: 2, е: 1, ё: 3, ж: 3, з: 3,
  и: 1, й: 5, к: 2, л: 2, м: 2, н: 1, о: 1, п: 2, р: 1,
  с: 1, т: 1, у: 2, ф: 5, х: 5, ц: 4, ч: 4, ш: 4, щ: 10,
  ъ: 10, ы: 4, ь:  4, э: 5, ю: 5, я: 3,
};

export const LETTER_COUNTS: Record<string, number> = {
  а: 8, б: 3, в: 4, г: 2, д: 4, е: 8, ё: 1, ж: 1, з: 1,
  и: 5, й: 1, к: 5, л: 4, м: 3, н: 6, о: 10, п: 4, р: 5,
  с: 8, т: 6, у: 4, ф: 1, х: 1, ц: 1, ч: 1, ш: 1, щ: 1,
  ъ: 1, ы: 2, ь: 2, э: 1, ю: 1, я: 1,
};

export const BLANK_COUNT = 2;

export const FULL_TILE_BAG_SIZE =
  Object.values(LETTER_COUNTS).reduce((sum, n) => sum + n, 0) + BLANK_COUNT;

export function tilePoints(letter: string, isBlank?: boolean): number {
  if (isBlank) return 0;
  return LETTER_POINTS[letter.toLowerCase()] ?? 0;
}

export function createTileBag(size = FULL_TILE_BAG_SIZE): { id: string; letter: string; isBlank?: boolean }[] {
  const bag: { id: string; letter: string; isBlank?: boolean }[] = [];
  let idx = 0;

  for (const [letter, count] of Object.entries(LETTER_COUNTS)) {
    for (let i = 0; i < count; i++) {
      bag.push({ id: `t${idx++}`, letter });
    }
  }
  for (let i = 0; i < BLANK_COUNT; i++) {
    bag.push({ id: `t${idx++}`, letter: "?", isBlank: true });
  }

  const shuffled = shuffle(bag);
  const clamped = Math.min(Math.max(size, 1), shuffled.length);
  return shuffled.slice(0, clamped);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawTiles(
  bag: { id: string; letter: string; isBlank?: boolean }[],
  count: number
): [{ id: string; letter: string; isBlank?: boolean }[], { id: string; letter: string; isBlank?: boolean }[]] {
  const drawn = bag.splice(0, count);
  return [drawn, bag];
}
