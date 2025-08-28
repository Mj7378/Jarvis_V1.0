import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';

const getGreeting = (): ChatMessage => {
  const currentHour = new Date().getHours();
  let content: string;
  if (currentHour < 12) {
    content = "Good morning, sir. I am JARVIS. How may I assist you today?";
  } else if (currentHour < 18) {
    content = "Good afternoon, sir. I am JARVIS. How may I assist you today?";
  } else {
    content = "Good evening, sir. I am JARVIS. How may I assist you today?";
  }
  return {
    role: 'model',
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', '')
  };
};

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([getGreeting()]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', '')
    };
    setChatHistory(prevHistory => [...prevHistory, newMessage]);
  }, []);

  const appendToLastMessage = useCallback((contentChunk: string) => {
    setChatHistory(prev => {
        if (prev.length === 0 || prev[prev.length - 1].role !== 'model') {
            return prev;
        }
        const newHistory = [...prev];
        const lastMessage = { ...newHistory[newHistory.length - 1] };
        lastMessage.content = lastMessage.content + contentChunk;
        newHistory[newHistory.length - 1] = lastMessage;
        return newHistory;
    });
  }, []);

  const updateLastMessage = useCallback((update: Partial<Omit<ChatMessage, 'timestamp'>>) => {
    setChatHistory(prev => {
        if (prev.length === 0 || prev[prev.length - 1].role !== 'model') {
            return prev;
        }
        const newHistory = [...prev];
        const lastMessage = newHistory[newHistory.length - 1];
        const updatedMessage = { ...lastMessage, ...update };
        newHistory[newHistory.length - 1] = updatedMessage;
        return newHistory;
    });
  }, []);

  const removeLastMessage = useCallback(() => {
      setChatHistory(prev => {
          if (prev.length === 0) return prev;
          return prev.slice(0, -1);
      });
  }, []);


  return { chatHistory, addMessage, appendToLastMessage, updateLastMessage, removeLastMessage };
};