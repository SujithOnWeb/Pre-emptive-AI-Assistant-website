
import React from 'react';

interface SuggestionChipProps {
  text: string;
  onClick: (text: string) => void;
  disabled?: boolean;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ text, onClick, disabled }) => {
  return (
    <button
      onClick={() => onClick(text)}
      disabled={disabled}
      className="px-4 py-2 text-sm font-medium text-indigo-200 bg-indigo-900/50 border border-indigo-700 rounded-full transition-all duration-200 ease-in-out hover:bg-indigo-800/70 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {text}
    </button>
  );
};

export default SuggestionChip;
