'use client';

import React, { useRef, useEffect } from 'react';
import Message, { MessageType } from './Message';

interface ChatWindowProps {
  messages: MessageType[];
  onSendSuggestion?: (message: string) => void;
}

export default function ChatWindow({ messages, onSendSuggestion }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    if (onSendSuggestion) {
      onSendSuggestion(suggestion);
    }
  };

  // If there are no messages, show the welcome screen
  if (messages.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center text-gray-500 dark:text-gray-400 px-4 flex flex-col items-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 0 0-9z"></path>
                <path d="M12 13a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 0 0-9z"></path>
                <path d="M5 7.5a4.5 4.5 0 0 0 7-4"></path>
                <path d="M19 7.5a4.5 4.5 0 0 1-7-4"></path>
                <path d="M5 16.5a4.5 4.5 0 0 1 7-4"></path>
                <path d="M19 16.5a4.5 4.5 0 0 0-7-4"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold mb-3">Hi, I'm Quantum Assistant.</h2>
          <p className="text-sm mb-12">
            How can I help you today?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
            <button 
              onClick={() => handleSuggestionClick("Explain quantum entanglement")}
              className="p-3 text-left text-sm rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Explain quantum entanglement
            </button>
            <button 
              onClick={() => handleSuggestionClick("How do quantum computers work?")}
              className="p-3 text-left text-sm rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              How do quantum computers work?
            </button>
            <button 
              onClick={() => handleSuggestionClick("What is Schrödinger's equation?")}
              className="p-3 text-left text-sm rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              What is Schrödinger's equation?
            </button>
            <button 
              onClick={() => handleSuggestionClick("Tell me about quantum algorithms")}
              className="p-3 text-left text-sm rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Tell me about quantum algorithms
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If there are messages, show the chat
  return (
    <div className="w-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {messages.map((msg) => <Message key={msg.id} message={msg} />)}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
} 