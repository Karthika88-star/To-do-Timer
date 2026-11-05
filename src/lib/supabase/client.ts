import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Creates a new Supabase client configured for browser / client components.
 * Automatically utilizes document.cookie for auth session persistence.
 */
export function createClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createBrowserClient(url, publishableKey);
}

/**
 * Reusable Supabase browser client singleton.
 * Prevents unnecessary re-instantiations across client component renders.
 */
export function getBrowserClient() {
  if (typeof window === 'undefined') {
    return createClient();
  }

  if (!browserClient) {
    browserClient = createClient();
  }

  return browserClient;
}

