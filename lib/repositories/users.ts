import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function findUserByNormalizedNickname(
  nicknameNormalized: string,
) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, nickname, nickname_normalized, created_at")
    .eq("nickname_normalized", nicknameNormalized)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}