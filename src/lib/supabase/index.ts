/**
 * Supabase Client Exports
 * 
 * - For Client Components ('use client'):
 *     import { createClient } from '@/lib/supabase/client';
 *     // or: import { getBrowserClient } from '@/lib/supabase/client';
 * 
 * - For Server Components, Server Actions, Route Handlers:
 *     import { createClient } from '@/lib/supabase/server';
 */

export { getSupabaseConfig, validateSupabaseEnv } from './config';
export type { SupabaseConfig } from './config';
export { createClient as createBrowserClient, getBrowserClient } from './client';
export { updateSession } from './proxy';

