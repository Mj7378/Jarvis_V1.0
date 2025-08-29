import React from 'react';
import type { Source } from '../types';

interface SourceCitationsProps {
  sources: Source[];
}

const SourceCitations: React.FC<SourceCitationsProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-primary-t-20 pt-2">
      <h4 className="font-orbitron text-sm text-primary mb-1">Sources:</h4>
      <ol className="list-decimal list-inside space-y-1">
        {sources.map((source, index) => (
          <li key={index} className="text-xs truncate">
            <a
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary opacity-80 hover:underline hover:opacity-100"
              title={source.title}
            >
              {source.title || source.uri}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default SourceCitations;