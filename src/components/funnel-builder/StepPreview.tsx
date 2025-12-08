import { FunnelStep, FunnelSettings } from '@/pages/FunnelEditor';
import { cn } from '@/lib/utils';

interface StepPreviewProps {
  step: FunnelStep;
  settings: FunnelSettings;
  selectedElement: string | null;
  onSelectElement: (element: string | null) => void;
}

export function StepPreview({ step, settings, selectedElement, onSelectElement }: StepPreviewProps) {
  const content = step.content;

  const getEditableClass = (elementId: string) => cn(
    "cursor-pointer transition-all relative",
    selectedElement === elementId 
      ? "ring-2 ring-primary ring-offset-2 ring-offset-transparent rounded" 
      : "hover:ring-2 hover:ring-primary/40 hover:ring-offset-2 hover:ring-offset-transparent rounded"
  );

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {content.headline && (
        <h1 
          className={cn("text-2xl font-bold text-white mb-4 leading-tight", getEditableClass('headline'))}
          onClick={(e) => { e.stopPropagation(); onSelectElement('headline'); }}
        >
          {content.headline}
        </h1>
      )}

      {content.subtext && (
        <p 
          className={cn("text-sm text-white/70 mb-6", getEditableClass('subtext'))}
          onClick={(e) => { e.stopPropagation(); onSelectElement('subtext'); }}
        >
          {content.subtext}
        </p>
      )}

      <button
        className={cn(
          "px-6 py-3 text-sm font-semibold rounded-lg text-white transition-all",
          getEditableClass('button_text')
        )}
        style={{ backgroundColor: settings.primary_color }}
        onClick={(e) => { e.stopPropagation(); onSelectElement('button_text'); }}
      >
        {content.button_text || settings.button_text || 'Get Started'}
      </button>

      <p className="mt-3 text-white/40 text-xs">Press Enter ↵</p>
    </div>
  );

  const renderTextQuestion = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {content.headline && (
        <h1 
          className={cn("text-xl font-bold text-white mb-6 leading-tight", getEditableClass('headline'))}
          onClick={(e) => { e.stopPropagation(); onSelectElement('headline'); }}
        >
          {content.headline}
        </h1>
      )}

      <div 
        className={cn("w-full max-w-xs", getEditableClass('placeholder'))}
        onClick={(e) => { e.stopPropagation(); onSelectElement('placeholder'); }}
      >
        <input
          type="text"
          placeholder={content.placeholder || 'Type here...'}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 text-center"
          readOnly
        />
      </div>

      <p className="mt-3 text-white/40 text-xs">Press Enter ↵</p>
    </div>
  );

  const renderMultiChoice = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {content.headline && (
        <h1 
          className={cn("text-xl font-bold text-white mb-6 leading-tight", getEditableClass('headline'))}
          onClick={(e) => { e.stopPropagation(); onSelectElement('headline'); }}
        >
          {content.headline}
        </h1>
      )}

      <div 
        className={cn("w-full max-w-xs space-y-2", getEditableClass('options'))}
        onClick={(e) => { e.stopPropagation(); onSelectElement('options'); }}
      >
        {(content.options || []).map((option, index) => (
          <button
            key={index}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white hover:bg-white/20 transition-colors text-sm"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  const renderEmailCapture = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {content.headline && (
        <h1 
          className={cn("text-xl font-bold text-white mb-4 leading-tight", getEditableClass('headline'))}
          onClick={(e) => { e.stopPropagation(); onSelectElement('headline'); }}
        >
          {content.headline}
        </h1>
      )}

      {content.subtext && (
        <p 
          className={cn("text-sm text-white/70 mb-6", getEditableClass('subtext'))}
          onClick={(e) => { e.stopPropagation(); onSelectElement('subtext'); }}
        >
          {content.subtext}
        </p>
      )}

      <div 
        className={cn("w-full max-w-xs", getEditableClass('placeholder'))}
        onClick={(e) => { e.stopPropagation(); onSelectElement('placeholder'); }}
      >
        <input
          type="email"
          placeholder={content.placeholder || 'email@example.com'}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 text-center"
          readOnly
        />
      </div>

      <p className="mt-3 text-white/40 text-xs">Press Enter ↵</p>
    </div>
  );

  const renderPhoneCapture = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {content.headline && (
        <h1 
          className={cn("text-xl font-bold text-white mb-4 leading-tight", getEditableClass('headline'))}
          onClick={(e) => { e.stopPropagation(); onSelectElement('headline'); }}
        >
          {content.headline}
        </h1>
      )}

      {content.subtext && (
        <p 
          className={cn("text-sm text-white/70 mb-6", getEditableClass('subtext'))}
          onClick={(e) => { e.stopPropagation(); onSelectElement('subtext'); }}
        >
          {content.subtext}
        </p>
      )}

      <div 
        className={cn("w-full max-w-xs", getEditableClass('placeholder'))}
        onClick={(e) => { e.stopPropagation(); onSelectElement('placeholder'); }}
      >
        <input
          type="tel"
          placeholder={content.placeholder || '(555) 123-4567'}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 text-center"
          readOnly
        />
      </div>

      <p className="mt-3 text-white/40 text-xs">Press Enter ↵</p>
    </div>
  );

  const renderVideo = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {content.headline && (
        <h1 
          className={cn("text-xl font-bold text-white mb-4 leading-tight", getEditableClass('headline'))}
          onClick={(e) => { e.stopPropagation(); onSelectElement('headline'); }}
        >
          {content.headline}
        </h1>
      )}

      <div 
        className={cn("w-full aspect-video bg-white/10 rounded-lg flex items-center justify-center mb-4", getEditableClass('video_url'))}
        onClick={(e) => { e.stopPropagation(); onSelectElement('video_url'); }}
      >
        {content.video_url ? (
          <span className="text-white/50 text-xs">Video Preview</span>
        ) : (
          <span className="text-white/50 text-xs">No video URL</span>
        )}
      </div>

      <button
        className={cn(
          "px-6 py-3 text-sm font-semibold rounded-lg text-white",
          getEditableClass('button_text')
        )}
        style={{ backgroundColor: settings.primary_color }}
        onClick={(e) => { e.stopPropagation(); onSelectElement('button_text'); }}
      >
        {content.button_text || 'Continue'}
      </button>
    </div>
  );

  const renderThankYou = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {content.headline && (
        <h1 
          className={cn("text-2xl font-bold text-white mb-4 leading-tight", getEditableClass('headline'))}
          onClick={(e) => { e.stopPropagation(); onSelectElement('headline'); }}
        >
          {content.headline}
        </h1>
      )}

      {content.subtext && (
        <p 
          className={cn("text-sm text-white/70", getEditableClass('subtext'))}
          onClick={(e) => { e.stopPropagation(); onSelectElement('subtext'); }}
        >
          {content.subtext}
        </p>
      )}
    </div>
  );

  const renderStep = () => {
    switch (step.step_type) {
      case 'welcome':
        return renderWelcome();
      case 'text_question':
        return renderTextQuestion();
      case 'multi_choice':
        return renderMultiChoice();
      case 'email_capture':
        return renderEmailCapture();
      case 'phone_capture':
        return renderPhoneCapture();
      case 'video':
        return renderVideo();
      case 'thank_you':
        return renderThankYou();
      default:
        return <div className="text-white/50 text-center">Unknown step type</div>;
    }
  };

  return (
    <div 
      className="w-full h-full" 
      onClick={() => onSelectElement(null)}
    >
      {/* Logo */}
      {settings.logo_url && (
        <div className="absolute top-14 left-4 z-10">
          <img
            src={settings.logo_url}
            alt="Logo"
            className="h-5 w-auto object-contain"
          />
        </div>
      )}

      {renderStep()}
    </div>
  );
}
