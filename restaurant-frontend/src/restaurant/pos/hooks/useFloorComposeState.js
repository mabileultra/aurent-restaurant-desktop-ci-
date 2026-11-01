import { useState } from 'react';

/** Compose modal + line-note editor state (shared by mutations onSuccess + line actions). */
export function useFloorComposeState() {
  const [pendingMenuItem, setPendingMenuItem] = useState(null);
  const [pendingVariants, setPendingVariants] = useState(null);
  const [pendingWeightItem, setPendingWeightItem] = useState(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState([]);
  const [pendingItemNote, setPendingItemNote] = useState('');
  const [lineNoteEdit, setLineNoteEdit] = useState(null);

  return {
    pendingMenuItem,
    setPendingMenuItem,
    pendingVariants,
    setPendingVariants,
    pendingWeightItem,
    setPendingWeightItem,
    selectedModifierIds,
    setSelectedModifierIds,
    pendingItemNote,
    setPendingItemNote,
    lineNoteEdit,
    setLineNoteEdit,
  };
}
