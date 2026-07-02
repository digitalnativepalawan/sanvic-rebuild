import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Global access to the Tala panel so any surface (Today input, place cards,
// map popups) can open the guide, optionally pre-filled with a question.

interface TalaUiState {
  isOpen: boolean;
  initialQuery?: string;
  openTala: (query?: string) => void;
  closeTala: () => void;
}

const Ctx = createContext<TalaUiState | null>(null);

export function TalaProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string>();

  const openTala = useCallback((query?: string) => {
    setInitialQuery(query);
    setIsOpen(true);
  }, []);
  const closeTala = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, initialQuery, openTala, closeTala }),
    [isOpen, initialQuery, openTala, closeTala],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTala(): TalaUiState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTala must be used within TalaProvider");
  return ctx;
}
