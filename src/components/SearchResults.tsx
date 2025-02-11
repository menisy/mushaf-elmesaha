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

const SearchResults: React.FC<SearchResultsProps> = ({ isOpen, onClose, onResultClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Array<Fuse.FuseResult<QuranAyah>>>([]);
  const [fuse, setFuse] = useState<Fuse<QuranAyah> | null>(null);
  const [highlightData, setHighlightData] = useState<HighlightData>({});

  // Normalize Arabic text by removing diacritics and normalizing letters
  const normalizeArabic = (text: string) => {
    return text
      .replace(/[\u064B-\u065F]/g, '') // Remove tashkeel
      .replace(/[إأآ]/g, 'ا') // Normalize alef
      .replace(/ة/g, 'ه') // Normalize teh marbuta
      .replace(/ى/g, 'ي'); // Normalize ya
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
            ayahNumber: 1, // First ayah for surah names
            text: normalizeArabic(surah.name),
            isSurahName: true
          })),
          // Add ayahs as searchable items
          ...quranData.data.surahs.flatMap((surah: any) =>
            surah.ayahs.map((ayah: any) => ({
              surahNumber: surah.number,
              surahName: surah.name,
              ayahNumber: ayah.numberInSurah,
              text: normalizeArabic(ayah.text),
              isSurahName: false
            }))
          )
        ];

        // Updated Fuse.js configuration
        const fuseInstance = new Fuse(searchableData, {
          keys: ['text'],
          threshold: 0.2,
          includeScore: true,
          minMatchCharLength: 3,
          distance: 100,
          ignoreLocation: true,
          useExtendedSearch: true,
          findAllMatches: false,
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!fuse || query.length < 2) {
      setResults([]);
      return;
    }

    const normalizedQuery = normalizeArabic(query);
    const searchResults = fuse.search(normalizedQuery);
    setResults(searchResults.slice(0, 10));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-11/12 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">بحث في القرآن</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
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
              <div className="text-gray-600 dark:text-gray-300">{result.item.text}</div>
            </button>
          ))}

          {searchQuery && results.length === 0 && (
            <div className="text-center p-4 text-gray-500 dark:text-gray-400">
              لا توجد نتائج
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;