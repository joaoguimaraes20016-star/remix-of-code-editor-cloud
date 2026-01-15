// Shared style utilities for capture flow nodes

export const getInputStyleClass = (style?: string): string => {
  const styles: Record<string, string> = {
    default: 'rounded-lg',
    minimal: 'rounded-none border-t-0 border-l-0 border-r-0 border-b-2',
    rounded: 'rounded-full',
    square: 'rounded-none',
  };
  return styles[style || 'default'] || 'rounded-lg';
};

export const getInputClasses = (style?: string): string => {
  return `
    w-full p-4
    bg-background border border-input 
    text-foreground placeholder:text-muted-foreground
    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
    ${getInputStyleClass(style)}
  `;
};
