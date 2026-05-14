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
export async function createUser(params: {
    nickname: string;
    nicknameNormalized: string;
    passwordHash: string;
  }) {
    const supabase = getSupabaseAdminClient();
  
    const { data, error } = await supabase
      .from("users")
      .insert({
        nickname: params.nickname,
        nickname_normalized: params.nicknameNormalized,
        password_hash: params.passwordHash,
      })
      .select("id, nickname, lat, lng, location_updated_at")
      .single();
  
    if (error) {
      throw error;
    }
  
    return data;
  }
  export async function findUserForLogin(nicknameNormalized: string) {
    const supabase = getSupabaseAdminClient();
  
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, nickname, nickname_normalized, password_hash, lat, lng, location_updated_at",
      )
      .eq("nickname_normalized", nicknameNormalized)
      .maybeSingle();
  
    if (error) {
      throw error;
    }
  
    return data;
  }