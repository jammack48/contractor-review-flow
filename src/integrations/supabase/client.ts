
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bjfzwlosdgtowruvvaei.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ARF9m_FlzC08uvqMiMPhSQ_osOahGac";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Export project reference for components that need it
export const projectRef = "bjfzwlosdgtowruvvaei";
