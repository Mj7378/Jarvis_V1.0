import { useMemo } from 'react';

// All sound playing logic has been removed.
// The hook now returns no-op (no operation) functions to silence the application's UI sounds.
export const useSoundEffects = () => {
  return useMemo(() => ({
    playClick: () => {},
    playActivate: () => {},
    playDeactivate: () => {},
    playError: () => {},
    playSuccess: () => {},
    playOpen: () => {},
    playClose: () => {},
  }), []);
};
