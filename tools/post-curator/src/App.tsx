import React, { useState, useEffect } from 'react';
import { CurationCandidate, CurationDecision } from './types';
import PostCard from './components/PostCard';
import CurationInterface from './components/CurationInterface';
import BatchControls from './components/BatchControls';

interface CurationData {
  candidate: CurationCandidate;
  index: number;
  total: number;
  remaining: number;
  finished?: boolean;
}

function App() {
  const [currentData, setCurrentData] = useState<CurationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    approved: 0,
    currentBatch: { total: 0, current: 0, remaining: 0 }
  });

  const fetchCurrentPost = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/current');
      const data = await response.json();
      setCurrentData(data);
    } catch (error) {
      console.error('Error fetching current post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDecision = async (decision: CurationDecision) => {
    try {
      setLoading(true);
      const response = await fetch('/api/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.finished) {
          setCurrentData({ ...currentData!, finished: true });
        } else {
          await fetchCurrentPost();
        }
        await fetchStats();
      }
    } catch (error) {
      console.error('Error submitting decision:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewBatch = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/batch');
      if (response.ok) {
        await fetchCurrentPost();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error starting new batch:', error);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when we have a current post and aren't loading
      if (!currentData || currentData.finished || loading) return;

      // Prevent shortcuts when typing in inputs (though we don't have any currently)
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'a':
          event.preventDefault();
          handleDecision('approve');
          break;
        case 'r':
          event.preventDefault();
          handleDecision('reject');
          break;
        case 's':
          event.preventDefault();
          handleDecision('skip');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentData, loading]);

  useEffect(() => {
    fetchCurrentPost();
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            🎯 ThreadGuessr Post Curator
          </h1>
          <p className="text-center text-gray-600">
            Review and approve posts for the ThreadGuessr game
          </p>

          {/* Stats */}
          <div className="flex justify-center space-x-6 mt-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-green-600">{stats.approved}</div>
              <div className="text-gray-500">Approved</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">
                {currentData ? `${currentData.index + 1}/${currentData.total}` : '0/0'}
              </div>
              <div className="text-gray-500">Progress</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-orange-600">
                {currentData?.remaining || 0}
              </div>
              <div className="text-gray-500">Remaining</div>
            </div>
            {stats.duplicateFiltering && (
              <div className="text-center">
                <div className="font-semibold text-purple-600">
                  {stats.duplicateFiltering.sessionSeenPosts}
                </div>
                <div className="text-gray-500">Filtered</div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}

        {!loading && currentData?.finished && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Batch Complete!</h2>
            <p className="text-gray-600 mb-6">
              You've reviewed all posts in this batch. Great work!
            </p>
            <BatchControls
              onNewBatch={startNewBatch}
              onExport={async () => {
                const response = await fetch('/api/export', { method: 'POST' });
                if (response.ok) {
                  const data = await response.json();
                  alert(`Exported ${data.count} approved seeds!`);
                }
              }}
              hasApprovedSeeds={stats.approved > 0}
            />
          </div>
        )}

        {!loading && currentData && !currentData.finished && (
          <div className="space-y-6">
            {/* Post Display */}
            <PostCard candidate={currentData.candidate} />

            {/* Curation Interface */}
            <CurationInterface
              onDecision={handleDecision}
              candidate={currentData.candidate}
              disabled={loading}
            />
          </div>
        )}

        {!loading && !currentData && (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Ready to Start?</h2>
            <p className="text-gray-600 mb-6">
              Click below to fetch a new batch of posts for curation.
            </p>
            <button
              onClick={startNewBatch}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start New Batch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;