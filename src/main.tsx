import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress known third-party console warnings (StackBlitz WebContainer, Cloudflare, browser policies)
// NOTE: console.error is left untouched so genuine errors always show
const SUPPRESSED_WARNINGS = [
  'cross-origin-isolated',
  'Feature Policy',
  'Partitioned cookie',
  'storage access was provided',
  'preloaded with link preload was not used',
  'Contextify',
  'Quirks Mode',
  'Layout was forced before the page was fully loaded',
  'cookie',
  'Cookie',
];
const origWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = args.map(a => (typeof a === 'string' ? a : '')).join(' ');
  if (!SUPPRESSED_WARNINGS.some(p => msg.includes(p))) origWarn.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
