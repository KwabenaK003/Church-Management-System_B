import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTableSelectionStore } from "@/lib/stores/tableSelectionStore";

const EMPTY_SELECTION = new Set<string>();

export function usePersistentTableSelection(scope: string, visibleIds: string[]) {
  const { selectedIds, addId, removeId, addIds, removeIds, clearScope } =
    useTableSelectionStore(
      useShallow((state) => ({
        selectedIds: state.selections[scope] ?? EMPTY_SELECTION,
        addId: state.addId,
        removeId: state.removeId,
        addIds: state.addIds,
        removeIds: state.removeIds,
        clearScope: state.clearScope,
      }))
    );

  const selectedCount = selectedIds.size;

  const visibleSelectedCount = useMemo(() => {
    if (visibleIds.length === 0) return 0;

    let count = 0;
    for (const id of visibleIds) {
      if (selectedIds.has(id)) count += 1;
    }

    return count;
  }, [selectedIds, visibleIds]);

  const allVisibleSelected = visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggleRow = useCallback(
    (id: string) => {
      if (selectedIds.has(id)) {
        removeId(scope, id);
        return;
      }

      addId(scope, id);
    },
    [scope, selectedIds, addId, removeId]
  );

  const toggleVisibleRows = useCallback(() => {
    if (visibleIds.length === 0) return;

    if (allVisibleSelected) {
      removeIds(scope, visibleIds);
      return;
    }

    const idsToAdd = visibleIds.filter((id) => !selectedIds.has(id));
    addIds(scope, idsToAdd);
  }, [scope, visibleIds, allVisibleSelected, selectedIds, addIds, removeIds]);

  const clearSelection = useCallback(() => {
    clearScope(scope);
  }, [scope, clearScope]);

  return {
    selectedIds,
    selectedCount,
    isSelected,
    allVisibleSelected,
    someVisibleSelected,
    toggleRow,
    toggleVisibleRows,
    clearSelection,
  };
}
