import { Component, type ReactNode } from "react";

export class PageBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return this.props.fallback ?? <PageError />;
    return this.props.children;
  }
}
export function PageError() {
  return <div className="route-status" role="alert">
    <h1>Sidan kunde inte visas</h1>
    <p>Försök igen eller välj en annan sida i menyn.</p>
    <button type="button" onClick={() => location.reload()}>Försök igen</button>
  </div>;
}
export function PageLoading() {
  return <div className="route-status route-loading" role="status" aria-label="Laddar sidan" aria-busy="true">
    <span /><span /><span />
  </div>;
}
