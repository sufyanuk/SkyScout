"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface ViewerContextValue {
  isAuthenticated: boolean;
  isSaved: (dealId: string) => boolean;
  setSaved: (dealId: string, saved: boolean) => void;
}

const ViewerContext = createContext<ViewerContextValue>({
  isAuthenticated: false,
  isSaved: () => false,
  setSaved: () => {},
});

/**
 * Client-side source of truth for "who is browsing" and which deals they have
 * saved, so every FavoriteButton on a page stays in sync without prop drilling.
 */
export function ViewerProvider({
  isAuthenticated,
  savedDealIds,
  children,
}: {
  isAuthenticated: boolean;
  savedDealIds: string[];
  children: ReactNode;
}) {
  const [saved, setSavedIds] = useState(() => new Set(savedDealIds));

  const setSaved = useCallback((dealId: string, value: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(dealId);
      else next.delete(dealId);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isSaved: (id: string) => saved.has(id), setSaved }),
    [isAuthenticated, saved, setSaved],
  );

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

export function useViewer() {
  return useContext(ViewerContext);
}
