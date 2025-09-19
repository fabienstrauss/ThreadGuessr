import React, { useState } from 'react';

interface BatchControlsProps {
  onNewBatch: () => void;
  onExport: () => void;
  hasApprovedSeeds: boolean;
}

const BatchControls: React.FC<BatchControlsProps> = ({
  onNewBatch,
  onExport,
  hasApprovedSeeds
}) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        📋 Batch Management
      </h3>

      <div className="space-y-4">
        {/* Export section */}
        <div className="text-center">
          <button
            onClick={handleExport}
            disabled={!hasApprovedSeeds || exporting}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              hasApprovedSeeds && !exporting
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {exporting ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Exporting...
              </>
            ) : (
              <>
                📄 Export Approved Seeds
              </>
            )}
          </button>
          {!hasApprovedSeeds && (
            <p className="text-sm text-gray-500 mt-2">
              No approved seeds to export yet
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* New batch section */}
        <div className="text-center">
          <button
            onClick={onNewBatch}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            🔄 Start New Batch
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Fetch 20 new posts for curation
          </p>
        </div>

        {/* Help text */}
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
          <h4 className="font-semibold mb-2">💡 Tips for efficient curation:</h4>
          <ul className="space-y-1 text-sm">
            <li>• Look for clear, high-quality images/videos</li>
            <li>• Ensure the content is clearly associated with the subreddit</li>
            <li>• Check that the title is descriptive but not too long</li>
            <li>• Skip posts that are borderline - be selective!</li>
            <li>• Export regularly to save your progress</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BatchControls;