import { Flame, Star, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useGamification } from "@/hooks/useGamification";

/**
 * Read-only display of server-computed XP, level, and streak state.
 * No authoritative math happens here beyond rendering a progress ratio.
 */
const GamificationCard = () => {
  const { data, isLoading } = useGamification();

  if (isLoading || !data) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-card">
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const levelSpan = Math.max(1, data.next_level_xp - data.level_start_xp);
  const intoLevel = Math.max(0, data.total_xp - data.level_start_xp);
  const levelProgress = Math.min(100, Math.round((intoLevel / levelSpan) * 100));
  const xpToNext = Math.max(0, data.next_level_xp - data.total_xp);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-6">
        {/* Level */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">Level {data.level}</div>
            <div className="text-sm text-muted-foreground">
              {xpToNext > 0 ? `${xpToNext} XP to next level` : "Level up!"}
            </div>
          </div>
        </div>

        {/* XP */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <Star className="h-6 w-6 text-accent" aria-hidden="true" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{data.total_xp}</div>
            <div className="text-sm text-muted-foreground">Total XP</div>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Flame className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {data.current_streak} {data.current_streak === 1 ? "day" : "days"}
            </div>
            <div className="text-sm text-muted-foreground">
              {data.current_streak > 0
                ? "Learning streak"
                : data.longest_streak > 0
                  ? `Best: ${data.longest_streak} days — start again today`
                  : "Complete a lesson to start a streak"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Level {data.level}</span>
          <span>
            {data.total_xp} / {data.next_level_xp} XP
          </span>
        </div>
        <Progress value={levelProgress} className="h-2" aria-label={`Level progress: ${levelProgress}%`} />
      </div>
    </div>
  );
};

export default GamificationCard;
