
import { Card } from "./Card";

type PartialCredit = {
  awarded: number;
  reason?: string;
};

type RoundPayload = {
  roundId: string;
  title: string;
  media: any;
  options: string[];
  roundIndex: number;
  totalRounds: number;
  difficulty: "easy" | "hard";
};

type GuessResponse = {
  correct: boolean;
  points: number;
  basePoints?: number;
  streakMultiplier?: number;
  partial?: PartialCredit | null;
  reveal: { answerSub: string; sourceUrl: string };
  score: number;
  streak: number;
  nextAvailable: boolean;
};

interface RevealScreenProps {
  round: RoundPayload;
  result: GuessResponse;
  onNext: () => void;
  streakOnIce?: boolean;
}

export function RevealScreen({ round: _round, result, onNext, streakOnIce = false }: RevealScreenProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <h2 className="text-xl font-bold">
          {result.correct
            ? `✅ Correct: +${result.points}`
            : result.partial?.awarded
              ? `🎯 Partial Credit: +${result.points}`
              : "❌ Wrong: +0"}
        </h2>
        <p className="mt-2 text-zinc-700">
          Correct answer: <strong>r/{result.reveal.answerSub}</strong>.
          {(() => {
            const r = result.partial?.reason;
            if (!r) return null;
            const idx = r.indexOf(":");
            const formatted = idx >= 0 ? `${r.slice(0, idx).trim()} (${r.slice(idx + 1).trim()})` : r;
            return <>
              {" "}
              <span className="ml-1">Reason — {formatted}</span>
            </>;
          })()}
        </p>
        {!result.correct && result.partial?.awarded && streakOnIce && (
          <div className="mt-3 p-3 bg-blue-400 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
            <div className="text-sm text-black font-bold">
              ❄️ Streak on ice — keep it alive with your next guess!
            </div>
          </div>
        )}
        {result.correct && result.streak > 0 && (
          <div className="mt-3 p-3 bg-red-400 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
            <div className="text-sm text-black font-bold">
              {result.streakMultiplier && result.streakMultiplier > 1.0 && result.basePoints ? (
                <>🔥 Streak bonus: {result.basePoints} × {result.streakMultiplier.toFixed(1)} = {result.points} points</>
              ) : (
                <>🔥 Streak started! Next correct guess gets {(1.0 + result.streak * 0.1).toFixed(1)}x bonus</>
              )}
            </div>
          </div>
        )}
        <a
          className="mt-3 inline-flex text-sm text-blue-700 underline"
          href={result.reveal.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          View original post
        </a>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-zinc-600">This round: <strong>+{result.points}</strong></div>
          <button
            onClick={onNext}
            className="border-2 border-black bg-yellow-400 text-black px-6 py-3 font-black text-sm uppercase tracking-wide shadow-[4px_4px_0px_0px_#000] transition-all duration-200 hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px]"
          >
            {result.nextAvailable ? "Next Round" : "View Results"}
          </button>
        </div>
      </Card>
    </div>
  );
}
