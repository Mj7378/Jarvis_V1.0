
import React from 'react';
import { CameraIcon, SettingsIcon, DashboardIcon, GenerateImageIcon, GenerateVideoIcon, AppLauncherIcon } from './Icons';

export type PanelType = 'CONTROL_CENTER' | 'VISION' | 'REAL_TIME_VISION' | 'DESIGN' | 'SIMULATION' | 'SETTINGS' | 'APP_LAUNCHER';


interface LeftSidebarDockProps {
    onTogglePanel: (panel: PanelType) => void;
    activePanels: Set<PanelType>;
}

const DockButton: React.FC<{ label: string; panel: PanelType; icon: React.ReactNode; onTogglePanel: (panel: PanelType) => void; isActive: boolean; }> = 
({ label, panel, icon, onTogglePanel, isActive }) => (
    <div className="relative group">
        <button 
            onClick={() => onTogglePanel(panel)} 
            className={`dock-button rounded-full flex items-center justify-center border-2 transition-all duration-300 transform hover:scale-110 active:scale-100 ${
                isActive 
                ? 'bg-primary text-background border-primary shadow-[0_0_15px_rgba(var(--primary-color-rgb),0.7)]' 
                : 'bg-panel text-primary-t-80 border-primary-t-20 hover:border-primary hover:text-primary'
            }`}
            aria-label={`Toggle ${label}`}
            aria-pressed={isActive}
        >
            {icon}
        </button>
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-max px-3 py-1.5 bg-panel border border-primary-t-20 rounded-md text-sm text-text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none animate-fade-in-fast" style={{ animationDelay: '300ms' }}>
            {label}
        </div>
    </div>
);

const TacticalSidebar: React.FC<LeftSidebarDockProps> = ({ onTogglePanel, activePanels }) => {
    
    const actions: { label: string; panel: PanelType; icon: React.ReactNode }[] = [
        { label: "Control Center", panel: 'CONTROL_CENTER', icon: <DashboardIcon className="w-7 h-7"/> },
        { label: "App Launcher", panel: 'APP_LAUNCHER', icon: <AppLauncherIcon className="w-7 h-7"/> },
        { label: "Vision Mode", panel: 'VISION', icon: <CameraIcon className="w-7 h-7" /> },
        { label: "Image Studio", panel: 'DESIGN', icon: <GenerateImageIcon className="w-7 h-7" /> },
        { label: "Simulation Mode", panel: 'SIMULATION', icon: <GenerateVideoIcon className="w-7 h-7" /> },
    ];
    
    const systemActions: { label: string; panel: PanelType; icon: React.ReactNode }[] = [
        { label: "Settings", panel: 'SETTINGS', icon: <SettingsIcon className="w-7 h-7" /> },
    ];

    return (
        <aside className="hud-sidebar-dock flex flex-col items-center justify-between py-4">
             <div className="flex flex-col items-center gap-4">
                {actions.map(action => (
                    <DockButton 
                        key={action.panel}
                        {...action} 
                        onTogglePanel={onTogglePanel}
                        isActive={activePanels.has(action.panel)}
                    />
                ))}
            </div>
             <div className="flex flex-col items-center gap-4">
                {systemActions.map(action => (
                     <DockButton 
                        key={action.panel}
                        {...action} 
                        onTogglePanel={onTogglePanel}
                        isActive={activePanels.has(action.panel)}
                    />
                ))}
            </div>
        </aside>
    );
};

export default TacticalSidebar;
