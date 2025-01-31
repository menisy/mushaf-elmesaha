export interface Page {
  imageUrl: string;
  pageNumber: number;
  arabicPageNumber: string;
  title?: string;
  description?: string;
  surahName: string;
  juzuu: number;
  hizb: number;
  quarterHizb: boolean;
  halfHizb: boolean;
  threeQuarterHizb: boolean;
  surahNumber: number;
}

export interface BookMetadata {
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
}