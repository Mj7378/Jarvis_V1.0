
import React from 'react';
import SystemStatus from './SystemStatus';

const LeftColumn: React.FC = () => {
    return (
        <div className="flex flex-col space-y-4">
           <SystemStatus />
           {/* Add other left column components here if needed */}
        </div>
    );
};

export default LeftColumn;
