'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

// Type for chat history items
interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
}

interface GroupedChats {
  yesterday: ChatHistoryItem[];
  '7days': ChatHistoryItem[];
  '30days': ChatHistoryItem[];
  older: Record<string, ChatHistoryItem[]>;
}

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<GroupedChats>({
    yesterday: [],
    '7days': [],
    '30days': [],
    older: {}
  });
  
  // Extract chat ID from the pathname
  useEffect(() => {
    const match = pathname.match(/\/chat\/(.+)/);
    if (match && match[1]) {
      setSelectedChatId(match[1]);
    } else {
      setSelectedChatId(null);
    }
  }, [pathname]);
  
  // Function to group chats by date ranges
  const groupChatsByDate = useCallback((chats: ChatHistoryItem[]): GroupedChats => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result: GroupedChats = {
      yesterday: [],
      '7days': [],
      '30days': [],
      older: {}
    };
    
    chats.forEach(chat => {
      const chatDate = new Date(chat.timestamp);
      
      // Check which time period this chat belongs to
      if (chatDate >= yesterday) {
        result.yesterday.push(chat);
      } else if (chatDate >= sevenDaysAgo) {
        result['7days'].push(chat);
      } else if (chatDate >= thirtyDaysAgo) {
        result['30days'].push(chat);
      } else {
        // Group by year-month for older chats
        const yearMonth = `${chatDate.getFullYear()}-${String(chatDate.getMonth() + 1).padStart(2, '0')}`;
        if (!result.older[yearMonth]) {
          result.older[yearMonth] = [];
        }
        result.older[yearMonth].push(chat);
      }
    });
    
    return result;
  }, []);
  
  // This effect would fetch chat history from an API
  const fetchChatHistory = useCallback(async () => {
    try {
      // In a production app, this would fetch from an API
      // const response = await fetch('/api/chat-history');
      // const data = await response.json();
      
      // For now, we'll use localStorage to persist chat history
      const storedChats = localStorage.getItem('chatHistory');
      let mockChats: ChatHistoryItem[] = [];
      
      if (storedChats) {
        try {
          const parsedChats = JSON.parse(storedChats);
          // Ensure timestamps are parsed as Date objects
          mockChats = parsedChats.map((chat: any) => ({
            ...chat,
            timestamp: new Date(chat.timestamp)
          }));
        } catch (e) {
          console.error('Failed to parse stored chats:', e);
        }
      }
      
      // Group chats by time period
      const grouped = groupChatsByDate(mockChats);
      setChatHistory(grouped);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  }, [groupChatsByDate]);
  
  useEffect(() => {
    fetchChatHistory();
    
    // Set up interval to refresh chat history
    const intervalId = setInterval(() => {
      fetchChatHistory();
    }, 30000); // Refresh every 30 seconds
    
    // Add event listener for storage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'chatHistory' || event.key?.startsWith('chat_')) {
        fetchChatHistory();
      }
    };
    
    // Add event listener for custom chatHistoryUpdated event
    const handleChatHistoryUpdate = () => {
      fetchChatHistory();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('chatHistoryUpdated', handleChatHistoryUpdate);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chatHistoryUpdated', handleChatHistoryUpdate);
    };
  }, [fetchChatHistory]);
  
  const handleNewChat = () => {
    // Create a new chat session with a unique ID
    const newChatId = uuidv4();
    const newChat: ChatHistoryItem = {
      id: newChatId,
      title: 'New Chat',
      timestamp: new Date()
    };
    
    // Save to localStorage
    const storedChats = localStorage.getItem('chatHistory');
    let existingChats: ChatHistoryItem[] = [];
    
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
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('chatHistoryUpdated'));
    
    // Refresh the sidebar
    fetchChatHistory();
    
    // Navigate to new chat
    setSelectedChatId(newChatId);
    router.push(`/chat/${newChatId}`);
  };
  
  const handleChatSelect = (chatId: string) => {
    // In a real app, this would load the selected chat
    console.log(`Selected chat: ${chatId}`);
    setSelectedChatId(chatId);
    router.push(`/chat/${chatId}`);
  };

  // Function to delete a chat from history
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    
    // Get current chats from localStorage
    const storedChats = localStorage.getItem('chatHistory');
    if (!storedChats) return;
    
    try {
      // Parse the stored chats
      const existingChats = JSON.parse(storedChats);
      
      // Filter out the chat to delete
      const updatedChats = existingChats.filter((chat: any) => chat.id !== chatId);
      
      // Save the updated list back to localStorage
      localStorage.setItem('chatHistory', JSON.stringify(updatedChats));
      
      // If the deleted chat was selected, navigate to home or a new chat
      if (selectedChatId === chatId) {
        router.push('/');
      }
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('chatHistoryUpdated'));
      
      // Refresh sidebar
      fetchChatHistory();
    } catch (e) {
      console.error('Failed to delete chat:', e);
    }
  };

  // Chat item component with delete button
  const ChatItem = ({ chat }: { chat: ChatHistoryItem }) => (
    <div 
      key={chat.id}
      className={`group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer text-sm ${
        selectedChatId === chat.id ? 'bg-[var(--sidebar-hover)]' : 'hover:bg-[var(--sidebar-hover)]'
      }`}
      onClick={() => handleChatSelect(chat.id)}
    >
      <span className="truncate flex-1">{chat.title}</span>
      <button 
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2 p-1 text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)] rounded-full hover:bg-[rgba(255,255,255,0.1)]"
        onClick={(e) => handleDeleteChat(e, chat.id)}
        aria-label="Delete chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path>
          <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
        </svg>
      </button>
    </div>
  );

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`h-full bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && <span className="text-xl font-semibold text-[var(--sidebar-text)]">Q-Qwen</span>}
        <button 
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-[var(--sidebar-hover)]"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isCollapsed ? (
              // Right arrow icon when collapsed
              <path d="M9 18l6-6-6-6" />
            ) : (
              // Left arrow icon when expanded
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>
      
      {!isCollapsed && (
        <>
          <div className="px-4 py-2">
            <button 
              onClick={handleNewChat}
              className="flex items-center gap-2 bg-[var(--sidebar-hover)] hover:bg-opacity-80 rounded-lg p-3 w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>New chat</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
            {/* Yesterday section */}
            {chatHistory.yesterday.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-[var(--sidebar-muted)] px-2 py-1">Yesterday</div>
                {chatHistory.yesterday.map((chat) => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
              </div>
            )}
            
            {/* 7 Days section */}
            {chatHistory['7days'].length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-[var(--sidebar-muted)] px-2 py-1">7 Days</div>
                {chatHistory['7days'].map((chat) => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
              </div>
            )}
            
            {/* 30 Days section */}
            {chatHistory['30days'].length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-[var(--sidebar-muted)] px-2 py-1">30 Days</div>
                {chatHistory['30days'].map((chat) => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
              </div>
            )}
            
            {/* Older chats by month */}
            {Object.entries(chatHistory.older).map(([yearMonth, chats]) => (
              <div key={yearMonth} className="mb-4">
                <div className="text-xs text-[var(--sidebar-muted)] px-2 py-1">{yearMonth}</div>
                {chats.map((chat) => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
              </div>
            ))}
          </div>
        </>
      )}
      {isCollapsed && (
        <div className="flex flex-col items-center mt-2">
          <button 
            onClick={handleNewChat}
            className="p-3 rounded-lg hover:bg-[var(--sidebar-hover)]"
            aria-label="New Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 