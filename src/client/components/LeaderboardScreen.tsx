import { useEffect, useState } from "react";
import { Card } from "./Card";
import type { WeeklyLeaderboard, DailyStats } from "../../shared/types";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

async function apiGetLeaderboard(): Promise<WeeklyLeaderboard> {
  const res = await fetch("/api/leaderboard");
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

async function apiGetStats(): Promise<DailyStats[]> {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

interface LeaderboardScreenProps {
  onBack: () => void;
  mockData?: {
    leaderboard?: WeeklyLeaderboard;
    stats?: DailyStats[];
  };
}

export function LeaderboardScreen({ onBack, mockData }: LeaderboardScreenProps) {
  const [leaderboard, setLeaderboard] = useState<WeeklyLeaderboard | null>(null);
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(!mockData);
  const [error, setError] = useState<string | null>(null);
  const [showTop10, setShowTop10] = useState(false);

  useEffect(() => {
    if (mockData) {
      setLeaderboard(mockData.leaderboard || null);
      setStats(mockData.stats || []);
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const [leaderboardData, statsData] = await Promise.all([
          apiGetLeaderboard(),
          apiGetStats()
        ]);
        setLeaderboard(leaderboardData);
        setStats(statsData);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load leaderboard";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [mockData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <div className="text-center py-8">
            <div className="text-zinc-500">Loading leaderboard...</div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600">Error: {error}</div>
            <button onClick={onBack} className="mt-4 rounded-2xl bg-zinc-900 text-white px-4 py-2 font-medium hover:bg-zinc-800">
              Back to Game
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!leaderboard) return null;

  // Generate fallback avatar for all users (no real avatars available through Devvit)
  const getProfilePicture = (entry: { username?: string }) => {
    return generateFallbackAvatar(entry.username || 'User');
  };

  // Generate a more attractive SVG avatar as data URI (CSP compliant)
  const generateFallbackAvatar = (username: string) => {
    const initials = username.slice(0, 2).toUpperCase();

    // More diverse and attractive color palette inspired by Reddit's colors
    const colors = [
      '#FF4500', // Reddit Orange
      '#0079D3', // Reddit Blue
      '#46D160', // Green
      '#FF6314', // Orange
      '#7193FF', // Light Blue
      '#FFB000', // Yellow
      '#9C5AE2', // Purple
      '#EA0027', // Red
      '#24A0ED', // Sky Blue
      '#00A6FB'  // Cyan
    ];

    // Use multiple factors for color selection to make it more random
    const colorIndex = (username.length + username.charCodeAt(0) + (username.charCodeAt(username.length - 1) || 0)) % colors.length;
    const bgColor = colors[colorIndex];

    // Add a subtle gradient and border for more depth
    const svg = `
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${colorIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${bgColor}dd;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill="url(#grad${colorIndex})" stroke="#000" stroke-width="2"/>
        <text x="50%" y="50%" font-family="Arial Black, Arial" font-size="13" font-weight="900"
              text-anchor="middle" dominant-baseline="central" fill="white"
              style="text-shadow: 1px 1px 1px rgba(0,0,0,0.5)">
          ${initials}
        </text>
      </svg>
    `.trim();

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // Determine which entries to show in main list
  const entriesToShow = showTop10 ? leaderboard.entries.slice(0, 10) : leaderboard.entries.slice(0, 5);
  const shouldShowMore = !showTop10 && leaderboard.entries.length > 5;
  const shouldShowLess = showTop10;

  // User should be shown separately if they're not in the visible entries
  const userIsInVisibleList = leaderboard.userEntry && entriesToShow.some(entry => entry.userId === leaderboard.userEntry!.userId);
  const shouldShowUserSeparately = leaderboard.userEntry && !userIsInVisibleList;

  // Only show ellipsis before the separated user entry
  const shouldShowEllipsis = shouldShowUserSeparately;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        {/* Leaderboard Header */}
        <h1 className="text-3xl font-black uppercase tracking-wider text-black mb-6">
          🏆 Leaderboard
        </h1>

        {/* Top Players */}
        <div className="space-y-3 mb-6">
          {entriesToShow.map((entry, _index) => {
            const isUser = entry.userId === leaderboard.userEntry?.userId;
            const isTop3 = entry.rank <= 3;

            // User highlighting logic
            let bgClass = "bg-white";
            let borderClass = "border-black";

            if (isUser && isTop3) {
              // User in top 3: special user highlighting overrides medal colors
              bgClass = "bg-blue-400";
              borderClass = "border-blue-600";
            } else if (isUser) {
              // User not in top 3: blue highlighting
              bgClass = "bg-blue-300";
              borderClass = "border-blue-600";
            } else if (isTop3) {
              // Top 3 medals (when not user)
              bgClass = "bg-gradient-to-r from-yellow-300 to-yellow-400";
            }

            return (
              <div
                key={entry.userId}
                className={cn(
                  "border-4 p-3 sm:p-4 shadow-[4px_4px_0px_0px_#000] transition-all duration-200 hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]",
                  bgClass,
                  borderClass,
                  isUser && "ring-4 ring-blue-500 ring-offset-2"
                )}
              >
                <div className="flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    {/* Rank Badge */}
                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 border-2 border-black flex items-center justify-center font-black text-sm sm:text-lg shadow-[2px_2px_0px_0px_#000] flex-shrink-0",
                      entry.rank === 1 ? "bg-yellow-500" : entry.rank === 2 ? "bg-gray-400" : entry.rank === 3 ? "bg-orange-400" : "bg-white"
                    )}>
                      {entry.rank}
                    </div>

                    {/* Profile Picture */}
                    <img
                      src={getProfilePicture(entry)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = generateFallbackAvatar(entry.username || 'User');
                      }}
                      alt={`${entry.username}'s avatar`}
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 border-2 shadow-[2px_2px_0px_0px_#000] flex-shrink-0 rounded-full",
                        isUser ? "border-white ring-2 ring-blue-500" : "border-black"
                      )}
                    />

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      <div className={cn(
                        "font-black text-sm sm:text-lg uppercase tracking-wide truncate",
                        isUser && "text-blue-800"
                      )}>
                        {entry.username}{isUser && " (YOU)"}
                      </div>
                      <div className="text-xs sm:text-sm font-bold uppercase text-black/70 truncate">
                        {entry.gamesPlayed} games • avg {entry.averageScore}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className={cn(
                    "text-lg sm:text-2xl font-black flex-shrink-0 ml-2",
                    isUser && "text-blue-800"
                  )}>
                    {entry.weeklyScore}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More/Less Buttons - always right after the main list */}
        {shouldShowMore && (
          <div className="mb-6">
            <button
              onClick={() => setShowTop10(true)}
              className="w-full bg-blue-500 text-white border-2 border-black font-black py-3 px-6 text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-200"
            >
              🔍 Show More (Top 10)
            </button>
          </div>
        )}

        {shouldShowLess && (
          <div className="mb-6">
            <button
              onClick={() => setShowTop10(false)}
              className="w-full bg-gray-500 text-white border-2 border-black font-black py-3 px-6 text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-200"
            >
              🔼 Show Less (Top 5)
            </button>
          </div>
        )}

        {/* Ellipsis - only before separated user entry */}
        {shouldShowEllipsis && (
          <div className="mb-4">
            <div className="text-center py-4">
              <span className="text-3xl font-black text-black/50">⋯</span>
            </div>
          </div>
        )}

        {/* User Entry (if outside visible range) */}
        {shouldShowUserSeparately && leaderboard.userEntry && (
          <div className="mb-6">
            <div className={cn(
              "border-4 p-3 sm:p-4 shadow-[4px_4px_0px_0px_#000] transition-all duration-200 hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]",
              "bg-blue-300",
              "border-blue-600",
              "ring-4 ring-blue-500 ring-offset-2"
            )}>
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  {/* Rank Badge */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white border-2 border-black flex items-center justify-center font-black text-sm sm:text-lg shadow-[2px_2px_0px_0px_#000] flex-shrink-0">
                    {leaderboard.userEntry.rank}
                  </div>

                  {/* Profile Picture */}
                  <img
                    src={getProfilePicture(leaderboard.userEntry)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = generateFallbackAvatar(leaderboard.userEntry!.username || 'User');
                    }}
                    alt={`${leaderboard.userEntry.username}'s avatar`}
                    className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white ring-2 ring-blue-500 shadow-[2px_2px_0px_0px_#000] flex-shrink-0 rounded-full"
                  />

                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-sm sm:text-lg uppercase tracking-wide text-blue-800 truncate">
                      {leaderboard.userEntry.username} (YOU)
                    </div>
                    <div className="text-xs sm:text-sm font-bold uppercase text-black/70 truncate">
                      {leaderboard.userEntry.gamesPlayed} games • avg {leaderboard.userEntry.averageScore}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-lg sm:text-2xl font-black text-blue-800 flex-shrink-0 ml-2">
                  {leaderboard.userEntry.weeklyScore}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Total Players */}
        <div className="mb-6 text-center">
          <div className="inline-block bg-black text-white font-black text-sm uppercase tracking-wide px-4 py-2 shadow-[3px_3px_0px_0px_#000]">
            {leaderboard.totalPlayers} Total Players This Week
          </div>
        </div>

        {/* Weekly Rounds Section */}
        <div className="border-t-4 border-black pt-6">
          <h2 className="text-2xl font-black uppercase tracking-wider text-black mb-4">
            📅 Your Weekly Rounds
          </h2>

          {/* User's Recent Games */}
          {stats.length > 0 ? (
            <div className="space-y-2">
              {stats.slice(0, 7).map((stat) => (
                <div key={stat.dayKey} className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black text-sm uppercase tracking-wide">
                        {new Date(stat.dayKey).toLocaleDateString()}
                      </div>
                      <div className="text-xs font-bold uppercase text-black/70">
                        Streak: {stat.streak} • {stat.completed ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                    <div className="text-xl font-black">{stat.score}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-200 border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000] text-center">
              <div className="font-black text-lg uppercase tracking-wide text-black/70">
                No games played this week yet
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}