import React from 'react';

interface DeepLearningLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DeepLearningLogo: React.FC<DeepLearningLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Circular Ring */}
        <circle cx="50" cy="50" r="46" stroke="#0284C7" strokeWidth="4" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="42" stroke="#E2E8F0" strokeWidth="1" />

        {/* Text on Circular Arc simulated */}
        <path id="circlePathTop" d="M 20,50 A 30,30 0 1,1 80,50" fill="none" />
        <text fontSize="8.5" fontWeight="900" fill="#0369A1" textAnchor="middle">
          <textPath href="#circlePathTop" startOffset="50%">
            DEEP LEARNING
          </textPath>
        </text>

        {/* Dynamic Stylized Figure emerging with books and star */}
        <circle cx="50" cy="42" r="5" fill="#F59E0B" />
        <path d="M42 56C42 50 46 47 50 47C54 47 58 50 58 56L55 68H45L42 56Z" fill="#10B981" />
        {/* Open Book Wings */}
        <path d="M50 63C44 60 36 62 32 66C36 70 44 68 50 67C56 68 64 70 68 66C64 62 56 60 50 63Z" fill="#3B82F6" />
        
        {/* Bottom Arc Text */}
        <path id="circlePathBottom" d="M 80,50 A 30,30 0 0,1 20,50" fill="none" />
        <text fontSize="6.5" fontWeight="700" fill="#64748B" textAnchor="middle">
          <textPath href="#circlePathBottom" startOffset="50%">
            MINDFUL • MEANINGFUL • JOYFUL
          </textPath>
        </text>
      </svg>
    </div>
  );
};
