import React, { useState, useEffect, useRef } from 'react';

interface HighlightData {
  id: string;
  top: string;
  left: string;
  width: string;
  height: string;
}

interface PageHighlights {
  [key: string]: HighlightData[];
}

interface AyaHighlighterProps {
  currentPage: number;
  imageRef: React.RefObject<HTMLImageElement>;
}

const AyaHighlighter: React.FC<AyaHighlighterProps> = ({ currentPage, imageRef }) => {
  const [highlightData, setHighlightData] = useState<PageHighlights>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const SCALE_FACTOR_WIDTH = 1;
  const SCALE_FACTOR_HEIGHT = 1;

  useEffect(() => {
    const fetchHighlightData = async () => {
      const response = await fetch('/quran_highlight_data.json');
      const data = await response.json();
      setHighlightData(data);
    };

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

  const minTop = Math.min(...currentPageHighlights.map(h => parseFloat(h.top)));
  const minLeft = Math.min(...currentPageHighlights.map(h => parseFloat(h.left)));

  const updateHighlightPositions = () => {
    if (!imageRef.current) return { aspectScale: 1 };
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
    const widthRatio = (imageRect.width - 15) / maxRight;
    const heightRatio = (imageRect.height - 15) / maxBottom;

    // console.log('Highlight bounds:', {
    //   maxRight,
    //   maxBottom,
    //   imageWidth: imageRect.width,
    //   imageHeight: imageRect.height,
    //   ratios: { widthRatio, heightRatio }
    // });

    return {
      widthRatio,
      heightRatio
    };
  };

  const scales = updateHighlightPositions();
  // console.log(scales)
  console.log({ minTop, minLeft })
  const { widthRatio, heightRatio } = scales;

  // console.log({ imageRectWidth: scales.imageRectWidth, imageRectHeight: scales.imageRectHeight })
  return (
    <div
      className="absolute inset-0 mt-2 pointer-events-none"
      style={{
        border: '6px solid green',
        // transform: `scale(${widthAspect}, ${heightAspect})`,
        transformOrigin: 'top left',
        // height: scales.imageRectHeight / heightAspect + 'px',
        // width: scales.imageRectWidth / widthAspect + 'px',
      }}
    >
      <div style={{
        // border: '6px solid green',
        transform: `scale(${heightRatio})`,
        transformOrigin: 'top left',
        // height: scales.imageRectHeight / heightAspect + 'px',
        // width: scales.imageRectWidth / widthAspect + 'px',
      }}>
        {scales && currentPageHighlights.map((highlight) => {
          let top, left, width, height, border;
          // let { widthScale, heightScale, imageRectLeft, imageRectTop } = scales;

        if (isOddPage) {
          // Normalize positions by subtracting original padding before scaling
          top = ((parseFloat(highlight.top) - (minTop))) + 'px';
          left = ((parseFloat(highlight.left) - (minLeft))) + 'px';
          width = parseFloat(highlight.width)  + 'px';
          height = parseFloat(highlight.height) + 'px';
          border = '1px solid red';
        } else {
          top = ((parseFloat(highlight.top) - (minTop))) + 'px';
          left = ((parseFloat(highlight.left) - (minLeft))) + 'px';
          width = parseFloat(highlight.width)  + 'px';
          height = parseFloat(highlight.height) + 'px';
          border = '1px solid blue';
        }

        return (
          <div
            key={highlight.id}
            style={{
              position: 'absolute',
              top,
              left,
              width,
              height,
              border,
              boxSizing: 'border-box',
              // transform: `scale(${widthAspect}, ${heightAspect})`,
              // transformOrigin: 'top left',
            }}
          />
        );
      })}
      </div>
    </div>
  );
};

export default AyaHighlighter;
