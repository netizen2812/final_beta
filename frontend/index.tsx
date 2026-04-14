console.log("💓 index.tsx: Module Evaluation");
import React from "react";
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
