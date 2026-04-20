import { installVideoProtections } from "./lib/videoProtection";

// Install all video protections before anything else loads
installVideoProtections();

// Block DevTools keyboard shortcuts site-wide
document.addEventListener("keydown", (e) => {
  if (
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && ["I","J","C","i","j","c"].includes(e.key)) ||
    (e.ctrlKey && ["U","u","S","s"].includes(e.key)) ||
    (e.metaKey && e.altKey && ["I","i","J","j","C","c"].includes(e.key))
  ) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, true);

// Block right-click on entire page
document.addEventListener("contextmenu", (e) => e.preventDefault(), true);

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
