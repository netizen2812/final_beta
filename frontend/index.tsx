console.log("💓 index.tsx: Module Evaluation");

// Handle Vite dynamic import errors (Chunk Load Errors)
window.addEventListener('vite:preloadError', (event) => {
  console.error('Vite preload error detected, reloading page:', event);
  const hasReloaded = sessionStorage.getItem("chunk_load_retry_on_going");
  if (!hasReloaded) {
    sessionStorage.setItem("chunk_load_retry_on_going", "true");
    window.location.reload();
  }
});

import React from "react";
(window as any).React = React; // Global injection for production build/chunk compatibility
import ReactDOM from "react-dom/client";
import "./src/i18n";
import App from "./App";
import { ClerkProvider } from "@clerk/clerk-react";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}
console.log("🔐 Clerk Key Loaded:", clerkPubKey.startsWith("pk_test") ? "TEST MODE" : "LIVE MODE");
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(rootElement);
console.log("💓 index.tsx: Attempting to Mount React");
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider 
        publishableKey={clerkPubKey}
        localization={{
          signIn: {
            start: {
              title: "Sign in to Imam",
            },
          },
        }}
      >
        <App />
      </ClerkProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
console.log("💓 index.tsx: Render called");

(window as any).__REACT_HYDRATED__ = true;
// Clear the retry flag since we successfully loaded/mounted
sessionStorage.removeItem("chunk_load_retry_on_going");

