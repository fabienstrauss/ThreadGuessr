import { useEffect, useState } from "react";
import { Card } from "./Card";

interface LobbyProps {
  onStart: () => void;
  error: string | null;
  checkDailyStatus: () => Promise<{canPlay: boolean; reason?: string; progress?: any}>;
  onLeaderboard: () => void;
}

export function Lobby({ onStart, error, checkDailyStatus, onLeaderboard }: LobbyProps) {
  const [dailyStatus, setDailyStatus] = useState<{canPlay: boolean; reason?: string; progress?: any} | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Check daily status on mount
  useEffect(() => {
    checkDailyStatus()
      .then(setDailyStatus)
      .catch((e) => console.error('Failed to check daily status:', e))
      .finally(() => setStatusLoading(false));
  }, [checkDailyStatus]);


  if (statusLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <div className="text-center py-8">
            <div className="text-zinc-500">Checking daily status...</div>
          </div>
        </Card>
      </div>
    );
  }

  // Show completion status if already completed
  if (dailyStatus && !dailyStatus.canPlay) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <h2 className="text-2xl font-bold uppercase tracking-wide mb-4">✅ Daily Challenge Complete!</h2>
          <p className="mt-2 text-black font-medium">{dailyStatus.reason}</p>
          {dailyStatus.progress && (
            <div className="mt-4 p-4 bg-chart-4 border-2 border-border shadow-shadow rounded-base">
              <div className="text-sm text-main-foreground font-heading">
                <div><strong>Final Score:</strong> {dailyStatus.progress.finalScore}</div>
                <div><strong>Final Streak:</strong> {dailyStatus.progress.finalStreak}</div>
                <div><strong>Completed:</strong> {new Date(dailyStatus.progress.completedAt).toLocaleTimeString()}</div>
              </div>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <button onClick={onLeaderboard} className="border-2 border-border bg-chart-1 text-main-foreground font-heading px-4 py-2 shadow-shadow transition-all duration-200 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] uppercase tracking-wide rounded-base">
              🏆 Leaderboard
            </button>
          </div>
          <div className="mt-4 text-sm text-zinc-500">
            Come back tomorrow for a new challenge!
          </div>
        </Card>
      </div>
    );
  }

  // Show game start interface
  const isResuming = dailyStatus?.progress && !dailyStatus.progress.completed && dailyStatus.progress.currentRound > 0;
  const resumeInfo = isResuming ? {
    round: dailyStatus.progress.currentRound + 1,
    score: dailyStatus.progress.finalScore || 0,
    streak: dailyStatus.progress.finalStreak || 0
  } : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <h2 className="text-3xl font-heading uppercase tracking-tight">Daily Challenge</h2>
        <p className="text-foreground font-base text-lg">
          Guess which subreddit each post came from. Build a streak for bonus points!
        </p>

        {resumeInfo && (
          <div className="p-4 bg-blue-400 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
            <div className="text-sm text-black font-bold">
              <strong>⏸️ Resume Progress:</strong> Round {resumeInfo.round}/10 • Score: {resumeInfo.score} • Streak: {resumeInfo.streak}
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button onClick={onStart}
                  className="w-full sm:w-auto border-2 border-black bg-yellow-400 text-black font-bold px-8 py-4 shadow-[4px_4px_0px_0px_#000] transition-all duration-200 hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] uppercase tracking-wide text-[16px]">
            {isResuming ? '▶️ Resume Challenge' : '🎯 Start Challenge'}
          </button>
          <button onClick={onLeaderboard} className="w-full sm:w-auto border-2 border-black bg-blue-400 text-black font-bold px-8 py-4 shadow-[3px_3px_0px_0px_#000] transition-all duration-200 hover:shadow-[5px_5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] uppercase tracking-wide text-[16px]">
            🏆 Leaderboard
          </button>
        </div>
        {error && (
          <div className="p-4 bg-red-400 border-2 border-black shadow-[3px_3px_0px_0px_#000] text-sm text-black font-bold">
            ⚠️ <strong>Error:</strong> {error}
          </div>
        )}
      </Card>
    </div>
  );
}
