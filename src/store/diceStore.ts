import { create } from "zustand";

type DiceSection = {
  countInput: string;
  target: number | null;
  results: number[];
  error: string | null;
};

type DiceState = {
  sections: DiceSection[];
  setCountInput: (index: number, input: string) => void;
  setTarget: (index: number, target: number | null) => void;
  rollSection: (index: number) => void;
  rollAll: () => void;
  resetAll: () => void;
};

const createSection = (): DiceSection => ({
  countInput: "",
  target: null,
  results: [],
  error: null,
});

const parseCount = (input: string) => {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { count: 0, error: "Enter a dice count." };
  }
  const count = Number(trimmed);
  if (!Number.isFinite(count) || count <= 0) {
    return { count: 0, error: "Count must be positive." };
  }
  return { count, error: null };
};

const rollDice = (count: number) =>
  Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);

export const useDiceStore = create<DiceState>((set) => ({
  sections: [createSection(), createSection(), createSection()],
  setCountInput: (index, input) =>
    set((state) => ({
      sections: state.sections.map((section, idx) =>
        idx === index ? { ...section, countInput: input, error: null } : section
      ),
    })),
  setTarget: (index, target) =>
    set((state) => ({
      sections: state.sections.map((section, idx) =>
        idx === index ? { ...section, target } : section
      ),
    })),
  rollSection: (index) =>
    set((state) => {
      const section = state.sections[index];
      if (!section) {
        return state;
      }
      const parsed = parseCount(section.countInput);
      if (parsed.error) {
        return {
          sections: state.sections.map((item, idx) =>
            idx === index
              ? {
                  ...item,
                  results: [],
                  error: parsed.error,
                }
              : item
          ),
        };
      }
      const results = rollDice(parsed.count);
      return {
        sections: state.sections.map((item, idx) =>
          idx === index
            ? {
                ...item,
                results,
                error: null,
              }
            : item
        ),
      };
    }),
  rollAll: () =>
    set((state) => ({
      sections: state.sections.map((section) => {
        const parsed = parseCount(section.countInput);
        if (parsed.error) {
          return {
            ...section,
            results: [],
            error: parsed.error,
          };
        }
        const results = rollDice(parsed.count);
        return {
          ...section,
          results,
          error: null,
        };
      }),
    })),
  resetAll: () =>
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        countInput: "",
        target: null,
        results: [],
        error: null,
      })),
    })),
}));
