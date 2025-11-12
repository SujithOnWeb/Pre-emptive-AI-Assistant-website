import React from 'react';

interface AvatarProps {
  isLoading: boolean;
  isSpeaking: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ isLoading, isSpeaking }) => {
  const imageClasses = `relative w-full h-full object-cover rounded-full transition-all duration-300 ${isSpeaking ? 'animate-speaking-pulse' : ''} ${isLoading ? 'animate-thinking-glow' : 'shadow-lg'}`;

  return (
    <div className="relative w-32 h-32">
      <div className="absolute inset-0 bg-primary rounded-full blur-2xl opacity-50"></div>
      <img 
        alt="AI assistant avatar" 
        className={imageClasses}
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnqqNwaPkul0sRrVCTubGf0ixMwmZSvgx3gtDCdy3lRb5GILinBky5YQs8axCTEL0FHZ7w6c7AZh0FAr3o-M5xVGOpdumAhHrIpL4ZrdxhnGiIohotPjjI-xGNtdjksO-eeRhcTVTuuFw-3eoWkFdZBNbtdqU-Ltkdh9WINEv1f3hZx3C1oAazlaMwvvDU0yg2sXMSmQdrPZIW5SC_LuMccuSGJbp8PFyxjUzkCNr2tDYbty2Z9L_oRn8odLcVLLr2jplbD5aE9nWD"
      />
    </div>
  );
};

export default Avatar;