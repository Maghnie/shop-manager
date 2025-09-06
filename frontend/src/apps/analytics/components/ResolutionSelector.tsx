import React from 'react';
import { RESOLUTION_OPTIONS } from '../constants';

interface ResolutionSelectorProps {
  value: string;
  onChange: (resolution: string) => void;
  className?: string;
}

export const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex space-x-2 space-x-reverse ${className}`}>
      {RESOLUTION_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 space-x-reverse ${
            value === option.value
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};