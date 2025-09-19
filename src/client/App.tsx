import { useCallback, useEffect, useState } from "react";
import { Lobby } from "./components/Lobby";
import { Loading } from "./components/Loading";
import { RoundScreen } from "./components/RoundScreen";
import { RevealScreen } from "./components/RevealScreen";
import { FinalScreen } from "./components/FinalScreen";
import { LeaderboardScreen } from "./components/LeaderboardScreen";
import { Header } from "./components/Header";

// -----------------------------
// Types shared with the server (keep in sync with /shared/types)
// -----------------------------

type Difficulty = "easy" | "hard";

type Media = {
  type: "image" | "video";
  thumbUrl: string;
  url?: string;
  width?: number;
  height?: number;
};

type RoundPayload = {
  roundId: string;
  title: string;
  media: Media;
  options: string[];
  roundIndex: number;
  totalRounds: number;
  difficulty: Difficulty;
};

type GuessRequest = {
  roundId: string;
  answerSub: string;
  currentStreak?: number;
  currentScore?: number;
};

type PartialCredit = {
  awarded: number;
  reason?: string;
};

type GuessResponse = {
  correct: boolean;
  points: number;
  partial?: PartialCredit | null;
  reveal: {
    answerSub: string;
    sourceUrl: string;
  };
  score: number;
  streak: number;
  nextAvailable: boolean;
};

// -----------------------------
// Simple API client wrappers (relative fetch to Devvit server routes)
// -----------------------------

async function apiGetRound(roundIndex: number = 0, signal?: AbortSignal): Promise<RoundPayload> {
  const init: RequestInit = signal ? { signal } : {};
  const res = await fetch(`/api/round?roundIndex=${roundIndex}`, init);
  if (!res.ok) throw new Error("Failed to fetch round");
  return res.json();
}

async function apiGetDailyStatus(): Promise<{canPlay: boolean; reason?: string; progress?: any}> {
  const res = await fetch("/api/daily-status");
  if (!res.ok) throw new Error("Failed to check daily status");
  return res.json();
}

export type HttpError = Error & { status?: number; code?: number; body?: string };

export function isHttpError(e: unknown): e is HttpError {
  return typeof e === 'object' && e !== null && ('status' in e || 'code' in e);
}

async function apiPostGuess(body: GuessRequest): Promise<GuessResponse> {
  const res = await fetch("/api/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err: HttpError = new Error("Failed to submit guess");
    err.status = res.status;
    err.body = await res.text().catch(() => "");
    throw err;
  }
  return res.json();
}

async function apiReport(roundId: string, reasons: string[], description: string): Promise<void> {
  try {
    await fetch(`/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId, reasons, description })
    });
  } catch {
    // best-effort
  }
}


// -----------------------------
// Small utilities
// -----------------------------


const KEY_NUMBERS = ["1", "2", "3", "4", "5", "6"];


// -----------------------------
// Screens
// -----------------------------

type Stage = "lobby" | "loading" | "round" | "reveal" | "final" | "leaderboard";

export default function App() {
  const [stage, setStage] = useState<Stage>("lobby");
  const [round, setRound] = useState<RoundPayload | null>(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [lastResult, setLastResult] = useState<GuessResponse | null>(null);
  const [streakOnIce, setStreakOnIce] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalRounds = 10;
  const progressLabel = `${currentRoundIndex + 1}/${totalRounds}`;
  // Display the multiplier that will be applied to the current guess
  // If streak is 1, show 1.1x (first streak bonus)
  // If streak is 2, show 1.2x (second streak bonus), etc.
  const currentMultiplier = currentStreak > 0 ? 1.0 + (currentStreak * 0.1) : 1.0;

  const startDaily = useCallback(async () => {
    setError(null);
    setStage("loading");
    setLastResult(null);

    try {
      // First check daily status to see if we need to resume
      const dailyStatus = await apiGetDailyStatus();

      let resumeRoundIndex = 0;
      let resumeScore = 0;
      let resumeStreak = 0;

      if (dailyStatus.progress && !dailyStatus.progress.completed) {
        // Resume from current progress
        resumeRoundIndex = dailyStatus.progress.currentRound;
        resumeScore = dailyStatus.progress.finalScore || 0;
        resumeStreak = dailyStatus.progress.finalStreak || 0;
      }

      setTotalScore(resumeScore);
      setCurrentStreak(resumeStreak);
      setCurrentRoundIndex(resumeRoundIndex);

      const payload = await apiGetRound(resumeRoundIndex);
      setRound(payload);
      setStage("round");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load round";
      setError(msg);
      setStage("lobby");
    }
  }, []);


  const onGuess = useCallback(
    async (answerSub: string) => {
      if (!round || isSubmitting) return;
      setIsSubmitting(true);
      setStage("loading");
      try {
        const prevStreak = currentStreak;
        const res = await apiPostGuess({
          roundId: round.roundId,
          answerSub,
          currentStreak, // Send current streak for bonus calculation
          currentScore: totalScore // Send current total score for progress tracking
        });
        setLastResult(res);
        setTotalScore(prev => prev + res.points);
        setCurrentStreak(res.streak); // Update streak based on server response

        // Streak on ice logic:
        // - Set to true if: had a streak, got partial credit (keeping streak alive)
        // - Set to false if: correct answer (streak continues normally) or completely wrong
        const hadStreak = prevStreak > 0;
        const gotPartialCredit = (res.partial?.awarded ?? 0) > 0;
        const onIce = hadStreak && !res.correct && gotPartialCredit;
        setStreakOnIce(onIce);
        setStage("reveal");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to submit guess";
        setError(msg);
        setStage("round");
      } finally {
        setIsSubmitting(false);
      }
    },
    [round, isSubmitting, currentStreak, totalScore]
  );

  const nextRound = useCallback(async () => {
    setError(null);
    // Don't automatically clear streakOnIce here - it should persist until resolved
    const nextRoundIndex = currentRoundIndex + 1;

    if (nextRoundIndex >= totalRounds) {
      setStage("final");
      return;
    }

    setStage("loading");
    try {
      const payload = await apiGetRound(nextRoundIndex);
      setRound(payload);
      setCurrentRoundIndex(nextRoundIndex);
      setStage("round");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load next round";
      setError(msg);
      setStage("final");
    }
  }, [currentRoundIndex, totalRounds]);

  const reportCurrent = useCallback((reasons: string[], description: string) => {
    if (round) void apiReport(round.roundId, reasons, description);
  }, [round]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      if (stage === "round" && round) {
        const key = ev.key;
        const idx = KEY_NUMBERS.indexOf(key);
        if (idx >= 0 && idx < round.options.length) {
          ev.preventDefault();
          const choice = round.options[idx];
          if (typeof choice !== "string") return; // Guard für TS (noUncheckedIndexedAccess)
          void onGuess(choice);
          return;
        }
      }
      if (stage === "reveal") {
        if (ev.key === "Enter") {
          ev.preventDefault();
          void nextRound();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stage, round, onGuess, nextRound]);

  const renderHeader = () => {
    if (stage === "lobby") {
      return <Header mode="logo" />;
    }
    if (stage === "loading") {
      return <Header mode="logo" />;
    }
    if (stage === "leaderboard") {
      return <Header mode="leaderboard" onBack={() => setStage("lobby")} />;
    }
    // For round, reveal, and final screens - show full header with stats
    return (
      <Header
        score={totalScore}
        progressLabel={progressLabel}
        streak={currentStreak}
        multiplier={currentMultiplier}
        streakOnIce={streakOnIce}
        mode="full"
      />
    );
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Top padding for breathing room */}
      <div className="pt-4 sm:pt-6 md:pt-8 px-2 sm:px-4 md:px-8 lg:px-12">
        {renderHeader()}
      </div>

      <div className="flex justify-center px-2 sm:px-4 md:px-8 lg:px-12">
        <div className="w-full max-w-4xl">
            {stage === "lobby" && (
              <Lobby
                onStart={startDaily}
                error={error}
                checkDailyStatus={apiGetDailyStatus}
                onLeaderboard={() => setStage("leaderboard")}
              />
            )}

            {stage === "loading" && <Loading />}

            {stage === "round" && round && (
              <RoundScreen
                round={round}
                onGuess={onGuess}
                onReport={reportCurrent}
                isSubmitting={isSubmitting}
              />
            )}

            {stage === "reveal" && round && lastResult && (
              <RevealScreen
                round={round}
                result={lastResult}
                streakOnIce={streakOnIce}
                onNext={lastResult.nextAvailable ? nextRound : () => setStage("final")}
              />
            )}

            {stage === "final" && (
              <FinalScreen
                score={totalScore}
                onRestart={() => setStage("lobby")}
                onLeaderboard={() => setStage("leaderboard")}
              />
            )}

            {stage === "leaderboard" && (
              <LeaderboardScreen onBack={() => setStage("lobby")} />
            )}
        </div>
      </div>

      {/* Bottom padding for symmetry */}
      <div className="pb-4 sm:pb-6 md:pb-8"></div>

      {/* Non-intrusive error toast */}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-lg rounded-xl bg-red-600 text-white px-4 py-2 shadow">
          {error}
        </div>
      )}
    </div>
  );
}
