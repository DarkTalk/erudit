"use client";

const LETTERS = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя".split("");

interface LetterPickerProps {
  onSelect: (letter: string) => void;
  onCancel: () => void;
}

export function LetterPicker({ onSelect, onCancel }: LetterPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          Выберите букву для пустой фишки
        </h3>
        <div className="grid grid-cols-8 gap-1.5 mb-4">
          {LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => onSelect(letter)}
              className="aspect-square rounded-lg bg-amber-100 text-amber-950 font-serif font-bold text-sm hover:bg-amber-200 transition-colors"
            >
              {letter.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
