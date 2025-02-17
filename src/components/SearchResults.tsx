import React, { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { arabicNumber } from '../utils';

interface SearchResultsProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick: (page: number) => void;
}

interface QuranAyah {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  isSurahName?: boolean; // To differentiate between surah names and ayahs
  originalText?: string; // Optional original text for display
}

interface HighlightData {
  [key: string]: Array<{
    id: string;
    top: string;
    left: string;
    width: string;
    height: string;
  }>;
}

const RESULTS_PER_PAGE = 30;

const SearchResults: React.FC<SearchResultsProps> = ({ isOpen, onClose, onResultClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Array<Fuse.FuseResult<QuranAyah>>>([]);
  const [fuse, setFuse] = useState<Fuse<QuranAyah> | null>(null);
  const [highlightData, setHighlightData] = useState<HighlightData>({});
  const [displayedResults, setDisplayedResults] = useState<number>(RESULTS_PER_PAGE);
  const [allResults, setAllResults] = useState<Array<Fuse.FuseResult<QuranAyah>>>([]);

  // Normalize Arabic text by removing diacritics and normalizing letters
  const normalizeArabic = (text: string) => {
    return text
      .replace(/[\u064B-\u065F]/g, '') // Remove tashkeel
      .replace(/[إأآ]/g, 'ا') // Normalize alef
      .replace(/ة/g, 'ه') // Normalize teh marbuta
      .replace(/ى/g, 'ي'); // Normalize ya
  };

  // Add function to clean first aya text
  const cleanFirstAyaText = (text: string, isFirstAya: boolean) => {
    if (!isFirstAya) return text;

    // Remove "بسم الله الرحمن الرحيم" and any extra spaces
    return text.replace(/^بسم الله الرحمن الرحيم\s*/, '').trim();
  };

  useEffect(() => {
    const setupSearch = async () => {
      try {
        const [quranResponse, highlightResponse] = await Promise.all([
          fetch('/quran_simple_clean.json'),
          fetch('/quran_highlight_data.json')
        ]);

        const quranData = await quranResponse.json();
        const highlightData = await highlightResponse.json();

        setHighlightData(highlightData);

        // Create searchable data including both surah names and ayahs
        const searchableData: QuranAyah[] = [
          // Add surah names as searchable items
          ...quranData.data.surahs.map((surah: any) => ({
            surahNumber: surah.number,
            surahName: surah.name,
            ayahNumber: 1,
            text: normalizeArabic(surah.name),
            isSurahName: true
          })),
          // Add ayahs as searchable items
          ...quranData.data.surahs.flatMap((surah: any) =>
            surah.ayahs.map((ayah: any) => {
              const isFirstAya = ayah.numberInSurah === 1;
              const cleanedText = cleanFirstAyaText(ayah.text, isFirstAya);

              return {
                surahNumber: surah.number,
                surahName: surah.name,
                ayahNumber: ayah.numberInSurah,
                text: normalizeArabic(cleanedText),
                isSurahName: false,
                originalText: ayah.text // Keep original text for display
              };
            })
          )
        ];

        // Updated Fuse.js configuration
        const fuseInstance = new Fuse(searchableData, {
          keys: ['text'],
          includeScore: true,
          useExtendedSearch: true,
          findAllMatches: true,
          ignoreLocation: true,
          threshold: 0.0,  // Exact matching
          minMatchCharLength: 2
        });

        setFuse(fuseInstance);
      } catch (error) {
        console.error('Error setting up search:', error);
      }
    };

    setupSearch();
  }, []);

  const findPageForAya = (surahNumber: number, ayaNumber: number): number => {
    // Format the aya ID to match the highlight data format
    const ayaId = `v${surahNumber}_${ayaNumber}`;

    // Search through all pages in highlight data
    for (const [pageKey, highlights] of Object.entries(highlightData)) {
      // Check if any highlight on this page matches our aya
      const found = highlights.some(highlight => {
        // Match either exact ID or ID with line number (e.g., v1_2 or v1_2_1)
        const highlightBaseId = highlight.id.split('_').slice(0, 2).join('_');
        return highlightBaseId === ayaId;
      });

      if (found) {
        // Extract page number from the key (e.g., "page_3" -> 3)
        const pageNumber = parseInt(pageKey.split('_')[1]);
        return pageNumber - 3; // Adjust for the page offset
      }
    }

    return 0; // Default to first page if not found
  };

  const findFirstPageOfSurah = (surahNumber: number): number => {
    // Search through all pages to find the first occurrence of this surah
    for (const [pageKey, highlights] of Object.entries(highlightData)) {
      const found = highlights.some(highlight => {
        const [, surahNum] = highlight.id.match(/v(\d+)_/) || [];
        return parseInt(surahNum) === surahNumber;
      });

      if (found) {
        const pageNumber = parseInt(pageKey.split('_')[1]);
        return pageNumber - 3;
      }
    }
    return 0;
  };

  const sortSearchResults = (results: Array<Fuse.FuseResult<QuranAyah>>) => {
    return [...results].sort((a, b) => {
      // Always show surah names first
      if (a.item.isSurahName !== b.item.isSurahName) {
        return a.item.isSurahName ? -1 : 1;
      }

      // If both are surah names or both are ayahs, sort by surah number
      if (a.item.surahNumber !== b.item.surahNumber) {
        return a.item.surahNumber - b.item.surahNumber;
      }

      // If same surah and both are ayahs, sort by aya number
      return a.item.ayahNumber - b.item.ayahNumber;
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!fuse || query.length < 2) {
      setAllResults([]);
      setResults([]);
      return;
    }

    const normalizedQuery = normalizeArabic(query);
    // Use extended search syntax for exact substring matching
    const searchResults = fuse.search(`'${normalizedQuery}`); // Note the single quote for exact matching
    const sortedResults = sortSearchResults(searchResults);

    setAllResults(sortedResults);
    setResults(sortedResults.slice(0, RESULTS_PER_PAGE));
    setDisplayedResults(RESULTS_PER_PAGE);
  };

  const handleLoadMore = () => {
    const nextBatch = allResults.slice(displayedResults, displayedResults + RESULTS_PER_PAGE);
    setResults([...results, ...nextBatch]);
    setDisplayedResults(prev => prev + RESULTS_PER_PAGE);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-11/12 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
          <h2 className="text-xl font-bold dark:text-white text-right">بحث في القرآن</h2>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="ابحث في القرآن..."
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          dir="rtl"
        />

        <div className="overflow-y-auto flex-1">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => {
                const page = result.item.isSurahName
                  ? findFirstPageOfSurah(result.item.surahNumber)
                  : findPageForAya(result.item.surahNumber, result.item.ayahNumber);
                onResultClick(page);
                onClose();
              }}
              className="w-full text-right p-4 hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700"
            >
              <div className="font-bold dark:text-white mb-2">
                {result.item.isSurahName ? (
                  result.item.surahName
                ) : (
                  `${result.item.surahName} - الآية ${arabicNumber(result.item.ayahNumber)}`
                )}
              </div>
              {!result.item.isSurahName && (
                <div className="text-gray-600 dark:text-gray-300">
                  {result.item.originalText || result.item.text}
                </div>
              )}
            </button>
          ))}

          {searchQuery && results.length === 0 && (
            <div className="text-center p-4 text-gray-500 dark:text-gray-400">
              لا توجد نتائج
            </div>
          )}

          {allResults.length > displayedResults && (
            <button
              onClick={handleLoadMore}
              className="w-full p-3 mt-4 text-center text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              عرض المزيد من النتائج ({arabicNumber(allResults.length - displayedResults)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;