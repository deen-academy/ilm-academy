import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GamificationState {
  total_xp: number;
  level: number;
  level_start_xp: number;
  next_level_xp: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export const GAMIFICATION_QUERY_KEY = ["my-gamification"];

/**
 * Read-only view of the learner's server-computed gamification state.
 * All XP/level/streak math happens in the database (get_my_gamification RPC);
 * the client never computes or writes any of these values.
 */
export function useGamification() {
  const { user } = useAuth();

  return useQuery<GamificationState>({
    queryKey: [...GAMIFICATION_QUERY_KEY, user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_my_gamification");
      if (error) throw error;
      return data as GamificationState;
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}
