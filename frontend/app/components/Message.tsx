'use client';

import React from 'react';

export type MessageType = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
};

export default function Message({ message }: { message: MessageType }) {
  const isUser = message.role === 'user';

  return (
    <div className={`py-5 ${isUser ? 'bg-transparent' : 'bg-[var(--chat-bg)]'}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-4 items-start">
        <div 
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
            isUser ? 'bg-[var(--primary)]' : 'bg-green-600'
          }`}
          aria-hidden="true"
        >
          {isUser ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M16.5 7.5h-9v9h9v-9z" />
              <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="prose prose-sm dark:prose-invert flex-1 whitespace-pre-wrap">
          {isUser ? message.content : (
            message.content || (
              <div className="flex items-center">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse mx-1" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
} 