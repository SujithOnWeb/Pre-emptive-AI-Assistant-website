import React from 'react';

interface MicrophoneButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ isListening, onClick, disabled }) => {
  const buttonClasses = `
    p-3 rounded-full text-white transition-all duration-300
    ${isListening ? 'bg-red-600 hover:bg-red-500 animate-listening' : 'bg-indigo-600 hover:bg-indigo-500'}
    ${disabled ? 'bg-slate-700 cursor-not-allowed' : ''}
  `;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
    >
      {isListening ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
          <path d="M5.5 8.5a.5.5 0 01.5.5v1.5a.5.5 0 01-1 0V9a.5.5 0 01.5-.5z" />
          <path d="M10 15a4 4 0 004-4h-1.5a2.5 2.5 0 01-5 0H6a4 4 0 004 4z" />
          <path d="M12.5 8.5a.5.5 0 01.5.5v1.5a.5.5 0 01-1 0V9a.5.5 0 01.5-.5z" />
        </svg>
      )}
    </button>
  );
};

export default MicrophoneButton;
