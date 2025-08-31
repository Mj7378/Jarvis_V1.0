
import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage, Reminder } from '../types';
import { parseTimeString } from '../utils/db';

const CHAT_HISTORY_STORAGE_KEY = 'jarvis_chat_history';

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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load chat history from local storage", e);
    }
    return [getGreeting()];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (e) {
      console.error("Failed to save chat history to local storage", e);
    }
  }, [chatHistory]);

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

  const clearChatHistory = useCallback(() => {
    setChatHistory([getGreeting()]);
  }, []);


  return { chatHistory, addMessage, appendToLastMessage, updateLastMessage, removeLastMessage, clearChatHistory };
};

const REMINDERS_STORAGE_KEY = 'jarvis_reminders';

export const useReminders = (onReminderDue: (reminder: Reminder) => void) => {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem(REMINDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load reminders from local storage", e);
      return [];
    }
  });

  // Save reminders to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    } catch (e) {
      console.error("Failed to save reminders to local storage", e);
    }
  }, [reminders]);

  // Check for due reminders every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      setReminders(prev => {
        const stillActive: Reminder[] = [];
        prev.forEach(r => {
          if (r.dueTime <= now) {
            // Trigger both in-app and native notifications
            onReminderDue(r); 
            if (Notification.permission === 'granted') {
              new Notification('J.A.R.V.I.S. Reminder', {
                body: r.content,
                // Assuming a favicon exists at the root
                icon: '/favicon.ico'
              });
            }
          } else {
            stillActive.push(r);
          }
        });
        return stillActive;
      });

    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [onReminderDue]);

  const addReminder = useCallback(async (content: string, timeString: string): Promise<boolean> => {
    const dueTime = parseTimeString(timeString);
    if (!dueTime) {
      console.error(`Could not parse time string: "${timeString}"`);
      return false;
    }

    // Request notification permission if needed
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    
    const newReminder: Reminder = {
      id: `rem_${Date.now()}`,
      content,
      dueTime,
    };
    setReminders(prev => [...prev, newReminder]);
    return true;
  }, []);

  return { addReminder };
};
