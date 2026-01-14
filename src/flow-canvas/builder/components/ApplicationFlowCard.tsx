import React from 'react';
import { Block } from '../../types/infostack';
import { cn } from '@/lib/utils';

interface ApplicationFlowCardProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateBlock: (updates: Partial<Block>) => void;
  readOnly?: boolean;
}

export const ApplicationFlowCard: React.FC<ApplicationFlowCardProps> = ({
  block,
  isSelected,
  onSelect,
  onUpdateBlock,
  readOnly = false,
}) => {
  return (
    <div
      className={cn(
        'w-full rounded-lg border bg-white dark:bg-gray-900 transition-all duration-200 cursor-pointer',
        isSelected 
          ? 'border-indigo-500 ring-1 ring-indigo-500/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      )}
      onClick={onSelect}
    >
      {/* Clean content preview - headline, subline, button */}
      <div className="text-center py-12 px-8">
        {block.elements && block.elements.length > 0 ? (
          block.elements.map((el) => {
            if (el.type === 'heading') {
              return (
                <h2 key={el.id} className="text-2xl font-bold text-gray-900 dark:text-white">
                  {el.content}
                </h2>
              );
            }
            if (el.type === 'text') {
              return (
                <p key={el.id} className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {el.content}
                </p>
              );
            }
            if (el.type === 'button') {
              return (
                <span 
                  key={el.id} 
                  className="inline-block mt-6 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  {el.content}
                </span>
              );
            }
            return null;
          })
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Apply Now</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Answer a few quick questions to get started.</p>
            <span className="inline-block mt-6 px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium text-sm">
              Start Application →
            </span>
          </>
        )}
      </div>
    </div>
  );
};
