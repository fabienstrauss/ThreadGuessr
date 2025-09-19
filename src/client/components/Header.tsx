
import logoLong from "../assets/threadguessr-logo-long.svg";

export function Header({
  score,
  progressLabel,
  streak,
  multiplier,
  streakOnIce = false,
  mode = "full",
  onBack,
}: {
  score?: number;
  progressLabel?: string;
  streak?: number;
  multiplier?: number;
  streakOnIce?: boolean;
  mode?: "full" | "logo" | "leaderboard";
  onBack?: () => void;
}) {
  const streakLabel = streakOnIce && streak && streak > 0
    ? `❄️ ${streak} (${multiplier?.toFixed(1)}x)`
    : (streak && streak > 0
      ? `🔥 ${streak} (${multiplier?.toFixed(1)}x)`
      : `⚪️ 0 (1.0x)`);

  if (mode === "logo") {
    return (
      <div className="mb-8 mx-auto max-w-2xl">
        <div className="flex items-center justify-center">
          <img
            src={logoLong}
            alt="ThreadGuessr"
            className="h-8 md:h-10 w-auto"
            style={{ filter: 'brightness(0)' }}
          />
        </div>
      </div>
    );
  }

  if (mode === "leaderboard") {
    return (
      <div className="mb-8 mx-auto max-w-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center">
            <img
              src={logoLong}
              alt="ThreadGuessr"
              className="h-8 md:h-10 w-auto"
              style={{ filter: 'brightness(0)' }}
            />
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="bg-gray-300 text-black border-2 border-black font-bold py-2 px-4 text-sm uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-200"
            >
              ← Back to Game
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full mode (default)
  return (
    <div className="mb-8 mx-auto max-w-2xl">
      {/* Main header with logo + badges */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center">
          <img
            src={logoLong}
            alt="ThreadGuessr"
            className="h-8 md:h-10 w-auto"
            style={{ filter: 'brightness(0)' }}
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge label={`Score: ${score || 0}`} />
          <Badge label={streakLabel} />
          <Badge label={progressLabel || ""} />
        </div>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="text-xs font-heading uppercase tracking-wide border-2 border-border bg-secondary-background text-foreground px-2 py-1 shadow-shadow">{label}</span>
  );
}
