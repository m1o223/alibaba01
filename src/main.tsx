import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./router";
import "./styles/global.css";
import "./styles/navigation.css";
import { installNavigation } from "./navigation";
import { NavigationDrafts } from "./hooks/useNavigationDraft";
import { reportPageError } from "./errors/errorModel";

installNavigation();

createRoot(document.getElementById("root")!, { onCaughtError: reportPageError }).render(
  <StrictMode>
    <NavigationDrafts><AppRouter /></NavigationDrafts>
  </StrictMode>,
);
