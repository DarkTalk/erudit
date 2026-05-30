"use client";

const LETTERS = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя".split("");

interface LetterPickerProps {
  onSelect: (letter: string) => void;
  onCancel: () => void;
}

export function LetterPicker({ onSelect, onCancel }: LetterPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 backdrop-blur-sm">
      <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4 text-center">
          Выберите букву для пустой фишки
        </h3>
        <div className="grid grid-cols-8 gap-1.5 mb-4">
          {LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => onSelect(letter)}
              className="aspect-square rounded-lg bg-amber-100 text-amber-950 font-serif font-bold text-sm hover:bg-amber-200 transition-colors border border-amber-200"
            >
              {letter.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 rounded-xl text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
