import React, { useState } from 'react';
import SurahModal from './SurahModal';
import { arabicNumber, arabicWordLiteral } from '../utils';


interface HeaderProps {
  surahName: string;
  juzuu: number;
  hizb: number;
  pageNumber: number;
  quarterHizb: boolean;
  halfHizb: boolean;
  threeQuarterHizb: boolean;
  onSurahSelect: (surahNumber: number) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ surahName,
                                         juzuu,
                                         hizb,
                                         pageNumber ,
                                         quarterHizb,
                                         halfHizb,
                                         threeQuarterHizb,
                                         onSurahSelect,
                                         isModalOpen,
                                         setIsModalOpen }) => {

  const handleHeaderClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const hizbArabicNumber = arabicNumber(hizb);
  const pageArabicNumber = arabicNumber(pageNumber + 1);
  const juzuuWord = arabicWordLiteral(juzuu);
  const hizbFraction = threeQuarterHizb ? 'ثَلاثَةُ أربَاعِ' : halfHizb ? 'نصْف' : quarterHizb ? 'ربْع' : '';
  const surahNameSplitFirst = surahName.split(' ')[0];
  const surahNameSplitRest = surahName.split(' ').slice(1).join(' ');

  return (
    <header>
      <div className="w-full bg-gray-800 text-white py-2 px-4 flex justify-between items-center fixed top-0 left-0 z-50" onClick={handleHeaderClick}>
        <div className="flex-1 text-left quran-font">
          <span className="px-1">{surahNameSplitFirst}</span>
          <span>{surahNameSplitRest}</span>
        </div>
        <div className="flex-1 text-center">
          {pageArabicNumber} <span className="icon-placeholder">📖</span>
        </div>
        <div className="flex-1 text-right text-xs quran-font">
          <div className="block">الجُزْءُ {juzuuWord}{' '}</div>
          {hizbFraction}{' '}
          الحِزْب
          <span className="px-1" style={{ fontFamily: 'sans-serif', fontSize: 12 }}>{hizbArabicNumber}</span>{' '}
        </div>
      </div>
      <div className="z-50">
      <SurahModal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        onSurahSelect={onSurahSelect}
        />
      </div>
    </header>
  );
};

export default Header;