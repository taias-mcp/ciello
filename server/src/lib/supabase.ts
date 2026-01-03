/**
 * Supabase client for Ciello MCP Server
 * 
 * Single-user, no-auth setup for demo purposes.
 * All state is persisted in Supabase tables.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY environment variables');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

