import dictionaryWords from "./dictionary.json";

const dictionary = new Set(dictionaryWords as string[]);
const sevenLetterWords = (dictionaryWords as string[]).filter((w) => w.length === 7);
const wordsByLength: string[][] = [];
for (const word of dictionaryWords as string[]) {
  if (word.length < 2 || word.length > 7) continue;
  if (!wordsByLength[word.length]) wordsByLength[word.length] = [];
  wordsByLength[word.length]!.push(word);
}

export function getCandidateWords(maxLength: number): string[] {
  const result: string[] = [];
  for (let len = 2; len <= Math.min(maxLength, 7); len++) {
    const bucket = wordsByLength[len];
    if (bucket) result.push(...bucket);
  }
  return result;
}

export function isValidWord(word: string): boolean {
  const normalized = word.toLowerCase().replace(/ё/g, "е");
  if (normalized.length < 2) return false;
  return dictionary.has(normalized);
}

export function getDictionarySize(): number {
  return dictionary.size;
}

export function pickRandomSevenLetterWord(): string {
  if (sevenLetterWords.length === 0) {
    throw new Error("В словаре нет слов из 7 букв");
  }
  const word = sevenLetterWords[Math.floor(Math.random() * sevenLetterWords.length)]!;
  return word.toUpperCase();
}
