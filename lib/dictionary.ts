import dictionaryWords from "./dictionary.json";

const dictionary = new Set(dictionaryWords as string[]);

export function isValidWord(word: string): boolean {
  const normalized = word.toLowerCase().replace(/ё/g, "е");
  if (normalized.length < 2) return false;
  return dictionary.has(normalized);
}

export function getDictionarySize(): number {
  return dictionary.size;
}
