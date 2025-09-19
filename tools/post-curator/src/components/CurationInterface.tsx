import React, { useState } from 'react';
import { CurationCandidate, CurationDecision } from '../types';

interface CurationInterfaceProps {
  candidate: CurationCandidate;
  onDecision: (decision: CurationDecision) => void;
  disabled?: boolean;
}

const CurationInterface: React.FC<CurationInterfaceProps> = ({
  candidate,
  onDecision,
  disabled = false
}) => {
  const [selectedDecision, setSelectedDecision] = useState<CurationDecision | null>(null);

  const handleDecision = (decision: CurationDecision) => {
    setSelectedDecision(decision);
    setTimeout(() => {
      onDecision(decision);
      setSelectedDecision(null);
    }, 200); // Brief visual feedback
  };

  const getScoreColor = (score: number) => {
    if (score >= 1000) return 'text-green-600';
    if (score >= 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
        ⚖️ Curation Decision
      </h3>

      {/* Quality indicators */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className={`text-lg font-bold ${getScoreColor(candidate.redditPost.score || 0)}`}>
            {candidate.redditPost.score || 0}
          </div>
          <div className="text-xs text-gray-500">Score</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-blue-600">
            {candidate.redditPost.title.length}
          </div>
          <div className="text-xs text-gray-500">Title Length</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className={`text-lg font-bold ${candidate.redditPost.over_18 ? 'text-red-600' : 'text-green-600'}`}>
            {candidate.redditPost.over_18 ? 'NSFW' : 'SFW'}
          </div>
          <div className="text-xs text-gray-500">Content Rating</div>
        </div>
      </div>

      {/* Quality checklist */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Quality Checklist:</h4>
        <div className="space-y-2 text-sm">
          <QualityCheck
            label="Has clear, visible media"
            passed={!!candidate.proposedSeed.media}
          />
          <QualityCheck
            label="Good score (>100)"
            passed={(candidate.redditPost.score || 0) > 100}
          />
          <QualityCheck
            label="Reasonable title length"
            passed={candidate.redditPost.title.length >= 10 && candidate.redditPost.title.length <= 200}
          />
          <QualityCheck
            label="Not NSFW (if SFW subreddit)"
            passed={!candidate.redditPost.over_18 || !candidate.subredditInfo.sfw}
          />
          <QualityCheck
            label="Clear subreddit association"
            passed={true} // Always true if we got this far
          />
        </div>
      </div>

      {/* Decision buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleDecision('reject')}
          disabled={disabled}
          className={`p-4 rounded-lg font-semibold transition-all ${
            selectedDecision === 'reject'
              ? 'bg-red-600 text-white transform scale-95'
              : 'bg-red-50 text-red-700 hover:bg-red-100 border-2 border-red-200 hover:border-red-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="text-2xl mb-1">❌</div>
          <div className="text-sm">REJECT</div>
          <div className="text-xs opacity-75">Not suitable</div>
        </button>

        <button
          onClick={() => handleDecision('skip')}
          disabled={disabled}
          className={`p-4 rounded-lg font-semibold transition-all ${
            selectedDecision === 'skip'
              ? 'bg-yellow-600 text-white transform scale-95'
              : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-2 border-yellow-200 hover:border-yellow-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="text-2xl mb-1">⏭️</div>
          <div className="text-sm">SKIP</div>
          <div className="text-xs opacity-75">Maybe later</div>
        </button>

        <button
          onClick={() => handleDecision('approve')}
          disabled={disabled}
          className={`p-4 rounded-lg font-semibold transition-all ${
            selectedDecision === 'approve'
              ? 'bg-green-600 text-white transform scale-95'
              : 'bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-200 hover:border-green-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="text-2xl mb-1">✅</div>
          <div className="text-sm">APPROVE</div>
          <div className="text-xs opacity-75">Add to game</div>
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 text-center text-xs text-gray-500">
        💡 Tip: Use keyboard shortcuts - R (reject), S (skip), A (approve)
      </div>
    </div>
  );
};

// Quality check component
const QualityCheck: React.FC<{ label: string; passed: boolean }> = ({ label, passed }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
      passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
    }`}>
      {passed ? '✓' : '✗'}
    </div>
    <span className={passed ? 'text-gray-700' : 'text-red-600'}>{label}</span>
  </div>
);

export default CurationInterface;