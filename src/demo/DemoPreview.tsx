import type { ReactNode } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { DemoCartProvider } from "./DemoCart";
import { DemoMenuPage } from "./DemoMenuPage";

export default function DemoPreview({ currentPath, page }: { currentPath: string; page: ReactNode }) {
  return <DemoCartProvider><AppLayout currentPath={currentPath}>{currentPath === "/menu" ? <DemoMenuPage /> : page}</AppLayout></DemoCartProvider>;
}
