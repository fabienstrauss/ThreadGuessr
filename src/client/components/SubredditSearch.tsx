import { useEffect, useMemo, useState } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface SubredditSearchProps {
  onGuess: (sub: string) => void;
  disabled?: boolean;
}

export function SubredditSearch({ onGuess, disabled }: SubredditSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // For now, we'll fetch the whitelist through an API. Later we can optimize this.
  const [subreddits, setSubreddits] = useState<string[]>([]);

  useEffect(() => {
    // Fetch whitelist - for now using a simple approach
    // In production, you might want to include this in the initial page load
    fetch('/api/whitelist')
      .then(res => res.json())
      .then(data => {
        const names = data.map((item: any) => item.name);
        setSubreddits(names);
      })
      .catch(err => console.error('Failed to load subreddits:', err));
  }, []);

  const filteredSubs = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    const searchLower = debouncedSearch.toLowerCase();
    return subreddits
      .filter(sub => sub.toLowerCase().includes(searchLower))
      .slice(0, 10); // Limit to 10 results
  }, [debouncedSearch, subreddits]);

  const handleSubmit = () => {
    if (selectedSub) {
      onGuess(selectedSub);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <input
          type="text"
          placeholder="Search subreddit (e.g., 'funny', 'askreddit')..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full border-2 border-black bg-white px-4 py-3 text-base font-medium shadow-[3px_3px_0px_0px_#000]",
            "focus:outline-none focus:shadow-[5px_5px_0px_0px_#000] focus:translate-x-[-1px] focus:translate-y-[-1px]",
            "transition-all duration-200",
            disabled && "opacity-60 cursor-not-allowed bg-gray-100"
          )}
        />
      </div>

      {filteredSubs.length > 0 && (
        <div className="max-h-48 overflow-y-auto border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]">
          {filteredSubs.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSub(sub)}
              disabled={disabled}
              className={cn(
                "w-full text-left px-4 py-2 font-bold hover:bg-yellow-200 border-b border-black last:border-b-0",
                selectedSub === sub && "bg-yellow-400 font-black",
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              r/{sub}
            </button>
          ))}
        </div>
      )}

      {selectedSub && (
        <div className="flex items-center gap-3 p-3 bg-green-400 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
          <span className="text-sm text-black font-bold shrink-0">SELECTED:</span>
          <span className="font-black text-lg flex-1 min-w-0 truncate" title={`r/${selectedSub}`}>r/{selectedSub}</span>
          <button
            onClick={() => setSelectedSub(null)}
            disabled={disabled}
            className="text-sm text-black font-bold hover:text-red-600 border border-black px-2 py-1 hover:bg-red-100 shrink-0"
          >
            Clear
          </button>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={disabled || !selectedSub}
        className={cn(
          "w-full border-2 border-black bg-yellow-400 text-black px-6 py-4 font-black text-lg uppercase tracking-wide",
          "shadow-[4px_4px_0px_0px_#000] transition-all duration-200",
          "hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]",
          "active:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px]",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_#000] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
        )}
      >
        {selectedSub ? (
          <span className="flex items-center justify-center gap-1">
            <span className="shrink-0">Guess</span>
            <span className="max-w-[70%] truncate" title={`r/${selectedSub}`}>r/{selectedSub}</span>
          </span>
        ) : (
          "Select a subreddit to guess"
        )}
      </button>
    </div>
  );
}
