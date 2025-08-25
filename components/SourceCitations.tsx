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
    <div className="mt-3 border-t border-cyan-400/30 pt-2">
      <h4 className="font-orbitron text-sm text-cyan-400 mb-1">Sources:</h4>
      <ol className="list-decimal list-inside space-y-1">
        {sources.map((source, index) => (
          <li key={index} className="text-xs truncate">
            <a
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:underline"
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