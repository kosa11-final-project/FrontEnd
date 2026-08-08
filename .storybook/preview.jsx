import '../src/styles.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    layout: 'centered',
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
      <div style={{ minWidth: '320px', padding: '24px' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
