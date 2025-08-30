import React from 'react';

interface SuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const Suggestions: React.FC<SuggestionsProps> = ({ suggestions, onSuggestionClick }) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="px-2 pt-1 pb-1">
      <div className="flex gap-2 overflow-x-auto styled-scrollbar pb-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="flex-shrink-0 px-4 py-2 text-sm text-text-secondary bg-[rgba(var(--primary-color-rgb),0.05)] backdrop-blur-md border border-primary-t-20 rounded-full hover:bg-primary-t-20 hover:text-text-primary transition-all duration-200 animate-pop-in"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Suggestions;