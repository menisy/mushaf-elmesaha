import React from 'react';
import { Eye, Bookmark } from 'lucide-react';

interface FooterProps {
  isVisible: boolean;
  onToggleColorMode: () => void;
  onBookmarkPage: () => void;
}

const Footer: React.FC<FooterProps> = ({ isVisible, onToggleColorMode, onBookmarkPage }) => {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-gray-800/50 backdrop-blur-sm z-30 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
        <button
          onClick={onToggleColorMode}
          className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
        >
          <Eye className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={onBookmarkPage}
          className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
        >
          <Bookmark className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default Footer;
