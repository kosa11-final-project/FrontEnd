import '../src/styles.css';
import { TooltipProvider } from '../src/shared/ui/Tooltip.jsx';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    layout: 'centered',
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['Introduction', 'Foundations', 'Shared UI', 'Entities', 'Features', 'Widgets', 'Pages', 'Prototypes'],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div style={{ minWidth: '320px', padding: '24px' }}>
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
};

export default preview;
