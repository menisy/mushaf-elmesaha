import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { arabicNumber, revalationTypeArabic } from "../utils";

interface Surah {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface SurahModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onSurahSelect: (surahNumber: number) => void;
}

const SurahModal: React.FC<SurahModalProps> = ({
  isOpen,
  onRequestClose,
  onSurahSelect,
}) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);

  useEffect(() => {
    const fetchSurahs = async () => {
      const response = await fetch("/surahs.json");
      const data = await response.json();
      setSurahs(data.surahs.references);
    };

    fetchSurahs();
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Surah List"
      className="fixed inset-0 flex items-center justify-center p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
    >
      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">الفهرس</h2>
        <div className="overflow-y-auto max-h-96">
          {surahs.map((surah) => (
            <button
              key={surah.number}
              onClick={() => onSurahSelect(surah.number)}
              className="flex justify-between items-center w-full p-3 border border-gray-700 rounded-lg mb-2 hover:bg-gray-800 transition duration-200"
            >
              <span className="flex-1 text-sm font-medium text-left font-thin quran-font">{revalationTypeArabic(surah.revelationType)}</span>
              <span className="flex-0 px-1 text-lg font-medium text-center quran-font font-thin">آية</span>
              <span className="flex-0 text-lg font-medium text-center font-thin">{arabicNumber(surah.numberOfAyahs)}</span>
              <span className="flex-1 text-lg font-bold text-right quran-font"><span className="text-sm sans">{arabicNumber(surah.number)}.</span> {surah.name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onRequestClose}
          className="mt-4 w-full p-3 bg-red-600 rounded-lg hover:bg-red-700 transition duration-200"
        >
          إغلاق
        </button>
      </div>
    </Modal>
  );
};

export default SurahModal;
