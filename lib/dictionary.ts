import dictionaryWords from "./dictionary.json";

const dictionary = new Set(dictionaryWords as string[]);
const sevenLetterWords = (dictionaryWords as string[]).filter((w) => w.length === 7);

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
