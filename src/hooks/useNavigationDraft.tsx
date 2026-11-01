import { createContext, useCallback, useContext, useRef, useState, type ReactNode, type SetStateAction } from "react";

const Drafts = createContext<Map<string, unknown> | null>(null);

export function NavigationDrafts({ children }: { children: ReactNode }) {
  const cache = useRef(new Map<string, unknown>());
  return <Drafts.Provider value={cache.current}>{children}</Drafts.Provider>;
}

// Per-tab memory only: unfinished forms must not silently persist personal data.
export function useNavigationDraft<T>(key: string, initial: T | (() => T)) {
  const cache = useContext(Drafts)!;
  const [value, setValue] = useState<T>(() => cache.has(key) ? cache.get(key) as T : typeof initial === "function" ? (initial as () => T)() : initial);
  const current = useRef(value);
  const update = useCallback((next: SetStateAction<T>) => {
    const resolved = typeof next === "function" ? (next as (previous: T) => T)(current.current) : next;
    current.current = resolved;
    cache.set(key, resolved);
    setValue(resolved);
  }, [cache, key]);
  return [value, update] as const;
}
