import { Component, type ReactNode } from "react";
import { ErrorPage } from "./ErrorPage";
import { classifyPageError, type PageErrorKind } from "../errors/errorModel";
import { navigate } from "../navigation";

type BoundaryProps = {
  children: ReactNode;
  resetKey?: string;
  onRetry?: () => void;
  fallback?: (kind: PageErrorKind, retry: () => void) => ReactNode;
};
export class PageBoundary extends Component<BoundaryProps, { failed: boolean; kind: PageErrorKind }> {
  state = { failed: false, kind: "server" as PageErrorKind };
  static getDerivedStateFromError(error: unknown) { return { failed: true, kind: classifyPageError(error, navigator.onLine) }; }
  componentDidUpdate(previous: BoundaryProps) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.retry();
  }
  retry = () => {
    this.props.onRetry?.();
    this.setState({ failed: false });
  };
  render() {
    if (this.state.failed) return this.props.fallback?.(this.state.kind, this.retry)
      ?? <ErrorPage kind={this.state.kind} onRetry={this.retry} onHome={() => { if (location.pathname === "/") this.retry(); else navigate("/"); }} />;
    return this.props.children;
  }
}
export function PageLoading() {
  return <div className="route-status route-loading" role="status" aria-label="Laddar sidan" aria-busy="true">
    <span /><span /><span />
  </div>;
}
