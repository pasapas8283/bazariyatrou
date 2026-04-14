'use client';

import { DisplayCurrencyProvider } from '@/contexts/display-currency-context';
import CapacitorBackHandler from '@/components/CapacitorBackHandler';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DisplayCurrencyProvider>
      <CapacitorBackHandler />
      {children}
    </DisplayCurrencyProvider>
  );
}
