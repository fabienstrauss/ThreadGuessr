import React, { useState } from 'react';
import { CurationCandidate } from '../types';

interface PostCardProps {
  candidate: CurationCandidate;
}

const PostCard: React.FC<PostCardProps> = ({ candidate }) => {
  const [imageError, setImageError] = useState(false);
  const { redditPost, subredditInfo, proposedSeed } = candidate;

  const handleImageError = () => {
    setImageError(true);
  };

  const formatScore = (score: number) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Game-style header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <h2 className="text-xl font-bold mb-2">🎮 Preview: Game View</h2>
        <div className="text-sm opacity-90">
          This is how the post will appear to players
        </div>
      </div>

      {/* Post content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4 leading-tight">
          {redditPost.title}
        </h3>

        {/* Media display */}
        <div className="mb-6">
          {proposedSeed.media.type === 'image' && !imageError ? (
            <div className="relative">
              <img
                src={proposedSeed.media.url}
                alt={redditPost.title}
                className="w-full max-h-96 object-contain rounded-lg bg-gray-100"
                onError={handleImageError}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                IMAGE
              </div>
            </div>
          ) : proposedSeed.media.type === 'video' ? (
            <div className="relative">
              <video
                src={proposedSeed.media.url}
                poster={proposedSeed.media.thumbUrl}
                controls
                className="w-full max-h-96 rounded-lg bg-gray-100"
                muted
                playsInline
              >
                Your browser doesn't support video playback.
              </video>
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                VIDEO
              </div>
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-gray-500 text-center">
                <div className="text-4xl mb-2">📷</div>
                <div>Media not available</div>
                <div className="text-sm mt-1">{redditPost.url}</div>
              </div>
            </div>
          )}
        </div>

        {/* Game options preview */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">Multiple Choice Options:</h4>
          <div className="grid grid-cols-2 gap-2">
            {[proposedSeed.answerSub, ...proposedSeed.distractors]
              .sort(() => Math.random() - 0.5) // Shuffle for preview
              .map((option, index) => (
                <button
                  key={index}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    option === proposedSeed.answerSub
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                  disabled
                >
                  r/{option}
                  {option === proposedSeed.answerSub && (
                    <span className="text-xs ml-2 text-green-600">✓ Correct</span>
                  )}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Post metadata */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Subreddit:</span>
            <span className="ml-2 text-blue-600">r/{redditPost.subreddit}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Score:</span>
            <span className="ml-2 text-orange-600">{formatScore(redditPost.score || 0)} upvotes</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Group:</span>
            <span className="ml-2 text-purple-600">{subredditInfo.group}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tags:</span>
            <span className="ml-2 text-gray-600">
              {subredditInfo.tags.join(', ') || 'None'}
            </span>
          </div>
        </div>

        {/* Source link */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <a
            href={redditPost.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 text-sm underline"
          >
            🔗 View original Reddit post
          </a>
        </div>
      </div>
    </div>
  );
};

export default PostCard;