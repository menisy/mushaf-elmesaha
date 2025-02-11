import React, { useEffect, useRef, useState } from 'react';
import { arabicNumber } from '../utils';

interface TafseerViewProps {
  ayaId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TafseerAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}

interface TafseerSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahs: TafseerAyah[];
}

interface TafseerData {
  code: number;
  status: string;
  data: {
    surahs: TafseerSurah[];
  };
}

const TafseerView: React.FC<TafseerViewProps> = ({ ayaId, isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [tafseerContent, setTafseerContent] = useState<string | null>(null);
  const [surahName, setSurahName] = useState<string | null>(null);
  const [ayaNumber, setAyaNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTafseerContent = async () => {
      if (!ayaId) return;

      try {
        setIsLoading(true);
        // Parse the ayaId (v1_2 format)
        const [, surahStr, ayaStr] = ayaId.match(/v(\d+)_(\d+)/) || [];
        const surahNumber = parseInt(surahStr);
        const ayaNumber = parseInt(ayaStr);

        if (!surahNumber || !ayaNumber) return;

        const response = await fetch('/muyasar.json');
        const data: TafseerData = await response.json();

        // Find the relevant surah and aya
        const surah = data.data.surahs.find(s => s.number === surahNumber);
        if (surah) {
          const aya = surah.ayahs.find(a => a.numberInSurah === ayaNumber);
          if (aya) {
            setTafseerContent(aya.text);
            setSurahName(surah.name);
            setAyaNumber(ayaNumber);
          }
        }
      } catch (error) {
        console.error('Error fetching tafseer:', error);
        setTafseerContent('عذراً، حدث خطأ في تحميل التفسير');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && ayaId) {
      fetchTafseerContent();
    }
  }, [ayaId, isOpen]);

  // Clear content when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTafseerContent(null);
      setSurahName(null);
      setAyaNumber(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-11/12 max-h-[80vh] overflow-y-auto"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">
            {surahName && `تفسير ${surahName}`}
            {ayaNumber && <span className="mr-2 text-sm">- الآية {arabicNumber(ayaNumber)}</span>}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <div className="dark:text-white min-h-[100px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-gray-500">جاري تحميل التفسير...</p>
            </div>
          ) : tafseerContent ? (
            <p className="text-right leading-8">{tafseerContent}</p>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-gray-500">لا يوجد تفسير</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TafseerView;