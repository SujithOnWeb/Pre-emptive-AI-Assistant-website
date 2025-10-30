import React from 'react';

interface AvatarProps {
  isLoading: boolean;
  isSpeaking: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ isLoading, isSpeaking }) => {
  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style={{ stopColor: 'rgba(99, 102, 241, 0.8)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'rgba(99, 102, 241, 0)', stopOpacity: 0 }} />
          </radialGradient>
          <linearGradient id="skinGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <linearGradient id="hairGradient" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
           <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feOffset in="blur" dy="2" result="offsetBlur" />
            <feMerge>
              <feMergeNode in="offsetBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Glow */}
        <circle 
          cx="100" 
          cy="100" 
          r="90" 
          fill="url(#glowGradient)" 
          className={`transform-origin-center transition-all duration-500 ${isLoading ? 'animate-thinking-glow' : 'opacity-30'}`}
        />
        
        <g filter="url(#shadow)">
          {/* Neck and Shoulders */}
          <path d="M 80 140 C 70 180, 130 180, 120 140 L 130 200 L 70 200 Z" fill="#3730a3" />
          
          {/* Head */}
          <path d="M 100, 30 C 60, 30, 40, 70, 40, 110 C 40, 150, 70, 160, 100, 160 C 130, 160, 160, 150, 160, 110 C 160, 70, 140, 30, 100, 30 Z" fill="url(#skinGradient)" />
          
          {/* Hair */}
          <path d="M 100, 30 C 60, 30, 40, 70, 40, 110 C 40, 80, 60, 20, 100, 20 C 140, 20, 160, 80, 160, 110 C 160, 70, 140, 30, 100, 30 Z" fill="url(#hairGradient)" />
          <path d="M 42, 90 C 35, 110, 40, 130, 48, 120 L 42, 90 Z" fill="url(#hairGradient)" />
          <path d="M 158, 90 C 165, 110, 160, 130, 152, 120 L 158, 90 Z" fill="url(#hairGradient)" />

          {/* Eyes */}
          <circle cx="75" cy="95" r="5" fill="#e0e7ff" />
          <circle cx="125" cy="95" r="5" fill="#e0e7ff" />
          
          {/* Mouth */}
          <path 
            d="M 90 130 Q 100 135 110 130" 
            stroke="#c7d2fe" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
            className={isSpeaking ? 'animate-speak-mouth' : ''}
          />
        </g>
      </svg>
    </div>
  );
};

export default Avatar;
