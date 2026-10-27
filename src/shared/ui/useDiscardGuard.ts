/**
 * Asks before closing a composer that still holds unsent work.
 */

import { useCallback, useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export type DiscardGuard = {
  /** Use for ✕, backdrop and hardware back. */
  requestClose: () => void;
  asking: boolean;
  keepEditing: () => void;
  discard: () => void;
};

export function useDiscardGuard(dirty: boolean, close: () => void, visible = true): DiscardGuard {
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!visible) {
      setAsking(false);
    }
  }, [visible]);

  const requestClose = useCallback(() => {
    if (dirty) {
      Keyboard.dismiss();
      setAsking(true);
      return;
    }
    close();
  }, [close, dirty]);

  const keepEditing = useCallback(() => setAsking(false), []);

  const discard = useCallback(() => {
    setAsking(false);
    close();
  }, [close]);

  return { requestClose, asking, keepEditing, discard };
}
