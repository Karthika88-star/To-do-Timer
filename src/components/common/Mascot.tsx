'use client';

import React from 'react';
import Image from 'next/image';

interface MascotProps {
  variant?: 'focused' | 'celebrating' | 'empty';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const CELEBRATING_SIZES = {
  sm: { width: 200, height: 113 },
  md: { width: 280, height: 158 },
  lg: { width: 360, height: 203 },
  xl: { width: 440, height: 248 },
};

const EMPTY_STATE_SIZES = {
  sm: { width: 160, height: 160 },
  md: { width: 220, height: 220 },
  lg: { width: 280, height: 280 },
  xl: { width: 340, height: 340 },
};

export function Mascot({
  variant = 'empty',
  size = 'md',
  className = '',
  alt,
}: MascotProps) {
  const isCelebrating = variant === 'celebrating';

  // Pink Celebration GIF vs Blue Productivity Illustration
  const src = isCelebrating
    ? '/images/task-completion.gif'
    : '/images/productivity-empty-state.png';

  const defaultAlt = isCelebrating
    ? 'Girl celebrating with hands raised against pink background'
    : 'Girl studying at her desk with laptop and notebook against blue background';

  const dimensions = isCelebrating
    ? CELEBRATING_SIZES[size] || CELEBRATING_SIZES.md
    : EMPTY_STATE_SIZES[size] || EMPTY_STATE_SIZES.md;

  return (
    <div className={`relative inline-flex items-center justify-center select-none overflow-hidden rounded-2xl ${className}`}>
      <Image
        src={src}
        alt={alt || defaultAlt}
        width={dimensions.width}
        height={dimensions.height}
        unoptimized={isCelebrating}
        className={`w-auto h-auto max-w-full object-contain ${
          isCelebrating ? 'aspect-[16/9]' : 'aspect-square'
        } drop-shadow-sm transition-transform duration-300 hover:scale-[1.02]`}
        priority
      />
    </div>
  );
}
