'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { PriceCurrency } from '../types/marketplace';

const STORAGE_KEY = 'bazariyatrou-display-currency';

type DisplayCurrencyContextValue = {
  displayCurrency: PriceCurrency;
  setDisplayCurrency: (c: PriceCurrency) => void;
};

const DisplayCurrencyContext = createContext<
  DisplayCurrencyContextValue | undefined
>(undefined);

export function DisplayCurrencyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [displayCurrency, setDisplayCurrencyState] = useState<PriceCurrency>(() => {
    if (typeof window === 'undefined') return 'KMF';
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'EUR' || raw === 'KMF') {
        return raw;
      }
    } catch {
      /* ignore */
    }
    return 'KMF';
  });

  const setDisplayCurrency = useCallback((c: PriceCurrency) => {
    setDisplayCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ displayCurrency, setDisplayCurrency }),
    [displayCurrency, setDisplayCurrency]
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency() {
  const ctx = useContext(DisplayCurrencyContext);
  if (!ctx) {
    throw new Error(
      'useDisplayCurrency must be used within DisplayCurrencyProvider'
    );
  }
  return ctx;
}
