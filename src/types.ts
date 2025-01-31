export interface Page {
  imageUrl: string;
  pageNumber: number;
  title?: string;
  description?: string;
}

export interface BookMetadata {
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
}