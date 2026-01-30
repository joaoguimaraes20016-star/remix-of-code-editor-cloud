import { Funnel, Block, FunnelStep } from '@/funnel-builder-v3/types/funnel';
import { v4 as uuid } from 'uuid';

const createBlock = (type: Block['type'], content: any, styles: Partial<Block['styles']> = {}): Block => ({
  id: uuid(),
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

// ============================================
// TRADING COURSE FUNNEL
// Dark theme with gold accents
// ============================================
export const tradingFunnel: Funnel = {
  id: uuid(),
  name: 'Trading Course Funnel',
  description: 'High-converting funnel for trading courses and strategies',
  steps: [
    {
      id: uuid(),
      name: 'Lead Magnet',
      type: 'capture',
      slug: 'free-strategy',
      blocks: [
        createBlock('spacer', { height: 40 }, { padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
        createBlock('heading', {
          text: 'The 3-Chart Setup That Finds Winning Trades in Under 5 Minutes',
          level: 1,
          styles: { fontSize: 36, fontWeight: 800, textAlign: 'center', color: '#ffd700' },
        }, { padding: { top: 24, right: 20, bottom: 8, left: 20 } }),
        createBlock('text', {
          text: 'Download the same strategy that helped 2,847 traders achieve consistent profits — even in volatile markets.',
          styles: { fontSize: 18, fontWeight: 400, textAlign: 'center', lineHeight: 1.6, color: '#e5e7eb' },
        }, { padding: { top: 8, right: 24, bottom: 24, left: 24 } }),
        createBlock('image', {
          src: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
          alt: 'Trading chart setup',
          aspectRatio: '16:9',
        }, { borderRadius: 16, padding: { top: 0, right: 20, bottom: 24, left: 20 } }),
        createBlock('email-capture', {
          placeholder: 'Enter your email',
          buttonText: 'Get Free Trading Blueprint',
          subtitle: 'Join 2,847+ profitable traders',
        }, { padding: { top: 8, right: 20, bottom: 8, left: 20 } }),
        createBlock('social-proof', {
          items: [
            { id: '1', value: 2847, label: 'Traders', suffix: '+' },
            { id: '2', value: 89, label: 'Win Rate', suffix: '%' },
            { id: '3', value: 14.2, label: 'In Profits', suffix: 'M' },
          ],
          valueColor: '#ffd700',
          labelColor: '#9ca3af',
        }),
        createBlock('text', {
          text: '⚠️ Results not guaranteed. Trading involves risk. Only risk capital you can afford to lose.',
          styles: { fontSize: 11, textAlign: 'center', color: '#6b7280' },
        }, { padding: { top: 16, right: 20, bottom: 40, left: 20 } }),
      ],
      settings: { backgroundColor: '#0f0f1a' },
    },
    {
      id: uuid(),
      name: 'Qualification',
      type: 'capture',
      slug: 'experience',
      blocks: [
        createBlock('spacer', { height: 40 }),
        createBlock('heading', {
          text: 'Quick question before we send your strategy...',
          level: 2,
          styles: { fontSize: 28, fontWeight: 700, textAlign: 'center', color: '#ffffff' },
        }),
        createBlock('quiz', {
          question: 'How long have you been trading?',
          options: [
            { id: '1', text: 'Just starting out' },
            { id: '2', text: '0-1 year experience' },
            { id: '3', text: '1-3 years experience' },
            { id: '4', text: '3+ years experience' },
          ],
          multiSelect: false,
          questionColor: '#ffffff',
          optionTextColor: '#e5e7eb',
        }),
        createBlock('button', {
          text: 'Get My Strategy →',
          variant: 'primary',
          size: 'lg',
          action: 'next-step',
          fullWidth: true,
          backgroundColor: '#ffd700',
        }),
      ],
      settings: { backgroundColor: '#0f0f1a' },
    },
    {
      id: uuid(),
      name: 'VSL Page',
      type: 'sell',
      slug: 'watch-now',
      blocks: [
        createBlock('spacer', { height: 20 }),
        createBlock('heading', {
          text: 'Watch This Before Making Another Trade',
          level: 1,
          styles: { fontSize: 32, fontWeight: 800, textAlign: 'center', color: '#ffffff' },
        }),
        createBlock('video', {
          src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          type: 'youtube',
          autoplay: false,
        }),
        createBlock('countdown', {
          endDate: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          showDays: false,
          expiredText: 'Offer Expired',
          textColor: '#ffd700',
        }),
        createBlock('testimonial', {
          quote: '"I went from losing money every month to consistent 5-figure gains. This strategy changed everything for me."',
          authorName: 'Marcus T.',
          authorTitle: 'Full-time Trader',
          rating: 5,
          quoteColor: '#e5e7eb',
          authorColor: '#f8fafc',
        }),
        createBlock('button', {
          text: 'Join The Trading Academy - $997',
          variant: 'primary',
          size: 'lg',
          action: 'next-step',
          fullWidth: true,
          backgroundColor: '#ffd700',
        }),
        createBlock('accordion', {
          items: [
            { id: '1', title: 'Is this suitable for beginners?', content: 'Absolutely! The strategy is designed to work for traders of all experience levels. We start with the fundamentals and build from there.' },
            { id: '2', title: 'What markets does this work for?', content: 'The 3-Chart Setup works for stocks, forex, crypto, and futures. The principles are universal.' },
            { id: '3', title: 'What\'s the refund policy?', content: 'We offer a 30-day money-back guarantee. If you\'re not satisfied, simply request a refund.' },
          ],
          titleColor: '#ffffff',
          contentColor: '#9ca3af',
        }),
      ],
      settings: { backgroundColor: '#0f0f1a' },
    },
  ],
  settings: {
    primaryColor: '#ffd700',
    fontFamily: 'Inter',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============================================
// MARKETING AGENCY FUNNEL
// Bold blue with orange accents
// ============================================
export const marketingFunnel: Funnel = {
  id: uuid(),
  name: 'Marketing Agency Funnel',
  description: 'Lead generation funnel for marketing agencies',
  steps: [
    {
      id: uuid(),
      name: 'Free Audit',
      type: 'capture',
      slug: 'free-audit',
      blocks: [
        createBlock('spacer', { height: 32 }),
        createBlock('heading', {
          text: '10X Your Leads Without Hiring an In-House Team',
          level: 1,
          styles: { fontSize: 40, fontWeight: 800, textAlign: 'center', color: '#0f172a' },
        }),
        createBlock('text', {
          text: 'Get a free growth audit and discover exactly how we\'ve generated $47M for clients like you.',
          styles: { fontSize: 18, textAlign: 'center', lineHeight: 1.6, color: '#374151' },
        }),
        createBlock('logo-bar', {
          title: 'Trusted by industry leaders',
          logos: [
            { id: '1', src: '/placeholder.svg', alt: 'Forbes' },
            { id: '2', src: '/placeholder.svg', alt: 'Inc' },
            { id: '3', src: '/placeholder.svg', alt: 'Entrepreneur' },
            { id: '4', src: '/placeholder.svg', alt: 'TechCrunch' },
          ],
        }),
        createBlock('social-proof', {
          items: [
            { id: '1', value: 347, label: 'Businesses Scaled', suffix: '+' },
            { id: '2', value: 312, label: 'Average ROI', suffix: '%' },
            { id: '3', value: 47, label: 'Generated', suffix: 'M' },
          ],
        }),
        createBlock('button', {
          text: 'Get Your Free Growth Audit',
          variant: 'primary',
          size: 'lg',
          action: 'next-step',
          fullWidth: true,
          backgroundColor: '#3b82f6',
        }),
        createBlock('text', {
          text: '✓ No obligation  ✓ 100% free  ✓ Results in 24 hours',
          styles: { fontSize: 12, textAlign: 'center', color: '#6b7280' },
        }),
      ],
      settings: {},
    },
    {
      id: uuid(),
      name: 'Qualification',
      type: 'capture',
      slug: 'qualify',
      blocks: [
        createBlock('spacer', { height: 32 }),
        createBlock('heading', {
          text: 'Let\'s Find Your Growth Opportunities',
          level: 2,
          styles: { fontSize: 28, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('quiz', {
          question: 'What\'s your current monthly revenue?',
          options: [
            { id: '1', text: 'Under $10K/month' },
            { id: '2', text: '$10K - $50K/month' },
            { id: '3', text: '$50K - $100K/month' },
            { id: '4', text: '$100K+/month' },
          ],
          multiSelect: false,
        }),
      ],
      settings: {},
    },
    {
      id: uuid(),
      name: 'Case Studies',
      type: 'educate',
      slug: 'results',
      blocks: [
        createBlock('spacer', { height: 32 }),
        createBlock('heading', {
          text: 'Real Results From Real Businesses',
          level: 1,
          styles: { fontSize: 36, fontWeight: 800, textAlign: 'center' },
        }),
        createBlock('testimonial', {
          quote: '"They took us from $50K to $500K monthly revenue in just 8 months. The ROI has been incredible."',
          authorName: 'Sarah Johnson',
          authorTitle: 'CEO, TechStartup',
          rating: 5,
        }),
        createBlock('testimonial', {
          quote: '"Finally, a marketing team that actually delivers on their promises. Our cost per acquisition dropped by 60%."',
          authorName: 'Michael Chen',
          authorTitle: 'Founder, E-commerce Brand',
          rating: 5,
        }),
        createBlock('button', {
          text: 'Book Your Strategy Call',
          variant: 'primary',
          size: 'lg',
          action: 'next-step',
          fullWidth: true,
          backgroundColor: '#3b82f6',
        }),
      ],
      settings: {},
    },
    {
      id: uuid(),
      name: 'Book Call',
      type: 'book',
      slug: 'book-call',
      blocks: [
        createBlock('spacer', { height: 32 }),
        createBlock('heading', {
          text: 'Schedule Your Free Strategy Call',
          level: 1,
          styles: { fontSize: 32, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'Pick a time that works for you. We\'ll analyze your current marketing and show you exactly how to 10X your leads.',
          styles: { fontSize: 16, textAlign: 'center', lineHeight: 1.6 },
        }),
        createBlock('calendar', {
          provider: 'calendly',
          url: '',
          height: 600,
        }),
      ],
      settings: {},
    },
  ],
  settings: {
    primaryColor: '#3b82f6',
    fontFamily: 'Inter',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============================================
// CONSULTING FUNNEL
// Premium dark with purple accents
// ============================================
export const consultingFunnel: Funnel = {
  id: uuid(),
  name: 'Consulting Funnel',
  description: 'High-ticket consulting and advisory funnel',
  steps: [
    {
      id: uuid(),
      name: 'Authority',
      type: 'capture',
      slug: 'strategic-clarity',
      blocks: [
        createBlock('spacer', { height: 48 }),
        createBlock('heading', {
          text: 'Strategic Clarity for 7-Figure Business Owners',
          level: 1,
          styles: { fontSize: 40, fontWeight: 700, textAlign: 'center', color: '#f8fafc' },
        }),
        createBlock('text', {
          text: 'The proven framework behind 23 successful exits and $2.3B in client valuations.',
          styles: { fontSize: 20, textAlign: 'center', lineHeight: 1.6, color: '#94a3b8' },
        }),
        createBlock('image', {
          src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
          alt: 'Business consultant',
          aspectRatio: '1:1',
        }, { borderRadius: 999 }),
        createBlock('text', {
          text: 'John Smith\nFormer McKinsey Partner | Harvard MBA | Author of "The Exit Strategy"',
          styles: { fontSize: 14, textAlign: 'center', color: '#94a3b8' },
        }),
        createBlock('social-proof', {
          items: [
            { id: '1', value: 2.3, label: 'In Valuations', suffix: 'B' },
            { id: '2', value: 23, label: 'Successful Exits', suffix: '' },
            { id: '3', value: 15, label: 'Years Experience', suffix: '+' },
          ],
          valueColor: '#f8fafc',
          labelColor: '#94a3b8',
        }),
        createBlock('button', {
          text: 'Download Executive Guide',
          variant: 'primary',
          size: 'lg',
          action: 'next-step',
          fullWidth: true,
          backgroundColor: '#6366f1',
        }),
      ],
      settings: { backgroundColor: '#020617' },
    },
    {
      id: uuid(),
      name: 'Fit Quiz',
      type: 'capture',
      slug: 'find-your-fit',
      blocks: [
        createBlock('spacer', { height: 40 }),
        createBlock('heading', {
          text: 'Is This Right For You?',
          level: 2,
          styles: { fontSize: 32, fontWeight: 600, textAlign: 'center', color: '#f8fafc' },
        }),
        createBlock('quiz', {
          question: 'What\'s your primary business challenge?',
          options: [
            { id: '1', text: 'Scaling past a revenue plateau' },
            { id: '2', text: 'Preparing for exit or acquisition' },
            { id: '3', text: 'Building a leadership team' },
            { id: '4', text: 'Strategic repositioning' },
          ],
          multiSelect: false,
          questionColor: '#f8fafc',
          optionTextColor: '#e2e8f0',
        }),
      ],
      settings: { backgroundColor: '#020617' },
    },
    {
      id: uuid(),
      name: 'Methodology',
      type: 'educate',
      slug: 'methodology',
      blocks: [
        createBlock('spacer', { height: 32 }),
        createBlock('heading', {
          text: 'The Strategic Clarity Framework',
          level: 1,
          styles: { fontSize: 36, fontWeight: 700, textAlign: 'center', color: '#f8fafc' },
        }),
        createBlock('accordion', {
          items: [
            { id: '1', title: 'Phase 1: Diagnostic Deep Dive', content: 'A comprehensive analysis of your business model, market position, and growth levers. We identify the hidden opportunities and blind spots.', defaultOpen: true },
            { id: '2', title: 'Phase 2: Strategic Roadmap', content: 'A clear, actionable 90-day plan with specific milestones, KPIs, and decision frameworks.' },
            { id: '3', title: 'Phase 3: Execution Support', content: 'Weekly advisory calls, access to our network of operators, and hands-on support for critical initiatives.' },
          ],
          titleColor: '#f8fafc',
          contentColor: '#94a3b8',
        }),
        createBlock('testimonial', {
          quote: '"John\'s framework helped us 3X our valuation in 18 months. His strategic insights were invaluable."',
          authorName: 'David Park',
          authorTitle: 'Founder (Acquired by PE firm)',
          rating: 5,
          quoteColor: '#e2e8f0',
          authorColor: '#f8fafc',
        }),
        createBlock('button', {
          text: 'Apply for Strategy Session',
          variant: 'primary',
          size: 'lg',
          action: 'next-step',
          fullWidth: true,
          backgroundColor: '#6366f1',
        }),
      ],
      settings: { backgroundColor: '#020617' },
    },
    {
      id: uuid(),
      name: 'Apply',
      type: 'book',
      slug: 'apply',
      blocks: [
        createBlock('spacer', { height: 32 }),
        createBlock('heading', {
          text: 'Apply for a Discovery Call',
          level: 1,
          styles: { fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#f8fafc' },
        }),
        createBlock('text', {
          text: 'Due to the high-touch nature of our work, we only accept 3 new clients per quarter.',
          styles: { fontSize: 16, textAlign: 'center', color: '#94a3b8' },
        }),
        createBlock('form', {
          fields: [
            { id: '1', type: 'text', label: 'Full Name', placeholder: 'John Smith', required: true },
            { id: '2', type: 'email', label: 'Email', placeholder: 'john@company.com', required: true },
            { id: '3', type: 'text', label: 'Company', placeholder: 'Your company name', required: true },
            { id: '4', type: 'text', label: 'Annual Revenue', placeholder: '$1M - $5M', required: true },
          ],
          submitText: 'Submit Application',
          submitAction: 'next-step',
        }),
      ],
      settings: { backgroundColor: '#020617' },
    },
  ],
  settings: {
    primaryColor: '#6366f1',
    fontFamily: 'Inter',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============================================
// COACHING FUNNEL
// Warm gradients with transformation focus
// ============================================
export const coachingFunnel: Funnel = {
  id: uuid(),
  name: 'Coaching Funnel',
  description: 'Life coaching and transformation funnel',
  steps: [
    {
      id: uuid(),
      name: 'Free Masterclass',
      type: 'capture',
      slug: 'masterclass',
      blocks: [
        createBlock('spacer', { height: 32 }),
        createBlock('heading', {
          text: 'Free Masterclass',
          level: 2,
          styles: { fontSize: 20, fontWeight: 600, textAlign: 'center', color: '#f59e0b' },
        }),
        createBlock('heading', {
          text: 'Unlock Your Full Potential in 90 Days',
          level: 1,
          styles: { fontSize: 38, fontWeight: 800, textAlign: 'center', color: '#1f2937' },
        }),
        createBlock('text', {
          text: 'Discover the exact framework that\'s helped 5,000+ people transform their lives, careers, and relationships.',
          styles: { fontSize: 18, textAlign: 'center', lineHeight: 1.6, color: '#374151' },
        }),
        createBlock('video', {
          src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          type: 'youtube',
          autoplay: false,
        }),
        createBlock('social-proof', {
          items: [
            { id: '1', value: 5000, label: 'Lives Transformed', suffix: '+' },
            { id: '2', value: 98, label: 'Recommend', suffix: '%' },
            { id: '3', value: 4.9, label: 'Rating', suffix: '★' },
          ],
        }),
        createBlock('form', {
          fields: [
            { id: '1', type: 'text', label: 'First Name', placeholder: 'Your first name', required: true },
            { id: '2', type: 'email', label: 'Email', placeholder: 'Your best email', required: true },
          ],
          submitText: 'Reserve My Spot',
          submitAction: 'next-step',
        }),
      ],
      settings: { backgroundColor: '#fffbeb' },
    },
    {
      id: uuid(),
      name: 'Mindset Quiz',
      type: 'capture',
      slug: 'mindset-quiz',
      blocks: [
        createBlock('spacer', { height: 40 }),
        createBlock('heading', {
          text: 'Where Are You on Your Journey?',
          level: 2,
          styles: { fontSize: 28, fontWeight: 700, textAlign: 'center', color: '#1f2937' },
        }),
        createBlock('quiz', {
          question: 'What\'s your biggest challenge right now?',
          options: [
            { id: '1', text: 'Lack of clarity and direction' },
            { id: '2', text: 'Limiting beliefs holding me back' },
            { id: '3', text: 'Work-life balance' },
            { id: '4', text: 'Building confidence' },
          ],
          multiSelect: false,
        }),
      ],
      settings: { backgroundColor: '#fffbeb' },
    },
    {
      id: uuid(),
      name: 'Transformation Stories',
      type: 'educate',
      slug: 'stories',
      blocks: [
        createBlock('spacer', { height: 32 }),
        createBlock('heading', {
          text: 'Real Transformations, Real People',
          level: 1,
          styles: { fontSize: 36, fontWeight: 800, textAlign: 'center', color: '#1f2937' },
        }),
        createBlock('testimonial', {
          quote: '"A year ago, I was burnt out and lost. Today, I\'ve started my dream business and never been happier. This program changed my life."',
          authorName: 'Emily R.',
          authorTitle: 'Entrepreneur',
          rating: 5,
        }),
        createBlock('testimonial', {
          quote: '"The accountability and mindset shifts were exactly what I needed. I finally broke through my income ceiling."',
          authorName: 'James M.',
          authorTitle: 'Sales Director',
          rating: 5,
        }),
        createBlock('testimonial', {
          quote: '"I went from constant anxiety to inner peace. The techniques are simple but incredibly powerful."',
          authorName: 'Sarah L.',
          authorTitle: 'Designer',
          rating: 5,
        }),
        createBlock('button', {
          text: 'Start Your Transformation',
          variant: 'primary',
          size: 'lg',
          action: 'next-step',
          fullWidth: true,
          backgroundColor: '#f59e0b',
        }),
      ],
      settings: { backgroundColor: '#fffbeb' },
    },
    {
      id: uuid(),
      name: 'Apply',
      type: 'book',
      slug: 'apply',
      blocks: [
        createBlock('spacer', { height: 32 }),
        createBlock('heading', {
          text: 'Apply for Coaching',
          level: 1,
          styles: { fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#1f2937' },
        }),
        createBlock('text', {
          text: 'This isn\'t for everyone. We only work with people who are truly committed to change.',
          styles: { fontSize: 16, textAlign: 'center', color: '#6b7280' },
        }),
        createBlock('form', {
          fields: [
            { id: '1', type: 'text', label: 'Full Name', placeholder: 'Your name', required: true },
            { id: '2', type: 'email', label: 'Email', placeholder: 'Your email', required: true },
            { id: '3', type: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000', required: true },
            { id: '4', type: 'textarea', label: 'Why do you want to join?', placeholder: 'Tell us about your goals...', required: true },
          ],
          submitText: 'Submit Application',
          submitAction: 'next-step',
        }),
        createBlock('text', {
          text: '🔒 Your information is 100% secure and will never be shared.',
          styles: { fontSize: 12, textAlign: 'center', color: '#6b7280' },
        }),
      ],
      settings: { backgroundColor: '#fffbeb' },
    },
  ],
  settings: {
    primaryColor: '#f59e0b',
    fontFamily: 'Inter',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============================================
// ORIGINAL TEMPLATES (preserved)
// ============================================
export const leadMagnetTemplate: Funnel = {
  id: uuid(),
  name: 'Lead Magnet Funnel',
  description: 'Capture emails with a free resource offer',
  steps: [
    {
      id: uuid(),
      name: 'Capture',
      type: 'capture',
      slug: 'get-free-guide',
      blocks: [
        createBlock('spacer', { height: 40 }, { padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
        createBlock('heading', {
          text: 'Get Your Free Guide',
          level: 1,
          styles: { fontSize: 36, fontWeight: 800, textAlign: 'center' },
        }, { padding: { top: 24, right: 20, bottom: 8, left: 20 } }),
        createBlock('text', {
          text: 'Discover the 7 secrets that top performers use to achieve extraordinary results.',
          styles: { fontSize: 18, fontWeight: 400, textAlign: 'center', lineHeight: 1.6 },
        }, { padding: { top: 8, right: 24, bottom: 24, left: 24 } }),
        createBlock('image', {
          src: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop',
          alt: 'Free guide preview',
          aspectRatio: '4:3',
        }, { borderRadius: 16, padding: { top: 0, right: 20, bottom: 24, left: 20 } }),
        createBlock('email-capture', {
          placeholder: 'Enter your email',
          buttonText: 'Send Me The Guide',
          subtitle: 'Join 15,000+ subscribers',
        }, { padding: { top: 8, right: 20, bottom: 8, left: 20 } }),
        createBlock('text', {
          text: '✓ No spam, ever  ✓ Unsubscribe anytime',
          styles: { fontSize: 12, textAlign: 'center', color: 'hsl(var(--muted-foreground))' },
        }, { padding: { top: 8, right: 20, bottom: 40, left: 20 } }),
      ],
      settings: {},
    },
    {
      id: uuid(),
      name: 'Thank You',
      type: 'result',
      slug: 'thank-you',
      blocks: [
        createBlock('spacer', { height: 80 }, { padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
        createBlock('heading', {
          text: '🎉 Check Your Inbox!',
          level: 1,
          styles: { fontSize: 32, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'Your free guide is on its way. Check your email (and spam folder, just in case).',
          styles: { fontSize: 16, textAlign: 'center', lineHeight: 1.6 },
        }),
        createBlock('button', {
          text: 'Follow Us on Twitter',
          variant: 'secondary',
          size: 'lg',
          action: 'url',
          actionValue: 'https://twitter.com',
          fullWidth: true,
        }),
      ],
      settings: {},
    },
  ],
  settings: {
    primaryColor: 'hsl(234 89% 64%)',
    fontFamily: 'Inter',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const bookingTemplate: Funnel = {
  id: uuid(),
  name: 'Booking Funnel',
  description: 'Schedule consultations with a multi-step flow',
  steps: [
    {
      id: uuid(),
      name: 'Interest',
      type: 'capture',
      slug: 'book-call',
      blocks: [
        createBlock('spacer', { height: 32 }),
        createBlock('heading', {
          text: 'Book Your Free Strategy Call',
          level: 1,
          styles: { fontSize: 32, fontWeight: 800, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'In just 30 minutes, we\'ll create a personalized roadmap to help you achieve your goals.',
          styles: { fontSize: 16, textAlign: 'center', lineHeight: 1.6 },
        }),
        createBlock('social-proof', {
          items: [
            { id: '1', value: 500, label: 'Calls Booked', suffix: '+' },
            { id: '2', value: 98, label: 'Satisfaction', suffix: '%' },
          ],
        }),
        createBlock('quiz', {
          question: 'What\'s your biggest challenge right now?',
          options: [
            { id: '1', text: 'Getting more leads' },
            { id: '2', text: 'Converting leads to customers' },
            { id: '3', text: 'Scaling my business' },
            { id: '4', text: 'Something else' },
          ],
          multiSelect: false,
        }),
      ],
      settings: {},
    },
    {
      id: uuid(),
      name: 'Contact Info',
      type: 'capture',
      slug: 'your-info',
      blocks: [
        createBlock('spacer', { height: 32 }),
        createBlock('heading', {
          text: 'Almost There!',
          level: 2,
          styles: { fontSize: 28, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'Enter your details so we can prepare for your call.',
          styles: { fontSize: 16, textAlign: 'center' },
        }),
        createBlock('form', {
          fields: [
            { id: '1', type: 'text', label: 'Full Name', placeholder: 'John Smith', required: true },
            { id: '2', type: 'email', label: 'Email', placeholder: 'john@company.com', required: true },
            { id: '3', type: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000', required: true },
          ],
          submitText: 'Continue to Booking',
          submitAction: 'next-step',
        }),
      ],
      settings: {},
    },
    {
      id: uuid(),
      name: 'Confirmed',
      type: 'result',
      slug: 'confirmed',
      blocks: [
        createBlock('spacer', { height: 60 }),
        createBlock('heading', {
          text: '✅ You\'re All Set!',
          level: 1,
          styles: { fontSize: 32, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'Check your email for the calendar invite and preparation materials.',
          styles: { fontSize: 16, textAlign: 'center', lineHeight: 1.6 },
        }),
        createBlock('testimonial', {
          quote: '"The strategy call was incredibly valuable. In 30 minutes, I got more clarity than months of trying to figure it out alone."',
          authorName: 'Michael Chen',
          authorTitle: 'Founder, TechStartup',
          rating: 5,
        }),
      ],
      settings: {},
    },
  ],
  settings: {
    primaryColor: 'hsl(234 89% 64%)',
    fontFamily: 'Inter',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const salesPageTemplate: Funnel = {
  id: uuid(),
  name: 'Sales Page',
  description: 'High-converting product sales page',
  steps: [
    {
      id: uuid(),
      name: 'Sales Page',
      type: 'sell',
      slug: 'get-product',
      blocks: [
        createBlock('spacer', { height: 40 }),
        createBlock('heading', {
          text: 'Transform Your Business in 30 Days',
          level: 1,
          styles: { fontSize: 36, fontWeight: 800, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'The complete system used by 1,000+ entrepreneurs to scale from 6 to 7 figures.',
          styles: { fontSize: 18, textAlign: 'center', lineHeight: 1.6 },
        }),
        createBlock('button', {
          text: 'Get Instant Access - $297',
          variant: 'primary',
          size: 'lg',
          action: 'next-step',
          fullWidth: true,
        }),
        createBlock('text', {
          text: '30-day money-back guarantee',
          styles: { fontSize: 12, textAlign: 'center', color: 'hsl(var(--muted-foreground))' },
        }),
        createBlock('divider', { style: 'solid' }),
        createBlock('logo-bar', {
          title: 'Featured in',
          logos: [
            { id: '1', src: '/placeholder.svg', alt: 'Forbes' },
            { id: '2', src: '/placeholder.svg', alt: 'TechCrunch' },
            { id: '3', src: '/placeholder.svg', alt: 'Entrepreneur' },
          ],
        }),
        createBlock('heading', {
          text: 'What\'s Inside',
          level: 2,
          styles: { fontSize: 24, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('accordion', {
          items: [
            { id: '1', title: 'Module 1: Foundation', content: 'Build unshakeable business fundamentals that scale.', defaultOpen: true },
            { id: '2', title: 'Module 2: Systems', content: 'Automate your operations for consistent growth.' },
            { id: '3', title: 'Module 3: Scale', content: 'The exact playbook to 10x your revenue.' },
          ],
        }),
        createBlock('testimonial', {
          quote: '"I went from $10K to $100K months in just 6 months. This system works."',
          authorName: 'Jessica Williams',
          authorTitle: 'Agency Owner',
          rating: 5,
        }),
        createBlock('countdown', {
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          showDays: true,
          expiredText: 'Offer Expired',
        }),
        createBlock('button', {
          text: 'Start Your Transformation',
          variant: 'primary',
          size: 'lg',
          action: 'next-step',
          fullWidth: true,
        }),
      ],
      settings: {},
    },
  ],
  settings: {
    primaryColor: 'hsl(234 89% 64%)',
    fontFamily: 'Inter',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const webinarTemplate: Funnel = {
  id: uuid(),
  name: 'Webinar Funnel',
  description: 'Event registration flow',
  steps: [
    {
      id: uuid(),
      name: 'Register',
      type: 'capture',
      slug: 'register',
      blocks: [
        createBlock('heading', {
          text: 'Free Masterclass',
          level: 1,
          styles: { fontSize: 32, fontWeight: 800, textAlign: 'center' },
        }),
        createBlock('heading', {
          text: 'How to Build a 6-Figure Online Business',
          level: 2,
          styles: { fontSize: 24, fontWeight: 600, textAlign: 'center' },
        }),
        createBlock('countdown', {
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          showDays: true,
        }),
        createBlock('form', {
          fields: [
            { id: '1', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
            { id: '2', type: 'email', label: 'Email', placeholder: 'Your best email', required: true },
          ],
          submitText: 'Reserve My Spot',
          submitAction: 'next-step',
        }),
        createBlock('social-proof', {
          items: [
            { id: '1', value: 2500, label: 'Registered', suffix: '+' },
          ],
        }),
      ],
      settings: {},
    },
    {
      id: uuid(),
      name: 'Confirmed',
      type: 'result',
      slug: 'confirmed',
      blocks: [
        createBlock('heading', {
          text: '🎉 You\'re Registered!',
          level: 1,
          styles: { fontSize: 32, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'Check your email for the webinar link and calendar invite.',
          styles: { fontSize: 16, textAlign: 'center' },
        }),
        createBlock('button', {
          text: 'Add to Calendar',
          variant: 'secondary',
          size: 'lg',
          action: 'url',
          fullWidth: true,
        }),
      ],
      settings: {},
    },
  ],
  settings: {
    primaryColor: 'hsl(234 89% 64%)',
    fontFamily: 'Inter',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const quizTemplate: Funnel = {
  id: uuid(),
  name: 'Quiz Funnel',
  description: 'Interactive lead qualification',
  steps: [
    {
      id: uuid(),
      name: 'Question 1',
      type: 'capture',
      slug: 'q1',
      blocks: [
        createBlock('heading', {
          text: 'Find Your Perfect Solution',
          level: 1,
          styles: { fontSize: 28, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'Answer 3 quick questions to get personalized recommendations.',
          styles: { fontSize: 16, textAlign: 'center' },
        }),
        createBlock('quiz', {
          question: 'What\'s your current experience level?',
          options: [
            { id: '1', text: 'Just starting out' },
            { id: '2', text: 'Some experience' },
            { id: '3', text: 'Advanced' },
          ],
        }),
      ],
      settings: {},
    },
    {
      id: uuid(),
      name: 'Question 2',
      type: 'capture',
      slug: 'q2',
      blocks: [
        createBlock('quiz', {
          question: 'What\'s your main goal?',
          options: [
            { id: '1', text: 'Learn new skills' },
            { id: '2', text: 'Grow my business' },
            { id: '3', text: 'Change careers' },
          ],
        }),
      ],
      settings: {},
    },
    {
      id: uuid(),
      name: 'Results',
      type: 'result',
      slug: 'results',
      blocks: [
        createBlock('heading', {
          text: '🎯 Your Perfect Match',
          level: 1,
          styles: { fontSize: 28, fontWeight: 700, textAlign: 'center' },
        }),
        createBlock('text', {
          text: 'Based on your answers, we recommend our Starter Package.',
          styles: { fontSize: 16, textAlign: 'center' },
        }),
        createBlock('email-capture', {
          placeholder: 'Get your personalized report',
          buttonText: 'Send My Results',
        }),
      ],
      settings: {},
    },
  ],
  settings: {
    primaryColor: 'hsl(234 89% 64%)',
    fontFamily: 'Inter',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============================================
// TEMPLATE EXPORT
// ============================================
export const templates = [
  // Niche-specific templates (featured first)
  { ...tradingFunnel, thumbnail: 'trading', category: 'niche' },
  { ...marketingFunnel, thumbnail: 'marketing', category: 'niche' },
  { ...consultingFunnel, thumbnail: 'consulting', category: 'niche' },
  { ...coachingFunnel, thumbnail: 'coaching', category: 'niche' },
  // General templates
  { ...leadMagnetTemplate, thumbnail: 'lead-magnet', category: 'general' },
  { ...bookingTemplate, thumbnail: 'booking', category: 'general' },
  { ...salesPageTemplate, thumbnail: 'sales', category: 'general' },
  { ...webinarTemplate, thumbnail: 'webinar', category: 'general' },
  { ...quizTemplate, thumbnail: 'quiz', category: 'general' },
];

export function createEmptyFunnel(): Funnel {
  return {
    id: uuid(),
    name: 'Untitled Funnel',
    steps: [
      {
        id: uuid(),
        name: 'Step 1',
        type: 'capture',
        slug: 'step-1',
        blocks: [],
        settings: {},
      },
    ],
    settings: {
      primaryColor: 'hsl(234 89% 64%)',
      fontFamily: 'Inter',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
