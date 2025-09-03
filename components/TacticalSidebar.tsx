import React from 'react';
import { CameraIcon, SettingsIcon, DashboardIcon, GenerateImageIcon, AppLauncherIcon, TaskIcon, DriveIcon, HomeIcon, ChatIcon } from './Icons';
import type { PanelType } from '../types';

interface TacticalSidebarProps {
    onTogglePanel: (panel: PanelType) => void;
    activePanels: Set<PanelType>;
    onToggleView: (view: 'DASHBOARD' | 'CHAT_FOCUS') => void;
    currentView: 'DASHBOARD' | 'CHAT_FOCUS';
}

const DockButton: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; isActive: boolean; }> = 
({ label, icon, onClick, isActive }) => (
    <div className="relative group">
        <button 
            onClick={onClick} 
            className={`dock-button rounded-full flex items-center justify-center border-2 transition-all duration-300 transform hover:scale-110 active:scale-100 ${
                isActive 
                ? 'bg-primary text-background border-primary shadow-[0_0_15px_rgba(var(--primary-color-rgb),0.7)]' 
                : 'bg-panel text-primary-t-80 border-primary-t-20 hover:border-primary hover:text-primary'
            }`}
            aria-label={label}
            aria-pressed={isActive}
        >
            {icon}
        </button>
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-max px-3 py-1.5 bg-panel border border-primary-t-20 rounded-md text-sm text-text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none animate-fade-in-fast" style={{ animationDelay: '300ms' }}>
            {label}
        </div>
    </div>
);

const TacticalSidebar: React.FC<TacticalSidebarProps> = ({ onTogglePanel, activePanels, onToggleView, currentView }) => {
    
    const mainActions = [
        { label: "Dashboard", view: 'DASHBOARD', icon: <HomeIcon className="w-7 h-7"/> },
        { label: "Chat Focus", view: 'CHAT_FOCUS', icon: <ChatIcon className="w-7 h-7"/> },
    ];

    const panelActions: { label: string; panel: PanelType; icon: React.ReactNode }[] = [
        { label: "Control Center", panel: 'CONTROL_CENTER', icon: <DashboardIcon className="w-7 h-7"/> },
        { label: "App Launcher", panel: 'APP_LAUNCHER', icon: <AppLauncherIcon className="w-7 h-7"/> },
        { label: "Task Manager", panel: 'TASK_MANAGER', icon: <TaskIcon className="w-7 h-7"/> },
        { label: "Cloud Storage", panel: 'STORAGE_WIZARD', icon: <DriveIcon className="w-7 h-7"/> },
        { label: "Vision Mode", panel: 'VISION', icon: <CameraIcon className="w-7 h-7" /> },
        { label: "Generative Studio", panel: 'GENERATIVE_STUDIO', icon: <GenerateImageIcon className="w-7 h-7" /> },
    ];
    
    const systemActions: { label: string; panel: PanelType; icon: React.ReactNode }[] = [
        { label: "Settings", panel: 'SETTINGS', icon: <SettingsIcon className="w-7 h-7" /> },
    ];

    return (
        <aside className="hud-sidebar-dock flex flex-col items-center justify-between py-4">
             <div className="flex flex-col items-center gap-4">
                {mainActions.map(action => (
                    <DockButton 
                        key={action.view}
                        label={action.label}
                        icon={action.icon}
                        onClick={() => onToggleView(action.view as 'DASHBOARD' | 'CHAT_FOCUS')}
                        isActive={currentView === action.view}
                    />
                ))}
                 <div className="w-8 h-px bg-primary-t-20 my-2"></div>
                {panelActions.map(action => (
                    <DockButton 
                        key={action.panel}
                        label={action.label}
                        icon={action.icon}
                        onClick={() => onTogglePanel(action.panel)}
                        isActive={activePanels.has(action.panel)}
                    />
                ))}
            </div>
             <div className="flex flex-col items-center gap-4">
                {systemActions.map(action => (
                     <DockButton 
                        key={action.panel}
                        label={action.label}
                        icon={action.icon}
                        onClick={() => onTogglePanel(action.panel)}
                        isActive={activePanels.has(action.panel)}
                    />
                ))}
            </div>
        </aside>
    );
};

export default TacticalSidebar;