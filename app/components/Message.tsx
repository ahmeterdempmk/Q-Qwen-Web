'use client';

import React from 'react';

export type MessageType = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
};

const MarkdownRenderer = ({ content }: { content: string }) => {
  let formattedContent = content
    .replace(/\n\n/g, '\n\n\n')
    .replace(/^(#{1,3}.*)\n/gm, '$1\n\n');
  
  formattedContent = formattedContent.replace(
    /^(\d+\.)\s+(.*(?:\n(?!\d+\.).*)*)/gm, 
    (match, number, content) => {
      return `<div class="markdown-step"><strong class="step-number">${number}</strong> ${content.trim()}</div>`;
    }
  );
  
  formattedContent = formattedContent.replace(/```([\s\S]*?)```/g, (match, codeContent) => {
    return `<pre><code>${codeContent.trim()}</code></pre>`;
  });
  
  formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  formattedContent = formattedContent.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  formattedContent = formattedContent.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  formattedContent = formattedContent.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  formattedContent = formattedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  formattedContent = formattedContent.replace(/^\s*-\s*(.*$)/gm, '<li>$1</li>');
  formattedContent = formattedContent.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="markdown-list">$1</ul>');
  
  formattedContent = formattedContent.replace(/([^>\n])\n(?!<)(?!<\/div>)([^\n])/g, '$1<br>$2');
  
  formattedContent = formattedContent.replace(/^(?!<(div|h[1-3]|pre|ul|ol|li))[^<\n].*$/gm, '<p>$&</p>');
  
  formattedContent = formattedContent.replace(/<p><\/p>/g, '');
  
  formattedContent = formattedContent.replace(/<br><br>/g, '</p><p>');
  
  formattedContent = formattedContent.replace(/<p><p>(.*?)<\/p><\/p>/g, '<p>$1</p>');
  
  return <div dangerouslySetInnerHTML={{ __html: formattedContent }} className="markdown-content" />;
};

export default function Message({ message }: { message: MessageType }) {
  const isUser = message.role === 'user';

  return (
    <div className={`py-5 ${isUser ? 'bg-transparent' : 'bg-[var(--chat-bg)]'}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-4 items-start">
        <div 
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
            isUser ? 'bg-[var(--primary)]' : 'bg-blue-600'
          }`}
          aria-hidden="true"
        >
          {isUser ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 0 0-9z"></path>
              <path d="M12 13a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 0 0-9z"></path>
              <path d="M5 7.5a4.5 4.5 0 0 0 7-4"></path>
              <path d="M19 7.5a4.5 4.5 0 0 1-7-4"></path>
              <path d="M5 16.5a4.5 4.5 0 0 1 7-4"></path>
              <path d="M19 16.5a4.5 4.5 0 0 0-7-4"></path>
            </svg>
          )}
        </div>
        <div className="prose prose-sm dark:prose-invert flex-1">
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            message.content ? (
              <MarkdownRenderer content={message.content} />
            ) : (
              <div className="flex items-center">
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse mx-1" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
} 