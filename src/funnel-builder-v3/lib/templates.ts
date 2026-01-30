import { Funnel, Block } from '../types/funnel';

const createBlock = (type: Block['type'], content: any, styles: Partial<Block['styles']> = {}): Block => ({
  id: crypto.randomUUID(),
  type,
  content,
  styles: {
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    borderRadius: 0,
    shadow: 'none',
    animation: 'none',
    ...styles,
  },
});

// Create an empty funnel with one step
export function createEmptyFunnel(): Funnel {
  const stepId = crypto.randomUUID();
  return {
    id: crypto.randomUUID(),
    name: 'My Funnel',
    description: '',
    steps: [
      {
        id: stepId,
        name: 'Welcome',
        type: 'capture',
        slug: 'welcome',
        blocks: [
          createBlock('spacer', { height: 40 }, { padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
          createBlock('heading', {
            text: 'Welcome to Your Funnel',
            level: 1,
            styles: { fontSize: 32, fontWeight: 700, textAlign: 'center' },
          }, { padding: { top: 24, right: 20, bottom: 8, left: 20 } }),
          createBlock('text', {
            text: 'Start building your funnel by adding blocks from the left panel.',
            styles: { fontSize: 16, fontWeight: 400, textAlign: 'center', lineHeight: 1.6 },
          }, { padding: { top: 8, right: 24, bottom: 24, left: 24 } }),
          createBlock('button', {
            text: 'Get Started',
            variant: 'primary',
            size: 'lg',
            action: 'next-step',
            fullWidth: true,
            backgroundColor: '#6366f1',
            color: '#ffffff',
          }, { padding: { top: 16, right: 24, bottom: 16, left: 24 } }),
        ],
        settings: {},
      },
    ],
    settings: {
      primaryColor: '#6366f1',
      fontFamily: 'Inter',
      showStepIndicator: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Simple lead capture template
export const leadCaptureFunnel: Funnel = {
  id: crypto.randomUUID(),
  name: 'Lead Capture',
  description: 'Simple email capture funnel',
  steps: [
    {
      id: crypto.randomUUID(),
      name: 'Capture',
      type: 'capture',
      slug: 'capture',
      blocks: [
        createBlock('spacer', { height: 40 }, { padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
        createBlock('heading', {
          text: 'Get Your Free Guide',
          level: 1,
          styles: { fontSize: 36, fontWeight: 800, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'Enter your email below to download our exclusive guide.',
          styles: { fontSize: 18, textAlign: 'center', lineHeight: 1.6 },
        }),
        createBlock('email-capture', {
          placeholder: 'Enter your email',
          buttonText: 'Download Now',
          subtitle: 'Join 5,000+ subscribers',
        }),
      ],
      settings: {},
    },
    {
      id: crypto.randomUUID(),
      name: 'Thank You',
      type: 'result',
      slug: 'thank-you',
      blocks: [
        createBlock('spacer', { height: 60 }),
        createBlock('graphic', { type: 'emoji', value: '🎉', size: 64 }),
        createBlock('heading', {
          text: 'Check Your Inbox!',
          level: 1,
          styles: { fontSize: 32, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'We\'ve sent your guide to your email. Check your inbox (and spam folder).',
          styles: { fontSize: 16, textAlign: 'center', lineHeight: 1.6 },
        }),
      ],
      settings: {},
    },
  ],
  settings: {
    primaryColor: '#6366f1',
    fontFamily: 'Inter',
    showStepIndicator: true,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Quiz funnel template
export const quizFunnel: Funnel = {
  id: crypto.randomUUID(),
  name: 'Quiz Funnel',
  description: 'Multi-step quiz to qualify leads',
  steps: [
    {
      id: crypto.randomUUID(),
      name: 'Question 1',
      type: 'capture',
      slug: 'question-1',
      blocks: [
        createBlock('spacer', { height: 40 }),
        createBlock('heading', {
          text: 'Quick Quiz',
          level: 1,
          styles: { fontSize: 28, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('quiz', {
          question: 'What best describes you?',
          options: [
            { id: '1', text: 'Just getting started' },
            { id: '2', text: 'Some experience' },
            { id: '3', text: 'Advanced' },
          ],
          multiSelect: false,
        }),
        createBlock('button', {
          text: 'Continue →',
          variant: 'primary',
          size: 'lg',
          action: 'next-step',
          fullWidth: true,
        }),
      ],
      settings: {},
    },
    {
      id: crypto.randomUUID(),
      name: 'Question 2',
      type: 'capture',
      slug: 'question-2',
      blocks: [
        createBlock('spacer', { height: 40 }),
        createBlock('quiz', {
          question: 'What\'s your biggest challenge?',
          options: [
            { id: '1', text: 'Finding clients' },
            { id: '2', text: 'Time management' },
            { id: '3', text: 'Scaling my business' },
          ],
          multiSelect: false,
        }),
        createBlock('button', {
          text: 'See My Results →',
          variant: 'primary',
          size: 'lg',
          action: 'next-step',
          fullWidth: true,
        }),
      ],
      settings: {},
    },
    {
      id: crypto.randomUUID(),
      name: 'Results',
      type: 'result',
      slug: 'results',
      blocks: [
        createBlock('spacer', { height: 40 }),
        createBlock('heading', {
          text: 'Your Results Are Ready!',
          level: 1,
          styles: { fontSize: 32, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'Based on your answers, we\'ve prepared a personalized recommendation for you.',
          styles: { fontSize: 16, textAlign: 'center', lineHeight: 1.6 },
        }),
        createBlock('email-capture', {
          placeholder: 'Enter your email',
          buttonText: 'Get My Results',
          subtitle: 'We\'ll send your personalized plan',
        }),
      ],
      settings: {},
    },
  ],
  settings: {
    primaryColor: '#6366f1',
    fontFamily: 'Inter',
    showStepIndicator: true,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Export all templates
export const funnelTemplates = {
  empty: createEmptyFunnel,
  leadCapture: leadCaptureFunnel,
  quiz: quizFunnel,
};
