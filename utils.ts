import { Theme } from './types';
import { RAW_COLOR_VALUES } from './constants';

export const getSharedSelectBaseStyles = (theme: Theme) => {
  return {
    baseClassName: `p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors`,
    style: {
      backgroundColor: RAW_COLOR_VALUES[theme.darkGray] || '#1f2937',
      color: RAW_COLOR_VALUES[theme.textColor.replace('text-', '')] || '#f3f4f6',
      border: `1px solid ${RAW_COLOR_VALUES[theme.borderColor.replace('border-', '')] || '#374151'}`,
    },
    optionStyle: {
      backgroundColor: RAW_COLOR_VALUES[theme.darkGray] || '#1f2937',
      color: RAW_COLOR_VALUES[theme.textColor.replace('text-', '')] || '#f3f4f6',
    }
  };
};