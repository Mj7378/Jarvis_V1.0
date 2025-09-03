import React from 'react';
import type { Task, ChatMessage, AppState } from '../types';
import ChatLog from './ChatLog';
import UserInput from './UserInput';
import Suggestions from './Suggestions';
import { CheckIcon, TaskIcon } from './Icons';

// --- DASHBOARD MODULES ---

const ChatModule: React.FC<{
    history: ChatMessage[];
    appState: AppState;
    suggestions: string[];
    onSendMessage: (prompt: string) => void;
    userInputProps: Omit<React.ComponentProps<typeof UserInput>, 'onSendMessage'>;
}> = ({ history, appState, suggestions, onSendMessage, userInputProps }) => (
    <div className="holographic-panel chat-module flex flex-col min-h-0">
        <ChatLog history={history} appState={appState} />
        <div className="mt-auto pt-2">
            <Suggestions suggestions={suggestions} onSuggestionClick={onSendMessage} />
            <UserInput onSendMessage={onSendMessage} {...userInputProps} />
        </div>
    </div>
);

const TasksModule: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const upcomingTasks = tasks.filter(t => !t.completed).sort((a,b) => a.nextDueDate - b.nextDueDate).slice(0, 5);

    return (
        <div className="holographic-panel tasks-module flex flex-col">
            <h2 className="panel-title">Task Matrix</h2>
            {upcomingTasks.length > 0 ? (
                <div className="space-y-2 overflow-y-auto styled-scrollbar pr-1">
                    {upcomingTasks.map(task => (
                        <div key={task.id} className="p-2 bg-slate-800/50 rounded-md text-sm">
                            <p className="text-text-primary">{task.content}</p>
                            <p className="text-xs text-text-muted">{new Date(task.nextDueDate).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-center">
                    <TaskIcon className="w-12 h-12 text-primary-t-50" />
                    <p className="mt-2 font-semibold">All tasks complete.</p>
                    <p className="text-xs">Well done, sir.</p>
                </div>
            )}
        </div>
    );
};

const SystemStatusModule: React.FC<{ os: string }> = ({ os }) => (
    <div className="holographic-panel status-module">
        <h2 className="panel-title">System Status</h2>
        <div className="space-y-2 text-sm">
            <p><strong>AI Core:</strong> <span className="text-green-400">Online</span></p>
            <p><strong>Network:</strong> <span className="text-green-400">Secure</span></p>
            <p><strong>Platform:</strong> <span className="text-primary">{os}</span></p>
        </div>
    </div>
);

const QuickActionsModule: React.FC = () => (
    <div className="holographic-panel actions-module">
        <h2 className="panel-title">Proactive Alerts</h2>
        <div className="flex-1 flex items-center justify-center text-text-muted text-center">
            <p>No system alerts at this time.</p>
        </div>
    </div>
);


// --- MAIN DASHBOARD COMPONENT ---

interface SentinelDashboardProps {
    tasks: Task[];
    operatingSystem: string;
    chatHistory: ChatMessage[];
    appState: AppState;
    suggestions: string[];
    onSendMessage: (prompt: string) => void;
    userInputProps: Omit<React.ComponentProps<typeof UserInput>, 'onSendMessage'>;
}

const SentinelDashboard: React.FC<SentinelDashboardProps> = (props) => {
    return (
        <div className="dashboard-grid h-full">
            <ChatModule 
                history={props.chatHistory} 
                appState={props.appState} 
                suggestions={props.suggestions}
                onSendMessage={props.onSendMessage}
                userInputProps={props.userInputProps}
            />
            <TasksModule tasks={props.tasks} />
            <SystemStatusModule os={props.operatingSystem} />
            <QuickActionsModule />
        </div>
    );
};

export default SentinelDashboard;