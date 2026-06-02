import { createClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS, used only in pipeline cron routes.
// Never expose this key to the browser.
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
