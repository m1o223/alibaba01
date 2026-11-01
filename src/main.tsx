import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./router";
import "./styles/global.css";
import "./styles/navigation.css";
import { installNavigation } from "./navigation";
import { NavigationDrafts } from "./hooks/useNavigationDraft";

installNavigation();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NavigationDrafts><AppRouter /></NavigationDrafts>
  </StrictMode>,
);
