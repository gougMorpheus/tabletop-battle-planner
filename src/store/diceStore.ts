import { create } from "zustand";

type DiceSection = {
  countInput: string;
  target: number | null;
  results: number[];
  error: string | null;
  lastRolledCount: number;
};

type DiceState = {
  sections: DiceSection[];
  setCountInput: (index: number, input: string) => void;
  setTarget: (index: number, target: number | null) => void;
  rollSection: (index: number) => void;
  rollSectionWithFollowUp: (index: number, followUp: boolean) => void;
  rollAll: () => void;
  resetAll: () => void;
};

const createSection = (): DiceSection => ({
  countInput: "",
  target: null,
  results: [],
  error: null,
  lastRolledCount: 0,
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
const countSuccesses = (results: number[], target: number | null) =>
  target === null ? 0 : results.filter((value) => value >= target).length;

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
                  lastRolledCount: 0,
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
                lastRolledCount: parsed.count,
              }
            : item
        ),
      };
    }),
  rollSectionWithFollowUp: (index, followUp) =>
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
                  lastRolledCount: 0,
                }
              : item
          ),
        };
      }
      const nextSections = state.sections.map((item, idx) =>
        idx === index
          ? {
              ...item,
              results: rollDice(parsed.count),
              error: null,
              lastRolledCount: parsed.count,
            }
          : item
      );
      if (!followUp) {
        return { sections: nextSections };
      }
      let successCount = countSuccesses(
        nextSections[index].results,
        nextSections[index].target
      );
      for (let idx = index + 1; idx < nextSections.length; idx += 1) {
        const target = nextSections[idx].target;
        if (target === null) {
          break;
        }
        const results = rollDice(Math.max(0, Math.floor(successCount)));
        nextSections[idx] = {
          ...nextSections[idx],
          results,
          error: null,
          lastRolledCount: results.length,
        };
        successCount = countSuccesses(results, target);
      }
      return { sections: nextSections };
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
            lastRolledCount: 0,
          };
        }
        const results = rollDice(parsed.count);
        return {
          ...section,
          results,
          error: null,
          lastRolledCount: parsed.count,
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
        lastRolledCount: 0,
      })),
    })),
}));
