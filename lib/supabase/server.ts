import {
    createClient,
    type SupabaseClient,
  } from "@supabase/supabase-js";
  import type { Database } from "@/types/supabase";
  
  let cachedClient: SupabaseClient<Database> | null = null;
  
  function getSupabaseUrl() {
    const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
    if (!value) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
    }
  
    return value;
  }
  
  function getServiceRoleKey() {
    const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
    if (!value) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }
  
    return value;
  }
  
  export function getSupabaseAdminClient() {
    if (!cachedClient) {
      cachedClient = createClient<Database>(
        getSupabaseUrl(),
        getServiceRoleKey(),
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );
    }
  
    return cachedClient;
  }