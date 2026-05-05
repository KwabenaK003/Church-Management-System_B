import { create } from "zustand";

interface TableSelectionState {
  selections: Record<string, Set<string>>;
  addId: (scope: string, id: string) => void;
  removeId: (scope: string, id: string) => void;
  addIds: (scope: string, ids: string[]) => void;
  removeIds: (scope: string, ids: string[]) => void;
  clearScope: (scope: string) => void;
}

export const useTableSelectionStore = create<TableSelectionState>((set) => ({
  selections: {},
  addId: (scope, id) =>
    set((state) => {
      const currentSelection = state.selections[scope] ?? new Set<string>();
      if (currentSelection.has(id)) return state;

      const nextSelection = new Set(currentSelection);
      nextSelection.add(id);

      return {
        selections: {
          ...state.selections,
          [scope]: nextSelection,
        },
      };
    }),
  removeId: (scope, id) =>
    set((state) => {
      const currentSelection = state.selections[scope];
      if (!currentSelection || !currentSelection.has(id)) return state;

      const nextSelection = new Set(currentSelection);
      nextSelection.delete(id);

      return {
        selections: {
          ...state.selections,
          [scope]: nextSelection,
        },
      };
    }),
  addIds: (scope, ids) =>
    set((state) => {
      if (ids.length === 0) return state;

      const currentSelection = state.selections[scope] ?? new Set<string>();
      const nextSelection = new Set(currentSelection);
      let changed = false;

      for (const id of ids) {
        if (!nextSelection.has(id)) {
          nextSelection.add(id);
          changed = true;
        }
      }

      if (!changed) return state;

      return {
        selections: {
          ...state.selections,
          [scope]: nextSelection,
        },
      };
    }),
  removeIds: (scope, ids) =>
    set((state) => {
      if (ids.length === 0) return state;

      const currentSelection = state.selections[scope];
      if (!currentSelection || currentSelection.size === 0) return state;

      const nextSelection = new Set(currentSelection);
      let changed = false;

      for (const id of ids) {
        if (nextSelection.has(id)) {
          nextSelection.delete(id);
          changed = true;
        }
      }

      if (!changed) return state;

      return {
        selections: {
          ...state.selections,
          [scope]: nextSelection,
        },
      };
    }),
  clearScope: (scope) =>
    set((state) => {
      const currentSelection = state.selections[scope];
      if (!currentSelection || currentSelection.size === 0) return state;

      return {
        selections: {
          ...state.selections,
          [scope]: new Set<string>(),
        },
      };
    }),
}));
