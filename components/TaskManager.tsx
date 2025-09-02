import React, { useState } from 'react';
import { Task } from '../types';
import { CloseIcon, TaskIcon, TrashIcon, CheckIcon, PlusIcon } from './Icons';

interface TaskManagerProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (content: string, timeString: string, recurrence: Task['recurrence']) => Promise<boolean>;
  onClose: () => void;
}

const getRelativeTime = (timestamp: number) => {
    const now = new Date();
    const target = new Date(timestamp);
    const diffSeconds = Math.round((target.getTime() - now.getTime()) / 1000);
    
    const isToday = now.getDate() === target.getDate() && now.getMonth() === target.getMonth() && now.getFullYear() === target.getFullYear();
    const isTomorrow = now.getDate() + 1 === target.getDate() && now.getMonth() === target.getMonth() && now.getFullYear() === target.getFullYear();

    if (diffSeconds < -86400) return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffSeconds < 0) return "Overdue";
    if (isToday) return `Today, ${target.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (isTomorrow) return `Tomorrow, ${target.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

    const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    return target.toLocaleString('en-US', options);
};

const TaskItem: React.FC<{ task: Task, onToggle: (id: string) => void, onDelete: (id: string) => void }> = ({ task, onToggle, onDelete }) => {
    
    const getRecurrenceText = (recurrence: Task['recurrence']) => {
        if (!recurrence) return null;
        return <span className="text-xs capitalize bg-primary-t-20 text-primary px-1.5 py-0.5 rounded-full">{recurrence}</span>
    }

    return (
        <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50 group animate-pop-in">
            <button 
                onClick={() => onToggle(task.id)}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${task.completed ? 'bg-primary border-primary' : 'border-slate-500 group-hover:border-primary'}`}
                aria-label={task.completed ? 'Mark as not complete' : 'Mark as complete'}
            >
                {task.completed && <CheckIcon className="w-4 h-4 text-background"/>}
            </button>
            <div className="flex-1 min-w-0">
                <p className={`text-sm text-text-primary ${task.completed ? 'line-through text-text-muted' : ''}`}>
                    {task.content}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-text-muted">{getRelativeTime(task.nextDueDate)}</p>
                    {getRecurrenceText(task.recurrence)}
                </div>
            </div>
            <button onClick={() => onDelete(task.id)} className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <TrashIcon className="w-4 h-4"/>
            </button>
        </div>
    );
}

const AddTaskForm: React.FC<{
    onSave: (data: { content: string; timeString: string; recurrence: Task['recurrence'] }) => Promise<void>;
    onCancel: () => void;
}> = ({ onSave, onCancel }) => {
    const [content, setContent] = useState('');
    const [timeString, setTimeString] = useState('in 10 minutes');
    const [recurrence, setRecurrence] = useState<Task['recurrence']>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !timeString.trim()) {
            setError('Task and time cannot be empty.');
            return;
        }
        setIsSaving(true);
        setError('');
        await onSave({ content, timeString, recurrence });
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-2 space-y-4 animate-fade-in-fast">
            <div>
                <label htmlFor="task-content" className="block text-sm text-text-muted mb-1">Task</label>
                <textarea id="task-content" value={content} onChange={e => setContent(e.target.value)} placeholder="e.g., Follow up with the design team" rows={3} className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-sm"></textarea>
            </div>
             <div>
                <label htmlFor="task-time" className="block text-sm text-text-muted mb-1">Due Date/Time</label>
                <input id="task-time" type="text" value={timeString} onChange={e => setTimeString(e.target.value)} placeholder="e.g., tomorrow at 9am" className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-sm"/>
            </div>
            <div>
                <label htmlFor="task-recurrence" className="block text-sm text-text-muted mb-1">Recurrence</label>
                 <select id="task-recurrence" value={recurrence || 'none'} onChange={e => setRecurrence(e.target.value === 'none' ? null : e.target.value as Task['recurrence'])} className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-sm">
                     <option value="none">None</option>
                     <option value="daily">Daily</option>
                     <option value="weekdays">Weekdays</option>
                     <option value="weekends">Weekends</option>
                     <option value="weekly">Weekly</option>
                 </select>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm rounded-md bg-primary-t-80 text-background hover:bg-primary disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Task'}</button>
            </div>
        </form>
    );
};

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, onToggleTask, onDeleteTask, onAddTask, onClose }) => {
    const [view, setView] = useState<'upcoming' | 'completed'>('upcoming');
    const [isAdding, setIsAdding] = useState(false);
    
    const upcomingTasks = tasks
        .filter(t => !t.completed)
        .sort((a, b) => a.nextDueDate - b.nextDueDate);
        
    const completedTasks = tasks
        .filter(t => t.completed)
        .sort((a,b) => b.nextDueDate - a.nextDueDate);
        
    const handleSaveTask = async (data: { content: string; timeString: string; recurrence: Task['recurrence'] }) => {
        const success = await onAddTask(data.content, data.timeString, data.recurrence);
        if (success) {
            setIsAdding(false);
        } else {
            // This case would require more state in the form to show an error
            console.error("Failed to add task from UI");
        }
    };

    return (
        <div className="holographic-panel flex flex-col h-full animate-slide-in-right">
            <div className="flex justify-between items-center panel-title !mb-2">
                <div className="flex items-center gap-3">
                    <TaskIcon className="w-5 h-5" />
                    <h2 className="font-orbitron text-text-secondary !m-0 !p-0 !border-none">Task Matrix</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsAdding(p => !p)} className="p-1.5 rounded-full hover:bg-primary/20 text-primary transition-all duration-200">
                        <PlusIcon className="w-6 h-6"/>
                    </button>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-primary/20 text-text-muted hover:text-primary transition-all duration-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {isAdding ? (
                <AddTaskForm onSave={handleSaveTask} onCancel={() => setIsAdding(false)} />
            ) : (
                <>
                    <div className="flex p-1 bg-slate-800/50 rounded-lg mb-2">
                        <button onClick={() => setView('upcoming')} className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${view === 'upcoming' ? 'bg-primary text-background' : 'text-text-muted'}`}>Upcoming</button>
                        <button onClick={() => setView('completed')} className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${view === 'completed' ? 'bg-primary text-background' : 'text-text-muted'}`}>Completed</button>
                    </div>

                    <div className="flex-1 overflow-y-auto styled-scrollbar -mr-2 pr-2">
                        {view === 'upcoming' && (
                            upcomingTasks.length > 0 ? (
                                <div className="space-y-2">
                                   {upcomingTasks.map(task => (
                                       <TaskItem key={task.id} task={task} onToggle={onToggleTask} onDelete={onDeleteTask} />
                                   ))}
                                </div>
                            ) : (
                                <div className="text-center text-text-muted pt-8">
                                    <p>All tasks complete.</p>
                                    <p className="text-xs mt-2">Well done, sir.</p>
                                </div>
                            )
                        )}
                         {view === 'completed' && (
                            completedTasks.length > 0 ? (
                                <div className="space-y-2">
                                   {completedTasks.map(task => (
                                       <TaskItem key={task.id} task={task} onToggle={onToggleTask} onDelete={onDeleteTask} />
                                   ))}
                                </div>
                            ) : (
                                <div className="text-center text-text-muted pt-8">
                                    <p>No completed tasks yet.</p>
                                </div>
                            )
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TaskManager;
