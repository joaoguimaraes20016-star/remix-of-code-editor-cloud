/**
 * Runtime Component Registry
 * Maps component types to their runtime (interactive) versions
 * Used by renderRuntimeTree for published funnels
 */

import type { ReactNode } from 'react';
import type { ComponentDefinition } from '../registry/componentRegistry';

// Static primitives (layout, typography, media - no interactivity needed)
import {
  Frame,
  Section,
  Heading,
  Paragraph,
  Spacer,
  Divider,
  VideoEmbed,
  CalendarEmbed,
  Icon,
  InfoCard,
  ImageBlock,
  HeaderBar,
  ContentCard,
} from '../components/primitives';

// Runtime primitives (form inputs, buttons, consent - need interactivity)
import {
  RuntimeTextInput,
  RuntimeTextareaInput,
  RuntimeEmailInput,
  RuntimePhoneInput,
  RuntimeCtaButton,
  RuntimeOptionGrid,
  RuntimeConsentCheckbox,
} from './RuntimePrimitives';

// Import static components for non-interactive elements
import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { Hero } from '../components/Hero';
import { Text } from '../components/Text';

/**
 * Runtime registry - combines static components with runtime interactive versions
 */
export const RuntimeRegistry: Record<string, ComponentDefinition> = {
  // ============================================================================
  // LAYOUT (Static - no interaction needed)
  // ============================================================================
  
  container: {
    type: 'container',
    displayName: 'Container',
    defaultProps: { gap: 12 },
    render: (props, children) => (
      <Container gap={typeof props.gap === 'number' ? props.gap : undefined}>
        {children}
      </Container>
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: true },
  },

  frame: {
    type: 'frame',
    displayName: 'Frame',
    defaultProps: { name: 'Frame' },
    render: (props, children) => <Frame name={props.name as string}>{children}</Frame>,
    inspectorSchema: [],
    constraints: { canHaveChildren: true },
  },

  section: {
    type: 'section',
    displayName: 'Section',
    defaultProps: { variant: 'content' },
    render: (props, children) => (
      <Section
        variant={props.variant as any}
        backgroundColor={props.backgroundColor as string}
        padding={props.padding as number}
        gap={props.gap as number}
        maxWidth={props.maxWidth as string}
        borderRadius={props.borderRadius as number}
        shadow={props.shadow as string}
      >
        {children}
      </Section>
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: true },
  },

  content_card: {
    type: 'content_card',
    displayName: 'Content Card',
    defaultProps: { backgroundColor: '#ffffff', borderRadius: 16, padding: 32, shadow: true },
    render: (props, children) => (
      <ContentCard 
        backgroundColor={props.backgroundColor as string}
        borderRadius={props.borderRadius as number}
        padding={props.padding as number}
        shadow={props.shadow as boolean}
      >
        {children}
      </ContentCard>
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: true },
  },

  // ============================================================================
  // TYPOGRAPHY (Static)
  // ============================================================================

  text: {
    type: 'text',
    displayName: 'Text',
    defaultProps: { text: 'Text' },
    render: (props) => {
      // Support both 'text' (new format) and 'content' (FlowCanvas format)
      const textContent = (props.text ?? props.content) as string | undefined;
      return <Text text={typeof textContent === 'string' ? textContent : undefined} />;
    },
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  // Text block container (FlowCanvas format)
  'text-block': {
    type: 'text-block',
    displayName: 'Text Block',
    defaultProps: {},
    render: (props, children) => (
      <div className="builder-text-block">{children}</div>
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: true },
  },

  heading: {
    type: 'heading',
    displayName: 'Heading',
    defaultProps: { text: 'Heading', level: 'h1' },
    render: (props) => {
      // Support both 'text' (new format) and 'content' (FlowCanvas format)
      const textContent = (props.text ?? props.content) as string;
      return (
        <Heading 
          text={textContent} 
          level={props.level as 'h1' | 'h2' | 'h3'}
          color={props.color as string}
          textAlign={props.textAlign as any}
          fontSize={props.fontSize as string}
          fontWeight={props.fontWeight as string}
          backgroundColor={props.backgroundColor as string}
          borderRadius={props.borderRadius as number}
          shadow={props.shadow as string}
        />
      );
    },
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  paragraph: {
    type: 'paragraph',
    displayName: 'Paragraph',
    defaultProps: { text: 'Paragraph text' },
    render: (props) => {
      // Support both 'text' (new format) and 'content' (FlowCanvas format)
      const textContent = (props.text ?? props.content) as string;
      return (
        <Paragraph 
          text={textContent}
          color={props.color as string}
          textAlign={props.textAlign as any}
          fontSize={props.fontSize as string}
          fontWeight={props.fontWeight as string}
          backgroundColor={props.backgroundColor as string}
          borderRadius={props.borderRadius as number}
          shadow={props.shadow as string}
        />
      );
    },
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  // ============================================================================
  // SPACING (Static)
  // ============================================================================

  spacer: {
    type: 'spacer',
    displayName: 'Spacer',
    defaultProps: { height: 24 },
    render: (props) => <Spacer height={props.height as number} />,
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  divider: {
    type: 'divider',
    displayName: 'Divider',
    defaultProps: {},
    render: () => <Divider />,
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  // ============================================================================
  // MEDIA (Static)
  // ============================================================================

  video_embed: {
    type: 'video_embed',
    displayName: 'Video',
    defaultProps: { url: '' },
    render: (props) => {
      const url = props.url as string;
      // Don't render empty embeds in published mode
      if (!url) return null;
      return (
        <VideoEmbed 
          url={url}
          placeholder={props.placeholder as string}
        />
      );
    },
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  calendar_embed: {
    type: 'calendar_embed',
    displayName: 'Calendar',
    defaultProps: { url: '' },
    render: (props) => {
      const url = props.url as string;
      // Don't render empty embeds in published mode
      if (!url) return null;
      return (
        <CalendarEmbed 
          url={url}
          placeholder={props.placeholder as string}
        />
      );
    },
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  image: {
    type: 'image',
    displayName: 'Image',
    defaultProps: { src: '', alt: 'Image' },
    render: (props) => (
      <ImageBlock 
        src={props.src as string}
        alt={props.alt as string}
        maxWidth={props.maxWidth as string}
        borderRadius={props.borderRadius as number}
        shadow={props.shadow as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  icon: {
    type: 'icon',
    displayName: 'Icon',
    defaultProps: { name: 'check-circle', size: 48, color: '#22c55e' },
    render: (props) => (
      <Icon 
        name={props.name as string}
        size={props.size as number}
        color={props.color as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  info_card: {
    type: 'info_card',
    displayName: 'Info Card',
    defaultProps: { 
      items: [
        { icon: '📧', text: 'Check your inbox' },
        { icon: '📅', text: 'Save the date' },
      ] 
    },
    render: (props) => (
      <InfoCard items={props.items as Array<{ icon: string; text: string }>} />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  header_bar: {
    type: 'header_bar',
    displayName: 'Header Bar',
    defaultProps: { backgroundColor: '#1a1a1a' },
    render: (props) => (
      <HeaderBar 
        backgroundColor={props.backgroundColor as string}
        logoUrl={props.logoUrl as string}
        logoAlt={props.logoAlt as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  hero: {
    type: 'hero',
    displayName: 'Hero',
    defaultProps: { headline: 'Hero headline', subheadline: 'Hero subheadline' },
    render: (props, children) => (
      <Hero
        headline={typeof props.headline === 'string' ? props.headline : undefined}
        subheadline={typeof props.subheadline === 'string' ? props.subheadline : undefined}
        backgroundColor={typeof props.backgroundColor === 'string' ? props.backgroundColor : undefined}
      >
        {children}
      </Hero>
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: true },
  },

  // ============================================================================
  // INTERACTIVE INPUTS (Runtime versions)
  // ============================================================================

  text_input: {
    type: 'text_input',
    displayName: 'Text Input',
    defaultProps: { placeholder: 'Type here...', fieldName: 'text', required: false },
    render: (props) => (
      <RuntimeTextInput 
        placeholder={props.placeholder as string}
        fieldName={props.fieldName as string}
        required={props.required as boolean}
        borderRadius={props.borderRadius as number}
        backgroundColor={props.backgroundColor as string}
        color={props.color as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  name_input: {
    type: 'name_input',
    displayName: 'Name Input',
    defaultProps: { placeholder: 'Your name', fieldName: 'name', required: true },
    render: (props) => (
      <RuntimeTextInput 
        placeholder={props.placeholder as string}
        fieldName={props.fieldName as string || 'name'}
        required={props.required as boolean}
        borderRadius={props.borderRadius as number}
        backgroundColor={props.backgroundColor as string}
        color={props.color as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  email_input: {
    type: 'email_input',
    displayName: 'Email Input',
    defaultProps: { placeholder: 'you@example.com', fieldName: 'email', required: true },
    render: (props) => (
      <RuntimeEmailInput 
        placeholder={props.placeholder as string}
        fieldName={props.fieldName as string}
        required={props.required as boolean}
        borderRadius={props.borderRadius as number}
        backgroundColor={props.backgroundColor as string}
        color={props.color as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  phone_input: {
    type: 'phone_input',
    displayName: 'Phone Input',
    defaultProps: { placeholder: '(555) 123-4567', fieldName: 'phone' },
    render: (props) => (
      <RuntimePhoneInput 
        placeholder={props.placeholder as string}
        fieldName={props.fieldName as string}
        borderRadius={props.borderRadius as number}
        backgroundColor={props.backgroundColor as string}
        color={props.color as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  textarea_input: {
    type: 'textarea_input',
    displayName: 'Textarea',
    defaultProps: { placeholder: 'Enter your message...', fieldName: 'message', required: false, rows: 4 },
    render: (props) => (
      <RuntimeTextareaInput 
        placeholder={props.placeholder as string}
        fieldName={props.fieldName as string}
        required={props.required as boolean}
        rows={props.rows as number}
        borderRadius={props.borderRadius as number}
        backgroundColor={props.backgroundColor as string}
        color={props.color as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  // ============================================================================
  // INTERACTIVE BUTTONS (Runtime versions)
  // ============================================================================

  button: {
    type: 'button',
    displayName: 'Button',
    defaultProps: { label: 'Button' },
    render: (props) => (
      <RuntimeCtaButton 
        label={typeof props.label === 'string' ? props.label : 'Button'} 
        action={props.action as any}
        buttonAction={props.buttonAction as any}
        linkUrl={props.linkUrl as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  cta_button: {
    type: 'cta_button',
    displayName: 'Button',
    defaultProps: { label: 'Continue', variant: 'primary', action: 'next' },
    render: (props) => (
      <RuntimeCtaButton 
        label={props.label as string} 
        variant={props.variant as 'primary' | 'secondary' | 'outline'} 
        action={props.action as 'next' | 'submit' | 'link' | 'prev'}
        buttonAction={props.buttonAction as any}
        linkUrl={props.linkUrl as string}
        size={props.size as 'sm' | 'default' | 'lg'}
        fullWidth={props.fullWidth as boolean}
        backgroundColor={props.backgroundColor as string}
        color={props.color as string}
        borderRadius={props.borderRadius as number}
        shadow={props.shadow as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  // ============================================================================
  // INTERACTIVE OPTIONS (Runtime versions)
  // ============================================================================

  option_grid: {
    type: 'option_grid',
    displayName: 'Options',
    defaultProps: { options: [], autoAdvance: true },
    render: (props) => (
      <RuntimeOptionGrid 
        options={props.options as Array<{ id: string; label: string; emoji?: string }>}
        autoAdvance={props.autoAdvance as boolean}
        fieldName={props.fieldName as string}
        borderRadius={props.borderRadius as number}
        backgroundColor={props.backgroundColor as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },

  // ============================================================================
  // CONSENT (Runtime version)
  // ============================================================================

  consent_checkbox: {
    type: 'consent_checkbox',
    displayName: 'Consent',
    defaultProps: { label: 'I agree to receive communications', linkText: 'Privacy Policy', linkUrl: '/privacy' },
    render: (props) => (
      <RuntimeConsentCheckbox 
        label={props.label as string}
        linkText={props.linkText as string}
        linkUrl={props.linkUrl as string}
        required={props.required as boolean}
        fieldName={props.fieldName as string}
      />
    ),
    inspectorSchema: [],
    constraints: { canHaveChildren: false },
  },
};

/**
 * Fallback component for unknown types
 */
export const runtimeFallbackComponent: ComponentDefinition = {
  type: 'fallback',
  displayName: 'Fallback',
  defaultProps: {},
  render: (_, children) => <div className="runtime-fallback">{children}</div>,
  inspectorSchema: [],
  constraints: { canHaveChildren: true },
};
