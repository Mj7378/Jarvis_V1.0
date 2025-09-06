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
    </div>
);

const TacticalSidebar: React.FC<TacticalSidebarProps> = ({ onTogglePanel, activePanels, onToggleView, currentView }) => {
    
    const isDashboard = currentView === 'DASHBOARD';

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

    const controlCenterAction = panelActions.find(action => action.panel === 'CONTROL_CENTER');
    const otherPanelActions = panelActions.filter(action => action.panel !== 'CONTROL_CENTER');

    return (
        <aside className="hud-sidebar-dock flex flex-col items-center justify-between py-4">
             <div className="flex flex-col items-center gap-4">
                <DockButton 
                    label={isDashboard ? "Focus Chat" : "Dashboard"}
                    icon={isDashboard ? <ChatIcon className="w-7 h-7" /> : <HomeIcon className="w-7 h-7" />}
                    onClick={() => onToggleView(isDashboard ? 'CHAT_FOCUS' : 'DASHBOARD')}
                    isActive={true}
                />
                 {controlCenterAction && (
                    <DockButton 
                        key={controlCenterAction.panel}
                        label={controlCenterAction.label}
                        icon={controlCenterAction.icon}
                        onClick={() => onTogglePanel(controlCenterAction.panel)}
                        isActive={activePanels.has(controlCenterAction.panel)}
                    />
                )}
                 <div className="w-8 h-px bg-primary-t-20 my-2"></div>
                {otherPanelActions.map(action => (
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