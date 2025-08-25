import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';

const getGreeting = (): string => {
  const currentHour = new Date().getHours();
  if (currentHour < 12) {
    return "Good morning, sir. I am JARVIS. How may I assist you today?";
  } else if (currentHour < 18) {
    return "Good afternoon, sir. I am JARVIS. How may I assist you today?";
  } else {
    return "Good evening, sir. I am JARVIS. How may I assist you today?";
  }
};

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    return [
      { role: 'model', content: getGreeting() }
    ];
  });

  const addMessage = useCallback((message: ChatMessage) => {
    setChatHistory(prevHistory => [...prevHistory, message]);
  }, []);

  const appendToLastMessage = useCallback((contentChunk: string) => {
    setChatHistory(prev => {
        if (prev.length === 0 || prev[prev.length - 1].role !== 'model') {
            return prev;
        }
        const newHistory = [...prev];
        const lastMessage = newHistory[newHistory.length - 1];
        const updatedMessage = { ...lastMessage, content: lastMessage.content + contentChunk };
        newHistory[newHistory.length - 1] = updatedMessage;
        return newHistory;
    });
  }, []);

  const updateLastMessage = useCallback((update: Partial<ChatMessage>) => {
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
