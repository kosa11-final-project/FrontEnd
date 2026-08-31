import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Overview } from './Introduction.stories.jsx';

describe('Storybook Introduction', () => {
  it('shows every component Docs page in one navigable index', () => {
    render(Overview.render());

    expect(screen.getByRole('heading', { name: '전체 Docs 한눈에 보기' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(42);
    expect(screen.getByRole('link', { name: 'Button Docs 열기' })).toHaveAttribute(
      'href',
      './?path=/docs/shared-ui-button--docs',
    );
    expect(screen.getByRole('link', { name: 'Integrated Inventory Docs 열기' })).toHaveAttribute(
      'href',
      './?path=/docs/pages-integrated-inventory--docs',
    );
  });
});
