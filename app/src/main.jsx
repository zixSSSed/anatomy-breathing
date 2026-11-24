import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/style.css";
import "./styles/react.css";
import { App } from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// работа без интернета (только в собранной версии)
if (import.meta.env.PROD && "serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js").catch(() => {});
  });
}
