import React from 'react';
import { Eye, Bookmark, Search } from 'lucide-react';

interface FooterProps {
  isVisible: boolean;
  onToggleColorMode: () => void;
  onBookmarkPage: () => void;
  onOpenSearch: () => void;
}

const Footer: React.FC<FooterProps> = ({ isVisible, onToggleColorMode, onBookmarkPage, onOpenSearch }) => {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 transition-transform duration-300 z-50 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-3xl mx-auto flex justify-center space-x-8">
        <button
          onClick={onToggleColorMode}
          className="p-2 hover:bg-gray-700 rounded-full"
        >
          <Eye className="w-6 h-6" />
        </button>

        <button
          onClick={onOpenSearch}
          className="p-2 hover:bg-gray-700 rounded-full"
        >
          <Search className="w-6 h-6" />
        </button>

        <button
          onClick={onBookmarkPage}
          className="p-2 hover:bg-gray-700 rounded-full"
        >
          <Bookmark className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Footer;
