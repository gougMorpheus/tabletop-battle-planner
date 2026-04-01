import { create } from "zustand";

export type Phase = "Command" | "Movement" | "Shooting" | "Charge" | "Fight";

type PlayerState = {
  vp: number;
  cp: number;
};

type GameTrackerState = {
  playerA: PlayerState;
  playerB: PlayerState;
  battleRound: number;
  activePlayer: "A" | "B";
  phase: Phase;
  adjustPlayer: (player: "A" | "B", field: "vp" | "cp", delta: number) => void;
  setBattleRound: (round: number) => void;
  nextPhase: () => void;
  prevPhase: () => void;
  toggleActivePlayer: () => void;
  setTrackerState: (state: {
    playerA: PlayerState;
    playerB: PlayerState;
    battleRound: number;
    activePlayer: "A" | "B";
    phase: Phase;
  }) => void;
};

const phases: Phase[] = ["Command", "Movement", "Shooting", "Charge", "Fight"];

export const useGameTrackerStore = create<GameTrackerState>((set) => ({
  playerA: { vp: 0, cp: 0 },
  playerB: { vp: 0, cp: 0 },
  battleRound: 1,
  activePlayer: "A",
  phase: "Command",
  adjustPlayer: (player, field, delta) =>
    set((state) => ({
      ...state,
      playerA:
        player === "A"
          ? { ...state.playerA, [field]: Math.max(0, state.playerA[field] + delta) }
          : state.playerA,
      playerB:
        player === "B"
          ? { ...state.playerB, [field]: Math.max(0, state.playerB[field] + delta) }
          : state.playerB,
    })),
  setBattleRound: (round) =>
    set({ battleRound: Math.max(1, Math.floor(round || 1)) }),
  nextPhase: () =>
    set((state) => {
      const index = phases.indexOf(state.phase);
      return { phase: phases[(index + 1) % phases.length] };
    }),
  prevPhase: () =>
    set((state) => {
      const index = phases.indexOf(state.phase);
      return { phase: phases[(index - 1 + phases.length) % phases.length] };
    }),
  toggleActivePlayer: () =>
    set((state) => ({
      activePlayer: state.activePlayer === "A" ? "B" : "A",
    })),
  setTrackerState: (state) =>
    set({
      playerA: state.playerA,
      playerB: state.playerB,
      battleRound: state.battleRound,
      activePlayer: state.activePlayer,
      phase: state.phase,
    }),
}));
