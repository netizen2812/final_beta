import { lazy, ComponentType } from "react";

/**
 * A wrapper around React.lazy that retries the import if it fails.
 * This is useful for handling "ChunkLoadError" or "Failed to fetch dynamically imported module"
 * which occurs when a new version of the app is deployed and the old chunks are removed.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error: any) {
      console.error("Chunk load error detected:", error);

      // Check if we already tried to reload in this session to avoid infinite loops
      const hasReloaded = sessionStorage.getItem("chunk_load_retry_on_going");

      if (!hasReloaded) {
        sessionStorage.setItem("chunk_load_retry_on_going", "true");
        window.location.reload();
      }

      // If we already reloaded and it still fails, it might be a real error
      throw error;
    }
  });
}
