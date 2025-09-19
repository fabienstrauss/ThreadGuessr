/**
 * Development Mode Component Testing Interface
 *
 * This component provides a visual interface for testing all app components
 * and states during development. It's only shown when DEV_MODE is enabled
 * in config.ts.
 *
 * To enable dev mode:
 * 1. Set VITE_DEV_MODE=true in .env file
 * 2. Change DEV_MODE_MANUAL to true in config.ts
 */

import { useState } from "react";
import { Lobby } from "./Lobby";
import { RoundScreen } from "./RoundScreen";
import { RevealScreen } from "./RevealScreen";
import { FinalScreen } from "./FinalScreen";
import { LeaderboardScreen } from "./LeaderboardScreen";
import { Loading } from "./Loading";
import { Card } from "./Card";
import { Header } from "./Header";
import type { WeeklyLeaderboard, DailyStats } from "../../shared/types";

type DevView =
  | "lobby-fresh"
  | "lobby-resuming"
  | "lobby-completed"
  | "loading"
  | "round-easy"
  | "round-hard"
  | "round-long-picture"
  | "reveal-correct"
  | "reveal-wrong"
  | "reveal-partial"
  | "final"
  | "leaderboard-few"
  | "leaderboard-many-top"
  | "leaderboard-many-mid"
  | "leaderboard-many-bottom";

// Mock data
const mockRoundEasy = {
  roundId: "2025-09-16:2",
  title:
    "This is a deliberately very long title to test the Read more and Show less behavior inside the image card caption. " +
    "It should truncate with an ellipsis and reveal the rest when expanded, ensuring layout remains stable across different devices and viewports.",
  media: {
    type: "image" as const,
    thumbUrl: "https://b.thumbs.redditmedia.com/Zv3NGs59_EzkshXSZewEFDv7Hpw2UeU4oTfgH3Wgejk.jpg",
    url: "https://preview.redd.it/r58wm2u9glof1.jpeg?width=1080&crop=smart&auto=webp&s=61eb0c20255a85bfe320783b23d69c5251d2e28b",
  },
  options: [
    "pics",
    "thisisareallyreallyreallylongsubredditnameforoverflowtesting",
    "interestingasfuck",
    "news"
  ],
  roundIndex: 2,
  totalRounds: 10,
  difficulty: "easy" as const,
};

const mockRoundHard = {
  roundId: "2025-09-16:7",
  title: "Gas tanker explosion in Mexico City, Sep 10, 2025",
  media: {
    type: "video" as const,
    thumbUrl:
      "https://external-preview.redd.it/cG9hbWV4cWhwZm9mMQRgL5xgj_LdMrVjcg_OonJqBjvV5-s_36hvpxMWUqYl.png?width=140&height=140&crop=140:140,smart&format=jpg&v=enabled&lthumb=true&s=46f4c143c4862bacc127007169d8e8e42b7e0be7",
    url: "https://v.redd.it/jmtoerrhpfof1/DASH_480.mp4?source=fallback",
  },
  options: [], // Hard mode doesn't use options
  roundIndex: 7,
  totalRounds: 10,
  difficulty: "hard" as const,
};

const mockRoundLongPicture = {
  roundId: "2025-09-16:8",
  title: "Testing very long picture sizing - this should show a 'Show Full Image' button because it's extremely tall",
  media: {
    type: "image" as const,
    thumbUrl: "https://preview.redd.it/6vv5x9evo5yd1.jpg?width=1080&crop=smart&auto=webp&s=a32c2030f6adb3004f8b304222df3332c7396666",
    url: "https://preview.redd.it/6vv5x9evo5yd1.jpg?width=1080&crop=smart&auto=webp&s=a32c2030f6adb3004f8b304222df3332c7396666",
    width: 1080,
    height: 3240, // Very tall image (aspect ratio 0.33)
  },
  options: [
    "comics",
    "funny",
    "memes",
    "webcomics"
  ],
  roundIndex: 8,
  totalRounds: 10,
  difficulty: "easy" as const,
};

const mockRevealCorrect = {
  correct: true,
  points: 13,
  basePoints: 10,
  streakMultiplier: 1.3,
  partial: null,
  reveal: { answerSub: "cats", sourceUrl: "https://reddit.com/r/cats/xyz" },
  score: 13,
  streak: 4,
  nextAvailable: true,
};

const mockRevealWrong = {
  correct: false,
  points: 0,
  basePoints: 0,
  streakMultiplier: 1.0,
  partial: null,
  reveal: { answerSub: "WhatsWrongWithYourCat", sourceUrl: "https://reddit.com/r/WhatsWrongWithYourCat/xyz" },
  score: 0,
  streak: 0,
  nextAvailable: true,
};

const mockRevealPartial = {
  correct: false,
  points: 6,
  basePoints: 0,
  streakMultiplier: 1.0,
  partial: { awarded: 6, reason: "Same group: animals" },
  reveal: { answerSub: "cats", sourceUrl: "https://reddit.com/r/cats/xyz" },
  score: 6,
  streak: 2,
  nextAvailable: true,
};

const mockLeaderboardFew: WeeklyLeaderboard = {
  weekKey: "2025-W38",
  entries: [
    { userId: "u1", username: "GameMaster", weeklyScore: 150, gamesPlayed: 3, averageScore: 50, lastPlayed: "2025-09-16", rank: 1 },
    { userId: "u2", username: "SuperLongUsernameForTestingHowItLooksInTheLeaderboard", weeklyScore: 999, gamesPlayed: 2, averageScore: 60, lastPlayed: "2025-09-15", rank: 2 },
    { userId: "u3", username: "RedditGuru", weeklyScore: 95, gamesPlayed: 2, averageScore: 48, lastPlayed: "2025-09-14", rank: 3 },
    { userId: "current", username: "You", weeklyScore: 85, gamesPlayed: 1, averageScore: 85, lastPlayed: "2025-09-16", rank: 4 },
  ],
  totalPlayers: 4,
  userEntry: {
    userId: "current",
    username: "You",
    weeklyScore: 85,
    gamesPlayed: 1,
    averageScore: 85,
    lastPlayed: "2025-09-16",
    rank: 4
  },
};

const mockLeaderboardManyTop: WeeklyLeaderboard = {
  weekKey: "2025-W38",
  entries: [
    { userId: "u1", username: "GameMaster", weeklyScore: 250, gamesPlayed: 5, averageScore: 50, lastPlayed: "2025-09-16", rank: 1 },
    { userId: "u2", username: "SuperLongUsernameForTestingHowItLooksInTheLeaderboard", weeklyScore: 999, gamesPlayed: 4, averageScore: 55, lastPlayed: "2025-09-15", rank: 2 },
    { userId: "u3", username: "RedditGuru", weeklyScore: 195, gamesPlayed: 4, averageScore: 49, lastPlayed: "2025-09-14", rank: 3 },
    { userId: "current", username: "You", weeklyScore: 185, gamesPlayed: 3, averageScore: 62, lastPlayed: "2025-09-16", rank: 4 },
    { userId: "u5", username: "Player5", weeklyScore: 170, gamesPlayed: 3, averageScore: 57, lastPlayed: "2025-09-13", rank: 5 },
    { userId: "u6", username: "Player6", weeklyScore: 165, gamesPlayed: 3, averageScore: 55, lastPlayed: "2025-09-12", rank: 6 },
    { userId: "u7", username: "Player7", weeklyScore: 155, gamesPlayed: 3, averageScore: 52, lastPlayed: "2025-09-16", rank: 7 },
    { userId: "u8", username: "Player8", weeklyScore: 145, gamesPlayed: 2, averageScore: 73, lastPlayed: "2025-09-15", rank: 8 },
    { userId: "u9", username: "Player9", weeklyScore: 140, gamesPlayed: 2, averageScore: 70, lastPlayed: "2025-09-14", rank: 9 },
    { userId: "u10", username: "Player10", weeklyScore: 135, gamesPlayed: 2, averageScore: 68, lastPlayed: "2025-09-13", rank: 10 },
  ],
  totalPlayers: 25,
  userEntry: {
    userId: "current",
    username: "You",
    weeklyScore: 185,
    gamesPlayed: 3,
    averageScore: 62,
    lastPlayed: "2025-09-16",
    rank: 4
  },
};

const mockLeaderboardManyMid: WeeklyLeaderboard = {
  weekKey: "2025-W38",
  entries: [
    { userId: "u1", username: "GameMaster", weeklyScore: 250, gamesPlayed: 5, averageScore: 50, lastPlayed: "2025-09-16", rank: 1 },
    { userId: "u2", username: "SuperLongUsernameForTestingHowItLooksInTheLeaderboard", weeklyScore: 999, gamesPlayed: 4, averageScore: 55, lastPlayed: "2025-09-15", rank: 2 },
    { userId: "u3", username: "RedditGuru", weeklyScore: 195, gamesPlayed: 4, averageScore: 49, lastPlayed: "2025-09-14", rank: 3 },
    { userId: "u4", username: "Player4", weeklyScore: 185, gamesPlayed: 3, averageScore: 62, lastPlayed: "2025-09-16", rank: 4 },
    { userId: "u5", username: "Player5", weeklyScore: 170, gamesPlayed: 3, averageScore: 57, lastPlayed: "2025-09-13", rank: 5 },
    { userId: "u6", username: "Player6", weeklyScore: 165, gamesPlayed: 3, averageScore: 55, lastPlayed: "2025-09-12", rank: 6 },
    { userId: "current", username: "You", weeklyScore: 155, gamesPlayed: 3, averageScore: 52, lastPlayed: "2025-09-16", rank: 7 },
    { userId: "u8", username: "Player8", weeklyScore: 145, gamesPlayed: 2, averageScore: 73, lastPlayed: "2025-09-15", rank: 8 },
    { userId: "u9", username: "Player9", weeklyScore: 140, gamesPlayed: 2, averageScore: 70, lastPlayed: "2025-09-14", rank: 9 },
    { userId: "u10", username: "Player10", weeklyScore: 135, gamesPlayed: 2, averageScore: 68, lastPlayed: "2025-09-13", rank: 10 },
  ],
  totalPlayers: 25,
  userEntry: {
    userId: "current",
    username: "You",
    weeklyScore: 155,
    gamesPlayed: 3,
    averageScore: 52,
    lastPlayed: "2025-09-16",
    rank: 7
  },
};

const mockLeaderboardManyBottom: WeeklyLeaderboard = {
  weekKey: "2025-W38",
  entries: [
    { userId: "u1", username: "GameMaster", weeklyScore: 250, gamesPlayed: 5, averageScore: 50, lastPlayed: "2025-09-16", rank: 1 },
    { userId: "u2", username: "SuperLongUsernameForTestingHowItLooksInTheLeaderboard", weeklyScore: 999, gamesPlayed: 4, averageScore: 55, lastPlayed: "2025-09-15", rank: 2 },
    { userId: "u3", username: "RedditGuru", weeklyScore: 195, gamesPlayed: 4, averageScore: 49, lastPlayed: "2025-09-14", rank: 3 },
    { userId: "u4", username: "Player4", weeklyScore: 185, gamesPlayed: 3, averageScore: 62, lastPlayed: "2025-09-16", rank: 4 },
    { userId: "u5", username: "Player5", weeklyScore: 170, gamesPlayed: 3, averageScore: 57, lastPlayed: "2025-09-13", rank: 5 },
    { userId: "u6", username: "Player6", weeklyScore: 165, gamesPlayed: 3, averageScore: 55, lastPlayed: "2025-09-12", rank: 6 },
    { userId: "u7", username: "Player7", weeklyScore: 155, gamesPlayed: 3, averageScore: 52, lastPlayed: "2025-09-16", rank: 7 },
    { userId: "u8", username: "Player8", weeklyScore: 145, gamesPlayed: 2, averageScore: 73, lastPlayed: "2025-09-15", rank: 8 },
    { userId: "u9", username: "Player9", weeklyScore: 140, gamesPlayed: 2, averageScore: 70, lastPlayed: "2025-09-14", rank: 9 },
    { userId: "u10", username: "Player10", weeklyScore: 135, gamesPlayed: 2, averageScore: 68, lastPlayed: "2025-09-13", rank: 10 },
  ],
  totalPlayers: 45,
  userEntry: {
    userId: "current",
    username: "You",
    weeklyScore: 75,
    gamesPlayed: 1,
    averageScore: 75,
    lastPlayed: "2025-09-16",
    rank: 23
  },
  userRank: 23,
};

const mockStats: DailyStats[] = [
  {
    dayKey: "2025-09-16",
    score: 85,
    streak: 3,
    completed: true,
    completedAt: Date.now(),
    difficulty: { easy: { correct: 4, total: 5 }, hard: { correct: 2, total: 5 } }
  },
  {
    dayKey: "2025-09-15",
    score: 92,
    streak: 5,
    completed: true,
    completedAt: Date.now() - 86400000,
    difficulty: { easy: { correct: 5, total: 5 }, hard: { correct: 3, total: 5 } }
  },
  {
    dayKey: "2025-09-14",
    score: 78,
    streak: 2,
    completed: true,
    completedAt: Date.now() - 172800000,
    difficulty: { easy: { correct: 3, total: 5 }, hard: { correct: 4, total: 5 } }
  },
];

export function DevMenu() {
  const [currentView, setCurrentView] = useState<DevView>("lobby-fresh");

  const mockDailyStatusFresh = async () => ({
    canPlay: true,
    progress: null
  });

  const mockDailyStatusResuming = async () => ({
    canPlay: true,
    progress: {
      dayKey: "2025-09-16",
      currentRound: 3,
      finalScore: 35,
      finalStreak: 2,
      completed: false
    }
  });

  const mockDailyStatusCompleted = async () => ({
    canPlay: false,
    reason: "Daily challenge already completed. Come back tomorrow!",
    progress: {
      dayKey: "2025-09-16",
      finalScore: 95,
      finalStreak: 6,
      completed: true,
      completedAt: Date.now()
    }
  });

  const noop = () => {};

  // All views should show header
  const showHeader = true;

  // Determine header mode and values for DevMenu
  const getHeaderProps = () => {
    // Logo-only views
    if (currentView === "lobby-fresh" || currentView === "lobby-resuming" || currentView === "lobby-completed" || currentView === "loading") {
      return { mode: "logo" as const };
    }

    // Leaderboard views
    if (currentView === "leaderboard-few" || currentView === "leaderboard-many-top" || currentView === "leaderboard-many-mid" || currentView === "leaderboard-many-bottom") {
      return { mode: "leaderboard" as const, onBack: noop };
    }

    // Full header for game screens
    if (currentView === "round-easy") {
      const streak = 2;
      const multiplier = streak > 0 ? 1.0 + (streak * 0.1) : 1.0;
      return { mode: "full" as const, score: 35, streak, multiplier, progressLabel: `${mockRoundEasy.roundIndex + 1}/${mockRoundEasy.totalRounds}`, streakOnIce: false };
    }
    if (currentView === "round-hard") {
      const streak = 4;
      const multiplier = streak > 0 ? 1.0 + (streak * 0.1) : 1.0;
      return { mode: "full" as const, score: 80, streak, multiplier, progressLabel: `${mockRoundHard.roundIndex + 1}/${mockRoundHard.totalRounds}`, streakOnIce: false };
    }
    if (currentView === "round-long-picture") {
      const streak = 3;
      const multiplier = streak > 0 ? 1.0 + (streak * 0.1) : 1.0;
      return { mode: "full" as const, score: 55, streak, multiplier, progressLabel: `${mockRoundLongPicture.roundIndex + 1}/${mockRoundLongPicture.totalRounds}`, streakOnIce: false };
    }
    if (currentView === "reveal-correct") {
      const streak = mockRevealCorrect.streak;
      const multiplier = streak > 0 ? 1.0 + (streak * 0.1) : 1.0;
      return { mode: "full" as const, score: mockRevealCorrect.score, streak, multiplier, progressLabel: `${mockRoundEasy.roundIndex + 1}/${mockRoundEasy.totalRounds}`, streakOnIce: false };
    }
    if (currentView === "reveal-wrong") {
      const streak = mockRevealWrong.streak;
      const multiplier = streak > 0 ? 1.0 + (streak * 0.1) : 1.0;
      return { mode: "full" as const, score: mockRevealWrong.score, streak, multiplier, progressLabel: `${mockRoundEasy.roundIndex + 1}/${mockRoundEasy.totalRounds}`, streakOnIce: false };
    }
    if (currentView === "reveal-partial") {
      const streak = mockRevealPartial.streak;
      const multiplier = streak > 0 ? 1.0 + (streak * 0.1) : 1.0;
      return { mode: "full" as const, score: mockRevealPartial.score, streak, multiplier, progressLabel: `${mockRoundEasy.roundIndex + 1}/${mockRoundEasy.totalRounds}`, streakOnIce: streak > 0 };
    }
    if (currentView === "final") {
      return { mode: "full" as const, score: 125, streak: 3, multiplier: 1.2, progressLabel: "10/10", streakOnIce: false };
    }

    return { mode: "logo" as const };
  };

  const renderView = () => {
    switch (currentView) {
      case "lobby-fresh":
        return <Lobby onStart={noop} error={null} checkDailyStatus={mockDailyStatusFresh} onLeaderboard={noop} />;

      case "lobby-resuming":
        return <Lobby onStart={noop} error={null} checkDailyStatus={mockDailyStatusResuming} onLeaderboard={noop} />;

      case "lobby-completed":
        return <Lobby onStart={noop} error={null} checkDailyStatus={mockDailyStatusCompleted} onLeaderboard={noop} />;

      case "loading":
        return <Loading />;

      case "round-easy":
        return <RoundScreen round={mockRoundEasy} onGuess={noop} onReport={noop} isSubmitting={false} />;

      case "round-hard":
        return <RoundScreen round={mockRoundHard} onGuess={noop} onReport={noop} isSubmitting={false} />;

      case "round-long-picture":
        return <RoundScreen round={mockRoundLongPicture} onGuess={noop} onReport={noop} isSubmitting={false} />;

      case "reveal-correct":
        return <RevealScreen round={mockRoundEasy} result={mockRevealCorrect} onNext={noop} streakOnIce={false} />;

      case "reveal-wrong":
        return <RevealScreen round={mockRoundEasy} result={mockRevealWrong} onNext={noop} streakOnIce={false} />;

      case "reveal-partial":
        return <RevealScreen round={mockRoundEasy} result={mockRevealPartial} onNext={noop} streakOnIce={true} />;

      case "final":
        return <FinalScreen score={125} onRestart={noop} onLeaderboard={noop} />;

      case "leaderboard-few":
        return <LeaderboardScreen onBack={noop} mockData={{ leaderboard: mockLeaderboardFew, stats: mockStats }} />;

      case "leaderboard-many-top":
        return <LeaderboardScreen onBack={noop} mockData={{ leaderboard: mockLeaderboardManyTop, stats: mockStats }} />;

      case "leaderboard-many-mid":
        return <LeaderboardScreen onBack={noop} mockData={{ leaderboard: mockLeaderboardManyMid, stats: mockStats }} />;

      case "leaderboard-many-bottom":
        return <LeaderboardScreen onBack={noop} mockData={{ leaderboard: mockLeaderboardManyBottom, stats: mockStats }} />;

      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="min-h-screen w-full p-6 md:p-8 lg:p-12 bg-background text-foreground">
      {/* Dev Menu Header */}
      <div>
        <Card>
          <h1 className="text-3xl font-heading uppercase tracking-tight">🛠️ Dev Menu - Component Showcase</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { id: "lobby-fresh", label: "Lobby (Fresh)" },
              { id: "lobby-resuming", label: "Lobby (Resuming)" },
              { id: "lobby-completed", label: "Lobby (Completed)" },
              { id: "loading", label: "Loading" },
              { id: "round-easy", label: "Round (Easy)" },
              { id: "round-hard", label: "Round (Hard)" },
              { id: "round-long-picture", label: "Round (Long Picture)" },
              { id: "reveal-correct", label: "Reveal (Correct)" },
              { id: "reveal-wrong", label: "Reveal (Wrong)" },
              { id: "reveal-partial", label: "Reveal (Partial)" },
              { id: "final", label: "Final Screen" },
              { id: "leaderboard-few", label: "Leaderboard (<10)" },
              { id: "leaderboard-many-top", label: "Leaderboard (You in Top 10)" },
              { id: "leaderboard-many-mid", label: "Leaderboard (You #7)" },
              { id: "leaderboard-many-bottom", label: "Leaderboard (You #23)" },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id as DevView)}
                className={`px-4 py-3 text-sm font-bold uppercase tracking-wide border-2 border-black transition-all duration-200 ${
                  currentView === view.id
                    ? "bg-yellow-400 text-black shadow-[4px_4px_0px_0px_#000] translate-x-[-2px] translate-y-[-2px]"
                    : "bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
          <div className="p-3 bg-green-400 border-2 border-black shadow-[3px_3px_0px_0px_#000] text-sm font-bold">
            <strong>CURRENT VIEW:</strong> {currentView}
          </div>
        </Card>
      </div>

      {/* Rendered View */}
      {showHeader && <Header {...getHeaderProps()} />}
      {renderView()}
    </div>
  );
}
