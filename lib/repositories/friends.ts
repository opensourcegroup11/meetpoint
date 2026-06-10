/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function findFriendsByUserId(userId: string) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("friends")
    .select(`
      friend_id,
      users!friends_friend_id_fkey (
        id,
        nickname,
        lat,
        lng,
        location_updated_at
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => {
    const friend = Array.isArray(row.users) ? row.users[0] : row.users;

    return {
      id: friend.id,
      nickname: friend.nickname,
      lat: friend.lat,
      lng: friend.lng,
      locationUpdatedAt: friend.location_updated_at,
    };
  });
}