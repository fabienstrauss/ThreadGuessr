import { useEffect, useRef, useState } from "react";
import { Card } from "./Card";
import { SubredditSearch } from "./SubredditSearch";

type Difficulty = "easy" | "hard";

type Media = {
  type: "image" | "video";
  thumbUrl: string;
  url?: string;
  width?: number;
  height?: number;
};

type RoundPayload = {
  roundId: string;
  title: string;
  media: Media;
  options: string[];
  roundIndex: number;
  totalRounds: number;
  difficulty: Difficulty;
};

interface RoundScreenProps {
  round: RoundPayload;
  onGuess: (sub: string) => void;
  onReport: (reasons: string[], description: string) => void;
  isSubmitting: boolean;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function OptionButton({
  index,
  label,
  onClick,
  disabled,
}: {
  index: number;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex items-center gap-3 border-2 border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000] transition-all duration-200 hover:shadow-[5px_5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px]",
        disabled && "opacity-60 cursor-not-allowed hover:shadow-[3px_3px_0px_0px_#000] hover:translate-x-0 hover:translate-y-0"
      )}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center border-2 border-black bg-yellow-400 text-black text-sm font-black shadow-[2px_2px_0px_0px_#000]">
        {index + 1}
      </span>
      <span className="font-bold text-lg flex-1 min-w-0 truncate text-left" title={label}>{label}</span>
    </button>
  );
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
}

function ImageModal({ isOpen, onClose, src, alt }: ImageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="max-w-full max-h-full overflow-auto">
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function MediaBlock({
  media,
  isVideoPlaying,
  setIsVideoPlaying,
  videoRef,
}: {
  media: Media;
  isVideoPlaying: boolean;
  setIsVideoPlaying: (v: boolean) => void;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
}) {
  const [showImageModal, setShowImageModal] = useState(false);

  if (media.type === "video") {
    return (
      <div className="relative aspect-video bg-black overflow-hidden">
        {!isVideoPlaying && (
          <>
            <img
              src={media.thumbUrl}
              alt="Video thumbnail"
              className="block w-full h-full object-cover select-none"
            />
            <button
              className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-white/90 text-zinc-900 shadow flex items-center justify-center"
              onClick={() => setIsVideoPlaying(true)}
              aria-label="Play video"
            >
              ▶
            </button>
          </>
        )}
        {isVideoPlaying && (
          <video
            ref={videoRef}
            className="block w-full h-full"
            src={media.url}
            poster={media.thumbUrl}
            controls
            playsInline
            muted
            preload="metadata"
            autoPlay
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        )}
      </div>
    );
  }
  const src = media.url ?? media.thumbUrl;

  // Fixed height for consistent card sizing
  const containerHeight = 400; // Fixed height for all image containers

  return (
    <>
      <div
        className="relative bg-zinc-100 overflow-hidden"
        style={{ height: `${containerHeight}px` }}
      >
        <img
          src={src}
          alt="Post"
          className="block w-full h-full object-cover select-none"
        />
        <button
          onClick={() => setShowImageModal(true)}
          className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-sm w-8 h-8 rounded hover:bg-opacity-80 transition-opacity flex items-center justify-center"
          title="View full image"
        >
          ⛶
        </button>
      </div>

      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        src={src}
        alt="Full size image"
      />
    </>
  );
}

function PreviewTitle({
  text,
  expanded,
  onToggle,
}: {
  text: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const max = 140;
  const needsTruncate = text.length > max;
  const display = expanded || !needsTruncate ? text : text.slice(0, max).trimEnd() + "…";

  return (
    <div className="text-sm sm:text-base text-foreground">
      <span>{display}</span>
      {needsTruncate && (
        <button
          type="button"
          onClick={onToggle}
          className="ml-2 underline underline-offset-2 text-blue-700 hover:text-blue-900"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reasons: string[], description: string) => void;
}

function ReportModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");

  const reasons = [
    "Inappropriate content",
    "Wrong answer/solution",
    "Technical issue",
    "Poor image quality",
    "Misleading title",
    "Other"
  ];

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReasons.length > 0) {
      onSubmit(selectedReasons, description);
      setSelectedReasons([]);
      setDescription("");
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedReasons([]);
    setDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] w-full max-w-md my-8 min-h-fit">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-black">
              ⚠️ REPORT PROBLEM
            </h2>
            <button
              onClick={handleClose}
              className="text-2xl font-black hover:text-red-600 leading-none hover:scale-110 transition-transform duration-200"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wide mb-3 text-black">
                🚨 What's wrong? (Select all that apply)
              </label>
              <div className="space-y-2">
                {reasons.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center p-2 sm:p-3 border-2 border-black bg-white hover:bg-red-50 cursor-pointer hover:shadow-[3px_3px_0px_0px_#000] transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(reason)}
                      onChange={() => handleReasonToggle(reason)}
                      className="w-4 h-4 mr-2 sm:mr-3 accent-red-500"
                    />
                    <span className="text-xs sm:text-sm font-bold text-black uppercase tracking-wide">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wide mb-2 text-black">
                💬 Tell us more (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue..."
                className="w-full border-2 border-black p-2 sm:p-3 text-xs sm:text-sm font-medium placeholder-gray-500 resize-none bg-white focus:bg-red-50 focus:shadow-[3px_3px_0px_0px_#000] transition-all duration-200"
                rows={3}
              />
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                type="submit"
                disabled={selectedReasons.length === 0}
                className="flex-1 bg-red-500 text-white border-2 border-black font-black py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_#000] disabled:hover:translate-x-0 disabled:hover:translate-y-0 transition-all duration-200"
              >
                🚀 SUBMIT
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gray-300 text-black border-2 border-black font-black py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-200"
              >
                ❌ CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function RoundScreen({ round, onGuess, onReport, isSubmitting }: RoundScreenProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Reset video state on round change
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setTitleExpanded(false);
  }, [round.roundId]);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        {/* Neo-brutalist image card with caption */}
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] overflow-hidden">
          <MediaBlock
            media={round.media}
            isVideoPlaying={isVideoPlaying}
            setIsVideoPlaying={setIsVideoPlaying}
            videoRef={videoRef}
          />
          <div className="border-t-2 border-black bg-secondary-background text-foreground p-3">
            <PreviewTitle
              text={round.title}
              expanded={titleExpanded}
              onToggle={() => setTitleExpanded(v => !v)}
            />
          </div>
        </div>

        <div className="inline-block mt-3">
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_#000] ${
            round.difficulty === 'easy' ? 'bg-green-400 text-black' : 'bg-red-400 text-white'
          }`}>
            {round.difficulty === 'easy' ? '🟢 Easy Mode' : '🔴 Hard Mode'}
          </span>
        </div>

        <div>
          {round.difficulty === 'easy' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {round.options.map((opt, i) => (
                <OptionButton
                  key={opt}
                  index={i}
                  label={`r/${opt}`}
                  onClick={() => onGuess(opt)}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          ) : (
            <SubredditSearch
              onGuess={onGuess}
              disabled={isSubmitting}
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t-2 border-black">
          <button onClick={() => setIsReportModalOpen(true)} className="text-sm font-bold text-black hover:text-red-600 border border-black px-2 py-1 hover:bg-red-100 transition-colors">
            ⚠️ Report a problem
          </button>
          {round.difficulty === 'easy' && (
            <span className="hidden sm:inline text-xs text-gray-600 font-medium text-right">
              💡 Tip: Use keys 1-4 for quick selection
            </span>
          )}
        </div>
      </Card>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={onReport}
      />
    </div>
  );
}
