/**
 * Supabase Environment Configuration & Validation
 * Safely resolves and validates Supabase credentials from environment variables
 * without exposing or logging sensitive values.
 */

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

/**
 * Validates whether the required Supabase environment variables are present and non-empty.
 * Does not expose or print any secret or credential values.
 */
export function validateSupabaseEnv(): { isValid: boolean; missing: string[] } {
  const missing: string[] = [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.trim() === '') {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || key.trim() === '') {
    missing.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Returns the validated Supabase configuration.
 * Throws a descriptive error if required environment variables are absent.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const { isValid, missing } = validateSupabaseEnv();

  if (!isValid) {
    throw new Error(
      `Supabase initialization failed: missing required environment variable(s): ${missing.join(', ')}. Please check .env.local.`
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const publishableKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;

  return {
    url: url.trim(),
    publishableKey: publishableKey.trim(),
  };
}

