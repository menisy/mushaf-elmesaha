import React, { useState, useEffect, useRef } from 'react';
import TafseerView from './TafseerView';

interface HighlightData {
  id: string;
  top: string;
  left: string;
  width: string;
  height: string;
  ayaId?: string;
}

interface PageHighlights {
  [key: string]: HighlightData[];
}

interface AyaHighlighterProps {
  currentPage: number;
  imageRef: React.RefObject<HTMLImageElement>;
  isDarkMode: boolean;
  onHighlight?: (ayaId: string) => void;
}
const MAX_LINES = 12;

interface TooltipPosition {
  x: number;
  y: number;
}

const AyaHighlighter: React.FC<AyaHighlighterProps> = ({ currentPage, imageRef, isDarkMode, onHighlight }) => {
  const [highlightData, setHighlightData] = useState<PageHighlights>({});
  const [highlightedAyas, setHighlightedAyas] = useState<Set<string>>(new Set());
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [selectedAyaId, setSelectedAyaId] = useState<string | null>(null);
  const [showTafseer, setShowTafseer] = useState(false);
  const [lastTap, setLastTap] = useState<{ time: number; id: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const SCALE_FACTOR_WIDTH = 1;
  const SCALE_FACTOR_HEIGHT = 1;

  useEffect(() => {
    const fetchHighlightData = async () => {
      const response = await fetch('/quran_highlight_data.json');
      const data = await response.json();
      setHighlightData(data);
    };

    // console.log("fetched data")

    fetchHighlightData();
  }, []);

  const pageKey = `page_${currentPage + 3}`;
  const currentPageHighlights = highlightData[pageKey] || [];
  const isOddPage = (currentPage + 3) % 2 !== 0;

  // Original padding values to normalize
  const ORIGINAL_PADDING = {
    TOP: 97,
    LEFT: 114
  };

  let minTop = Math.min(...currentPageHighlights.map(h => parseFloat(h.top)));
  minTop = isOddPage ? Math.min(minTop, 95) : Math.min(minTop, 100);
  let minLeft = Math.min(...currentPageHighlights.map(h => parseFloat(h.left)));

  const numberOfLines = () => {
    // retuns number of unique top values
    const uniqueTopValues = [...new Set(currentPageHighlights.map(h => parseFloat(h.top)))];
    return uniqueTopValues.length;
  }

  const updateHighlightPositions = () => {
    if (!imageRef.current) return { widthRatio: 1, heightRatio: 1, topOffset: 0, leftOffset: 0 };
    const imageRect = imageRef.current.getBoundingClientRect();

    // Calculate the maximum right coordinate of highlights
    const maxRight = Math.max(...currentPageHighlights.map(h =>
      (parseFloat(h.left) - minLeft) + parseFloat(h.width)
    ));

    // Calculate the maximum bottom coordinate of highlights
    const maxBottom = Math.max(...currentPageHighlights.map(h =>
      (parseFloat(h.top) - minTop) + parseFloat(h.height)
    ));

    // Calculate scale ratios based on actual highlight bounds vs rendered image
    let widthRatio = (imageRect.width - 15) / maxRight;
    let heightRatio = (imageRect.height - 15) / maxBottom;
    let topOffset = 0;
    let leftOffset = 0;

    if(currentPage === 0 || currentPage === 1){
      widthRatio = ((imageRect.width/2.2) - 15) / maxRight;
      heightRatio = ((imageRect.height/2.2) - 15) / maxBottom;
      topOffset = 0.24 * imageRect.height;
    }
    if(currentPage === 0){
      leftOffset = 0.1 * imageRect.width;
    }

    return {
      widthRatio,
      heightRatio,
      topOffset,
      leftOffset
    };
  };

  const scales = updateHighlightPositions();
  // console.log(scales)
  let { widthRatio, heightRatio, topOffset, leftOffset } = scales;
  // console.log(currentPageHighlights);
  // console.log(numberOfLines());
  const linesCount = numberOfLines();
  if (linesCount === 11) {
    heightRatio = heightRatio * (linesCount / MAX_LINES);
  }
  if (linesCount === 6) {
    heightRatio = heightRatio * (10 / MAX_LINES);
  }
  if (linesCount === 7) {
    heightRatio = heightRatio * (11 / MAX_LINES);
  }

  // Extract base aya ID (v12_33) from full ID (v12_33_2)
  const getBaseAyaId = (id: string) => {
    const parts = id.split('_');
    return parts.length > 2 ? `${parts[0]}_${parts[1]}` : id;
  };

  const handleHighlight = (baseAyaId: string, event?: React.MouseEvent | Touch) => {
    // Clear previous highlights and set new one
    setHighlightedAyas(new Set([baseAyaId]));

    if (event) {
      // Calculate tooltip position based on event type
      const rect = event instanceof Touch
        ? (event.target as HTMLElement).getBoundingClientRect()
        : (event.target as HTMLElement).getBoundingClientRect();

      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setSelectedAyaId(baseAyaId);
    }
  };

  const handleTap = (id: string, event: React.TouchEvent | React.MouseEvent) => {
    // Don't call preventDefault on touch events
    if (event.type !== 'touchstart') {
      event.stopPropagation();
    }

    const currentTime = new Date().getTime();
    const baseAyaId = getBaseAyaId(id);

    // If there's already a highlight and we tap a different aya, clear the highlight
    if (tooltipPosition && selectedAyaId && selectedAyaId !== baseAyaId) {
      setHighlightedAyas(new Set());
      setTooltipPosition(null);
      setSelectedAyaId(null);
      setLastTap(null);
      return;
    }

    if (lastTap && lastTap.id === baseAyaId && currentTime - lastTap.time < 300) {
      // Double tap detected
      if (event.type === 'touchstart') {
        handleHighlight(baseAyaId, (event as React.TouchEvent).touches[0]);
      } else {
        handleHighlight(baseAyaId, event as React.MouseEvent);
      }
      setLastTap(null);
    } else {
      // First tap
      setLastTap({ time: currentTime, id: baseAyaId });
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    // Hide tooltip when clicking outside
    if (tooltipPosition) {
      const tooltipElement = document.getElementById('aya-tooltip');
      if (tooltipElement && !tooltipElement.contains(event.target as Node)) {
        setTooltipPosition(null);
        setSelectedAyaId(null);
      }
    }
  };

  const handleTafseerClick = () => {
    setShowTafseer(true);
    // Hide tooltip when opening tafseer
    setTooltipPosition(null);
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [tooltipPosition]);

  const getHighlightStyle = (id: string) => {
    const baseAyaId = getBaseAyaId(id);
    if (!highlightedAyas.has(baseAyaId)) return {};

    return {
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.2)' // Lighter in dark mode
        : 'rgba(0, 0, 0, 0.1)',      // Darker in light mode
      transition: 'background-color 0.2s ease',
    };
  };

  // Add useEffect to reset highlights when page changes
  useEffect(() => {
    setHighlightedAyas(new Set());
    setTooltipPosition(null);
    setSelectedAyaId(null);
    setShowTafseer(false);
  }, [currentPage]);

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          // border: '6px solid green',
        }}
      >
        <div style={{
          transform: `scale(${widthRatio}, ${heightRatio})`,
          transformOrigin: 'top left',
        }}>
          {scales && currentPageHighlights.map((highlight) => {
            let top, left, width, height;

            // Normalize positions by subtracting original padding before scaling
            top = ((parseFloat(highlight.top) - (minTop))) + topOffset + 'px';
            left = ((parseFloat(highlight.left) - (minLeft))) + leftOffset + 'px';
            width = parseFloat(highlight.width)  + 'px';
            height = parseFloat(highlight.height) + 'px';

            return (
              <div
                key={highlight.id}
                style={{
                  position: 'absolute',
                  top,
                  left,
                  width,
                  height,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  ...getHighlightStyle(highlight.id),
                }}
                onTouchStart={(e) => handleTap(highlight.id, e)}
                onClick={(e) => handleTap(highlight.id, e)}
              />
            );
          })}
        </div>
      </div>

      {tooltipPosition && selectedAyaId && (
        <div
          id="aya-tooltip"
          className="fixed z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 transform -translate-x-1/2"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 40,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center space-x-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            onClick={handleTafseerClick}
          >
            <span className="text-xl">📖</span>
            <span className="dark:text-white">التفسير</span>
          </button>
        </div>
      )}

      <TafseerView
        ayaId={selectedAyaId || ''}
        isOpen={showTafseer}
        onClose={() => {
          setShowTafseer(false);
          setTooltipPosition(null);
          setSelectedAyaId(null);
        }}
      />
    </>
  );
};

export default AyaHighlighter;
