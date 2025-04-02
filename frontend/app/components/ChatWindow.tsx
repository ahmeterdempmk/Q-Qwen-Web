'use client';

import React, { useRef, useEffect } from 'react';
import Message, { MessageType } from './Message';

export default function ChatWindow({ messages }: { messages: MessageType[] }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400 max-w-xl px-4">
            <h2 className="text-2xl font-medium mb-4">Quantum Assistant</h2>
            <p className="mb-4">
              I can answer questions about quantum computing, physics, and more. How can I help you today?
            </p>
          </div>
        </div>
      ) : (
        messages.map((msg) => <Message key={msg.id} message={msg} />)
      )}
      <div ref={messagesEndRef} />
    </div>
  );
} 