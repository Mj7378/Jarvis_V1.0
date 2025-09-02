

import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage, Task } from '../types';
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

const TASKS_STORAGE_KEY = 'jarvis_tasks';

export const useTasks = (onTaskDue: (task: Task) => void) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load tasks from local storage", e);
      return [];
    }
  });

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save tasks to local storage", e);
    }
  }, [tasks]);

  // Check for due tasks and reset recurring tasks
  useEffect(() => {
    const notifiedThisSession = new Set<string>();
    
    const interval = setInterval(() => {
      const now = Date.now();
      
      setTasks(prevTasks => {
        const updatedTasks = [...prevTasks];
        let wasChanged = false;

        updatedTasks.forEach((task, index) => {
            // Reset completed recurring tasks for their next cycle
            if (task.recurrence && task.completed) {
                const nextCycleStart = new Date(task.nextDueDate);
                if (now >= nextCycleStart.getTime()) {
                    // Find the next *future* due date
                    while(nextCycleStart.getTime() <= now) {
                        switch (task.recurrence) {
                            case 'daily': nextCycleStart.setDate(nextCycleStart.getDate() + 1); break;
                            case 'weekly': nextCycleStart.setDate(nextCycleStart.getDate() + 7); break;
                            case 'weekdays':
                                do { nextCycleStart.setDate(nextCycleStart.getDate() + 1); } while (nextCycleStart.getDay() === 0 || nextCycleStart.getDay() === 6);
                                break;
                            case 'weekends':
                                do { nextCycleStart.setDate(nextCycleStart.getDate() + 1); } while (nextCycleStart.getDay() > 0 && nextCycleStart.getDay() < 6);
                                break;
                        }
                    }
                    updatedTasks[index] = { ...task, completed: false, nextDueDate: nextCycleStart.getTime() };
                    wasChanged = true;
                }
            }
        });

        // Notify for newly due tasks
        updatedTasks.forEach(task => {
          if (!task.completed && task.nextDueDate <= now && !notifiedThisSession.has(task.id)) {
              onTaskDue(task);
              if (Notification.permission === 'granted') {
                new Notification('J.A.R.V.I.S. Reminder', {
                  body: task.content,
                  icon: '/favicon.ico'
                });
              }
              notifiedThisSession.add(task.id);
          }
        });
        
        return wasChanged ? updatedTasks : prevTasks;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [onTaskDue]);

  const addTask = useCallback(async (
    content: string,
    timeString: string,
    recurrence: Task['recurrence'] = null
  ): Promise<boolean> => {
    const dueDate = parseTimeString(timeString);
    if (!dueDate) {
      console.error(`Could not parse time string: "${timeString}"`);
      return false;
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    
    const newTask: Task = {
      id: `task_${Date.now()}`,
      content,
      initialDueDate: dueDate,
      nextDueDate: dueDate,
      recurrence,
      completed: false,
    };
    setTasks(prev => [...prev, newTask].sort((a,b) => a.nextDueDate - b.nextDueDate));
    return true;
  }, []);
  
  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);
  
  const toggleTask = useCallback((taskId: string) => {
      setTasks(prev => prev.map(task => {
          if (task.id === taskId) {
              return { ...task, completed: !task.completed };
          }
          return task;
      }));
  }, []);

  return { tasks, addTask, deleteTask, toggleTask };
};
