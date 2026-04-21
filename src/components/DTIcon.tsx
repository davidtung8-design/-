import React from 'react';
import { ThemeConfig } from '../types';

interface DTIconProps {
  theme?: ThemeConfig;
  size?: number;
  className?: string;
}

export const DTIcon: React.FC<DTIconProps> = ({ theme, size = 40, className }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" rx="24" fill="url(#dt-gradient)" />
      <path 
        d="M30 30V70C30 70 50 70 50 50C50 30 30 30 30 30Z" 
        stroke="white" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M50 30H70M60 30V70" 
        stroke="white" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <defs>
        <linearGradient id="dt-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor={theme?.accent || "#3B82F6"} />
          <stop offset="1" stopColor={theme?.border || "#1E3A8A"} />
        </linearGradient>
      </defs>
    </svg>
  );
};
