"use client";

import { createContext, useContext, ReactNode } from "react";

const SubdomainContext = createContext<string | null>(null);

interface SubdomainProviderProps {
  subdomain: string | null;
  children: ReactNode;
}

export function SubdomainProvider({
  subdomain,
  children,
}: SubdomainProviderProps) {
  return (
    <SubdomainContext.Provider value={subdomain}>
      {children}
    </SubdomainContext.Provider>
  );
}

export function useSubdomain(): string | null {
  return useContext(SubdomainContext);
}