import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-header" aria-label="Site header" />
      <main className="app-main">
        {children}
      </main>
      <footer className="app-footer" aria-label="Site footer" />
    </div>
  );
}
