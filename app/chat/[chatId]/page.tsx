'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import ChatWindow from '../../components/ChatWindow';
import ChatInput from '../../components/ChatInput';
import { MessageType } from '../../components/Message';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string>('');

  // Load chat history based on chatId
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        
        // Load chat title from localStorage
        const storedChats = localStorage.getItem('chatHistory');
        if (storedChats) {
          try {
            const parsedChats = JSON.parse(storedChats);
            const chatData = parsedChats.find((chat: any) => chat.id === chatId);
            if (chatData) {
              setChatTitle(chatData.title);
            } else {
              setChatTitle(`Chat ${chatId}`);
            }
          } catch (e) {
            console.error('Failed to parse stored chats:', e);
            setChatTitle(`Chat ${chatId}`);
          }
        } else {
          setChatTitle(`Chat ${chatId}`);
        }
        
        // Load messages from localStorage
        const storedMessages = localStorage.getItem(`chat_${chatId}_messages`);
        if (storedMessages) {
          try {
            const parsedMessages = JSON.parse(storedMessages);
            // Convert timestamp strings back to Date objects
            const messagesWithDates = parsedMessages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(messagesWithDates);
          } catch (e) {
            console.error('Failed to parse stored messages:', e);
            // If we can't load messages, create a welcome message
            setMessages([
              {
                id: uuidv4(),
                role: 'assistant',
                content: 'Welcome to your new chat!',
                timestamp: new Date(),
              },
            ]);
          }
        } else {
          // If no messages exist yet, create a welcome message
          setMessages([
            {
              id: uuidv4(),
              role: 'assistant',
              content: 'Welcome to your new chat!',
              timestamp: new Date(),
            },
          ]);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading chat history:', err);
        setError('Failed to load chat history');
        setIsLoading(false);
      }
    };
    
    loadChatHistory();
  }, [chatId]);

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
    
    // Add user message
    const userMessage = addMessage(content, 'user');
    
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
        body: JSON.stringify({ 
          chatId,
          message: content
        }),
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
      
      // Save messages to localStorage
      if (fullText) {
        const updatedMessages = [
          ...messages,
          userMessage,
          { id: assistantMsgId, role: 'assistant', content: fullText, timestamp: new Date() }
        ];
        
        localStorage.setItem(`chat_${chatId}_messages`, JSON.stringify(updatedMessages));
        
        // If this is the first message, update the chat title based on the first user message
        const storedChats = localStorage.getItem('chatHistory');
        if (storedChats) {
          const parsedChats = JSON.parse(storedChats);
          const chatData = parsedChats.find((chat: any) => chat.id === chatId);
          
          if (chatData && chatData.title === 'New Chat') {
            // Update chat title with first few words of the user's first message
            const newTitle = content.length > 30 ? content.substring(0, 30) + '...' : content;
            chatData.title = newTitle;
            setChatTitle(newTitle);
            
            // Update the chat in localStorage
            localStorage.setItem('chatHistory', JSON.stringify(parsedChats));
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('chatHistoryUpdated'));
          }
        }
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
      <div className="flex-1 overflow-y-auto">
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