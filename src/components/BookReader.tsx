import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Page } from '../types';
import Header from './Header';

export default function BookReader() {
  const [bookPages, setBookPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768); // Assume mobile if width ≤ 768px
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBookPages = async () => {
      const response = await fetch('/quran_metadata.json');
      const data = await response.json();
      const pages = data.pages.map((page: any) => ({
        imageUrl: `/pages/${page.image_name}`,
        pageNumber: page.number,
        arabicPageNumber: page.arabic_page_number,
        title: `Surah ${page.suurah.english} - Page ${page.number}`,
        surahName: page.suurah.arabic,
        juzuu: page.juzuu,
        hizb: page.hizb,
        quarterHizb: page.quarter_hizb,
        halfHizb: page.half_hizb,
        threeQuarterHizb: page.three_quarter_hizb,
      }));
      setBookPages(pages);
    };

    fetchBookPages();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentPage > 0) {
      navigatePage('prev');
    }
    if (isRightSwipe && currentPage < bookPages.length - 1) {
      navigatePage('next');
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const navigatePage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(curr => curr - 1);
    } else if (direction === 'next' && currentPage < bookPages.length - 1) {
      setCurrentPage(curr => curr + 1);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigatePage('next');
      if (e.key === 'ArrowRight') navigatePage('prev');
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gray-900 flex flex-col items-center justify-center touch-pan-x"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {bookPages.length > 0 && (
        <Header
          surahName={bookPages[currentPage].surahName}
          pageNumber={bookPages[currentPage].pageNumber}
          juzuu={bookPages[currentPage].juzuu}
          hizb={bookPages[currentPage].hizb}
          quarterHizb={bookPages[currentPage].quarterHizb}
          halfHizb={bookPages[currentPage].halfHizb}
          threeQuarterHizb={bookPages[currentPage].threeQuarterHizb}
        />
      )}

      {isDesktop && (
        <button
          onClick={() => navigatePage('next')}
          className="fixed left-4 p-2 bg-gray-800/50 rounded-full hover:bg-gray-800 transition-colors"
          disabled={currentPage === bookPages.length - 1}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      <div className="w-full max-w-3xl mx-auto">
        {bookPages.length > 0 && (
          <img
            src={bookPages[currentPage].imageUrl}
            alt={bookPages[currentPage].title}
            className="w-full h-auto max-h-[90vh] object-contain"
            style={{ direction: 'rtl' }}
          />
        )}
      </div>

      {isDesktop && (
        <button
          onClick={() => navigatePage('prev')}
          className="fixed right-4 p-2 bg-gray-800/50 rounded-full hover:bg-gray-800 transition-colors"
          disabled={currentPage === 0}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
}
