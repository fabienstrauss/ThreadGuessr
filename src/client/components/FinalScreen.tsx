
import { Card } from "./Card";

interface FinalScreenProps {
  score: number;
  onRestart: () => void;
  onLeaderboard: () => void;
}

export function FinalScreen({ score, onRestart, onLeaderboard }: FinalScreenProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <h2 className="text-2xl font-bold">Daily Challenge Complete! 🎉</h2>
        <p className="mt-2 text-zinc-700">Your final score: <strong>{score}</strong></p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={onLeaderboard}
            className="flex-1 bg-blue-500 text-white border-2 border-black font-bold py-3 px-6 text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-200"
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={onRestart}
            className="flex-1 bg-gray-300 text-black border-2 border-black font-bold py-3 px-6 text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-200"
          >
            🏠 Back to Lobby
          </button>
        </div>
      </Card>
    </div>
  );
}