'use client';

import React from 'react';

export default function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="h-2 w-2 bg-[var(--primary)] rounded-full animate-pulse"></div>
      <div className="h-2 w-2 bg-[var(--primary)] rounded-full animate-pulse mx-1" style={{ animationDelay: '0.2s' }}></div>
      <div className="h-2 w-2 bg-[var(--primary)] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );
} 