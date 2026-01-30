import React from 'react';
import { SpacerContent } from '@/types/funnel';

interface SpacerBlockProps {
  content: SpacerContent;
}

export function SpacerBlock({ content }: SpacerBlockProps) {
  const { height } = content;

  return <div style={{ height }} className="w-full" />;
}
