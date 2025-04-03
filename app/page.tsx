'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { MessageType } from './components/Message';

export default function Home() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure state is reset when component mounts
  useEffect(() => {
    // Clear any existing messages when starting a new chat
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const addMessage = (content: string, role: 'user' | 'assistant') => {
    const newMessage: MessageType = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Generate a chat ID for this new conversation
    const chatId = uuidv4();
    
    // Add user message
    addMessage(content, 'user');
    
    // Reset states
    setIsLoading(true);
    setError(null);
    
    try {
      // Create an assistant message with empty content
      const assistantMsgId = uuidv4();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: '', timestamp: new Date() },
      ]);
      
      // Send request to backend API
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to get response reader');
      
      let fullText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setIsLoading(false);
          break;
        }
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (data === '[DONE]') {
              setIsLoading(false);
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                setError(parsed.error);
                // Update the message content to show the error
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: `Error: ${parsed.error}` } : msg
                  )
                );
                setIsLoading(false);
                break;
              }
              
              if (parsed.chunk) {
                fullText += parsed.chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: fullText } : msg
                  )
                );
              }
            } catch (e) {
              console.error('Failed to parse SSE data', e);
            }
          }
        }
      }
      
      // Save chat to localStorage after successful response
      if (fullText) {
        // Save this chat to localStorage
        const chatTitle = content.length > 30 ? content.substring(0, 30) + '...' : content;
        const newChat = {
          id: chatId,
          title: chatTitle,
          timestamp: new Date()
        };
        
        const storedChats = localStorage.getItem('chatHistory');
        let existingChats = [];
        
        if (storedChats) {
          try {
            existingChats = JSON.parse(storedChats);
          } catch (e) {
            console.error('Failed to parse stored chats:', e);
          }
        }
        
        // Add new chat to the list
        const updatedChats = [newChat, ...existingChats];
        localStorage.setItem('chatHistory', JSON.stringify(updatedChats));
        
        // Also save the messages for this chat
        localStorage.setItem(`chat_${chatId}_messages`, JSON.stringify([
          { id: uuidv4(), role: 'user', content, timestamp: new Date() },
          { id: uuidv4(), role: 'assistant', content: fullText, timestamp: new Date() }
        ]));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('chatHistoryUpdated'));
        
        // Navigate to the chat page to continue the conversation
        window.location.href = `/chat/${chatId}`;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      // Add an error message from the assistant
      setMessages((prev) => [...prev.slice(0, -1), {
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${errorMessage}. Please try again later.`,
        timestamp: new Date(),
      }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--chat-bg)]">
      <div className={`flex-1 overflow-y-auto ${messages.length === 0 ? 'flex items-center justify-center' : ''}`}>
        <ChatWindow 
          messages={messages} 
          onSendSuggestion={handleSendMessage}
        />
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 text-sm max-w-3xl mx-auto my-2 rounded">
            Error: {error}
          </div>
        )}
      </div>
      
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
