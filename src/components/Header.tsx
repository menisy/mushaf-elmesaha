import React from 'react';

interface HeaderProps {
  surahName: string;
  juzuu: number;
  hizb: number;
  pageNumber: number;
  quarterHizb: boolean;
  halfHizb: boolean;
  threeQuarterHizb: boolean;
}

const arabicNumber = (number: number) => {
  const arabicNumberChars = {
    1: '١',
    2: '٢',
    3: '٣',
    4: '٤',
    5: '٥',
    6: '٦',
    7: '٧',
    8: '٨',
    9: '٩',
    0: '٠',
  };

  return number.toString().split('').map(char => arabicNumberChars[char]).join('');
}

const arabicWordLiteral = (number: number) => {
  const literals = {
    1: 'الأول',
    2: 'الثاني',
    3: 'الثالث',
    4: 'الرابع',
    5: 'الخامس',
    6: 'السادس',
    7: 'السابع',
    8: 'الثامن',
    9: 'التاسع',
    10: 'العاشر',
    11: 'الحادي عشر',
    12: 'الثاني عشر',
    13: 'الثالث عشر',
    14: 'الرابع عشر',
    15: 'الخامس عشر',
    16: 'السادس عشر',
    17: 'السابع عشر',
    18: 'الثامن عشر',
    19: 'التاسع عشر',
    20: 'العشرون',
    21: 'الحادي والعشرون',
    22: 'الثاني والعشرون',
    23: 'الثالث والعشرون',
    24: 'الرابع والعشرون',
    25: 'الخامس والعشرون',
    26: 'السادس والعشرون',
    27: 'السابع والعشرون',
    28: 'الثامن والعشرون',
    29: 'التاسع والعشرون',
    30: 'الثلاثون',
  }

  return literals[number.toString()];
}

const Header: React.FC<HeaderProps> = ({ surahName,
                                         juzuu,
                                         hizb,
                                         pageNumber ,
                                         quarterHizb,
                                         halfHizb,
                                         threeQuarterHizb, }) => {


  const hizbArabicNumber = arabicNumber(hizb);
  const pageArabicNumber = arabicNumber(pageNumber + 1);
  const juzuuWord = arabicWordLiteral(juzuu);
  const hizbFraction = threeQuarterHizb ? 'ثلاثة أرباع' : halfHizb ? 'نصف' : quarterHizb ? 'ربع' : '';

  return (
    <div className="w-full bg-gray-800 text-white py-2 px-4 flex justify-between items-center fixed top-0 left-0 z-50">
      <div className="flex-1 text-left" style={{ fontFamily: 'quran_font' }}>
      سورة {surahName}
      </div>
      <div className="flex-1 text-center">
        {pageArabicNumber} <span className="icon-placeholder">📖</span>
      </div>
      <div className="flex-1 text-right" style={{ fontFamily: 'quran_font' }}>
      الجزء {juzuuWord}،  {hizbFraction} الحزب
      <span className="align-top" style={{ fontFamily: 'sans-serif', fontSize: 10 }}>{hizbArabicNumber}</span>{' '}
      </div>
    </div>
  );
};

export default Header;