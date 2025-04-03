'use client';

import React, { useState, useRef, useEffect } from 'react';
import LoadingIndicator from './LoadingIndicator';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current && !isLoading) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 500);
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      
      // Re-focus the textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="py-4 border-t border-[var(--border-color)] bg-[var(--chat-bg)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {isLoading && <LoadingIndicator />}
        <form onSubmit={handleSubmit} className="relative">
          <div 
            className={`flex items-center gap-2 relative border rounded-lg shadow-sm bg-[var(--background)] transition-all duration-200 ${
              isFocused 
                ? 'border-[var(--primary)] ring-1 ring-[var(--primary)] shadow-md' 
                : 'border-[var(--border-color)]'
            }`}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask a question..."
              rows={1}
              className="w-full px-3 py-3 my-auto resize-none outline-none bg-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2 mb-2 mr-2 rounded-md transition-colors ${
                !input.trim() || isLoading
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-[var(--primary)] hover:bg-[var(--primary)]/10'
              }`}
              aria-label="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </div>
          <div className="text-xs text-center mt-2 text-gray-500">
            AI-generated, for reference only
          </div>
        </form>
      </div>
    </div>
  );
} 