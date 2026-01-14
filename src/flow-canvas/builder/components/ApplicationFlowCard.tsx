import React, { useState } from 'react';
import { Block, ApplicationFlowSettings, ApplicationStepType } from '../../types/infostack';
import { cn } from '@/lib/utils';
import { 
  Workflow, 
  Sparkles, 
  HelpCircle, 
  UserPlus, 
  Calendar, 
  CheckCircle2,
  Edit3,
  ChevronRight
} from 'lucide-react';
import { ApplicationFlowEditorModal } from './ApplicationFlowEditorModal';

const stepTypeIcons: Record<ApplicationStepType, React.ReactNode> = {
  welcome: <Sparkles className="w-3 h-3" />,
  question: <HelpCircle className="w-3 h-3" />,
  capture: <UserPlus className="w-3 h-3" />,
  booking: <Calendar className="w-3 h-3" />,
  ending: <CheckCircle2 className="w-3 h-3" />,
};

const stepTypeLabels: Record<ApplicationStepType, string> = {
  welcome: 'Welcome',
  question: 'Question',
  capture: 'Capture',
  booking: 'Booking',
  ending: 'Thank You',
};

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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const settings = block.props as unknown as ApplicationFlowSettings | undefined;
  const steps = settings?.steps || [];
  const flowName = block.label || 'Application Flow';

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditorOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          'w-full rounded-xl border-2 transition-all duration-200 cursor-pointer',
          'bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/30 dark:to-purple-950/30',
          isSelected 
            ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' 
            : 'border-indigo-200/60 dark:border-indigo-800/40 hover:border-indigo-300 dark:hover:border-indigo-700'
        )}
        onClick={onSelect}
      >
        {/* Header */}
        <div className="p-4 border-b border-indigo-200/40 dark:border-indigo-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {flowName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {steps.length} {steps.length === 1 ? 'step' : 'steps'} · Typeform-style
              </div>
            </div>
          </div>
        </div>

        {/* Visual Preview Section - Shows the headline, subtext, and start button */}
        <div className="p-4">
          {block.elements && block.elements.length > 0 ? (
            <div className="text-center space-y-3 py-6 bg-white/60 dark:bg-gray-800/60 rounded-lg mb-4">
              {block.elements.map((el) => {
                if (el.type === 'heading') {
                  return (
                    <h2 key={el.id} className="text-xl font-bold text-gray-900 dark:text-white">
                      {el.content}
                    </h2>
                  );
                }
                if (el.type === 'text') {
                  return (
                    <p key={el.id} className="text-sm text-gray-600 dark:text-gray-400">
                      {el.content}
                    </p>
                  );
                }
                if (el.type === 'button') {
                  return (
                    <span 
                      key={el.id} 
                      className="inline-block px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium shadow-md"
                    >
                      {el.content}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          ) : null}

          {/* Steps Preview - Compact badges */}
          {steps.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {steps.slice(0, 6).map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
                    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                    'text-gray-700 dark:text-gray-300'
                  )}
                >
                  <span className="text-indigo-500">
                    {stepTypeIcons[step.type]}
                  </span>
                  <span className="truncate max-w-[80px]">{step.name}</span>
                  {index < steps.length - 1 && index < 5 && (
                    <ChevronRight className="w-3 h-3 text-gray-400 -mr-1" />
                  )}
                </div>
              ))}
              {steps.length > 6 && (
                <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  +{steps.length - 6} more
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
              No steps yet. Click Edit to add steps.
            </div>
          )}

          {/* Edit Button */}
          {!readOnly && (
            <button
              onClick={handleEditClick}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg',
                'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600',
                'text-white font-medium text-sm transition-all duration-200',
                'shadow-md hover:shadow-lg hover:shadow-indigo-500/25'
              )}
            >
              <Edit3 className="w-4 h-4" />
              Edit Application
            </button>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-indigo-200/40 dark:border-indigo-800/30 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-b-xl">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
            Submit can go to any step — even a different page
          </p>
        </div>
      </div>

      {/* Full-screen Editor Modal */}
      <ApplicationFlowEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        block={block}
        onUpdateBlock={onUpdateBlock}
      />
    </>
  );
};
