import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./App.css";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <App />   // ✅ StrictMode REMOVED
  );
}