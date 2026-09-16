import React from 'react';

interface KurikulumMerdekaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const KurikulumMerdekaLogo: React.FC<KurikulumMerdekaLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-14',
  };

  return (
    <div className={`inline-flex items-center gap-2 bg-white px-2 py-1 rounded-md shadow-2xs border border-slate-200/80 ${sizeMap[size]} ${className}`}>
      {/* Authentic Kurikulum Merdeka Symbol */}
      <svg
        viewBox="0 0 120 120"
        className="h-full w-auto aspect-square shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="60" cy="60" r="58" fill="#F8FAFC" />
        {/* Abstract figure & dynamic swooshes */}
        <path
          d="M32 82C35 65 52 40 70 38C88 36 94 48 88 64C82 80 58 92 38 90C34 89 32 85 32 82Z"
          fill="#0284C7"
        />
        <path
          d="M48 30C54 28 62 32 64 38C66 44 60 50 54 52C48 54 40 48 40 42C40 36 44 31 48 30Z"
          fill="#F59E0B"
        />
        <path
          d="M26 66C38 64 50 68 62 76C74 84 84 84 94 76C82 92 56 94 38 88C30 84 24 74 26 66Z"
          fill="#1E3A8A"
        />
        <path
          d="M62 42C74 46 82 54 84 66C76 68 68 64 60 56C56 52 58 46 62 42Z"
          fill="#38BDF8"
        />
      </svg>

      {/* Typography */}
      <div className="flex flex-col justify-center leading-none select-none">
        <span className="text-[9px] font-medium text-slate-500 tracking-wider">KURIKULUM</span>
        <span className="text-[13px] font-black text-sky-800 tracking-tight">MERDEKA</span>
      </div>
    </div>
  );
};
