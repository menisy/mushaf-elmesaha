import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Eye, Bookmark } from 'lucide-react'; // Import the Bookmark icon
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer and toast
import type { Page } from '../types';
import Header from './Header';
import AyaHighlighter from './AyaHighliter';
import Footer from './Footer';

export default function BookReader() {
  const [bookPages, setBookPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isColorMode, setIsColorMode] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  // rjust 1 to 001
  const currentPageString = currentPage.toString().padStart(3, '0');

  const convertPageNumerToAdjustedString = (pageNumber: number) => {
    return pageNumber.toString().padStart(3, '0') + '.png';
  };

  useEffect(() => {
    const fetchBookPages = async () => {
      const response = await fetch('/quran_metadata.json');
      const data = await response.json();
      const pages = data.pages.map((page: any) => ({
        imageUrl: `/new_pages/${convertPageNumerToAdjustedString(page.number+2)}`,
        pageNumber: page.number,
        arabicPageNumber: page.arabic_page_number,
        title: `Surah ${page.suurah.english} - Page ${page.number}`,
        surahName: page.suurah.arabic,
        juzuu: page.juzuu,
        hizb: page.hizb,
        quarterHizb: page.quarter_hizb,
        halfHizb: page.half_hizb,
        threeQuarterHizb: page.three_quarter_hizb,
        surahNumber: page.surah_number,
      }));
      setBookPages(pages);

      // Retrieve the bookmarked page from local storage
      const bookmarkedPage = localStorage.getItem('bookmarkedPage');
      if (bookmarkedPage) {
        setCurrentPage(Number(bookmarkedPage));
      }
    };

    fetchBookPages();
  }, []);

  const navigatePage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(curr => curr - 1);
    } else if (direction === 'next' && currentPage < bookPages.length - 1) {
      setCurrentPage(curr => curr + 1);
    }
  };

  const handleSurahSelect = (surahNumber: number) => {
    const firstPageOfSurah = bookPages.findIndex(page => page.surahNumber === surahNumber);
    if (firstPageOfSurah !== -1) {
      setCurrentPage(firstPageOfSurah);
      setIsModalOpen(false);
    }
  };

  const toggleColorMode = () => {
    setIsColorMode(!isColorMode);
  };

  const bookmarkPage = () => {
    localStorage.setItem('bookmarkedPage', currentPage.toString());
    toast.success('تم وضع إشارة مرجعية على الصفحة', {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigatePage('next');
      if (e.key === 'ArrowRight') navigatePage('prev');
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage]);

  const handleReaderClick = () => {
    setIsFooterVisible(prev => !prev);
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col items-center overflow-hidden justify-center touch-pan-x ${
        isColorMode ? 'bg-gray-900' : 'bg-[#FFFDD0]'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleReaderClick}
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
          onSurahSelect={handleSurahSelect}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        />
      )}

      {isDesktop && (
        <button
          onClick={() => navigatePage('prev')}
          className="fixed right-4 p-2 bg-gray-800/50 rounded-full hover:bg-gray-800 transition-colors"
          disabled={currentPage === 0}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      <div className="max-w-3xl mx-auto relative w-full flex justify-center">
        {bookPages.length > 0 && (
          <div className="relative mt-10 z-10">
            <img
              ref={imageRef}
              src={bookPages[currentPage].imageUrl}
              alt={bookPages[currentPage].title}
              className={`h-auto max-h-[90vh] mx-auto px-2 object-contain ${
                isColorMode ? 'invert brightness-90' : ''
              }`}
              style={{ direction: 'rtl' }}
            />
            <AyaHighlighter
              currentPage={currentPage}
              imageRef={imageRef}
              isDarkMode={isColorMode}
            />
          </div>
        )}
      </div>

      {isDesktop && (
        <button
          onClick={() => navigatePage('next')}
          className="fixed left-4 p-2 bg-gray-800/50 rounded-full hover:bg-gray-800 transition-colors"
          disabled={currentPage === bookPages.length - 1}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      <Footer
        isVisible={isFooterVisible}
        onToggleColorMode={toggleColorMode}
        onBookmarkPage={bookmarkPage}
      />
      <ToastContainer />
    </div>
  );
}
