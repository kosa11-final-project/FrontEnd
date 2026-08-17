import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger } from './Tabs.jsx';

function TabsFixture() {
  const [value, setValue] = useState('overview');

  return (
    <Tabs value={value} onValueChange={setValue}>
      {({ value: activeValue, setValue: selectValue }) => (
        <TabsList aria-label="재고 상세 탭">
          <TabsTrigger value="overview" activeValue={activeValue} onSelect={selectValue}>
            개요
          </TabsTrigger>
          <TabsTrigger value="forecast" activeValue={activeValue} onSelect={selectValue}>
            수요예측
          </TabsTrigger>
          <TabsTrigger value="lots" activeValue={activeValue} onSelect={selectValue}>
            LOT
          </TabsTrigger>
        </TabsList>
      )}
    </Tabs>
  );
}

describe('Tabs', () => {
  it('supports roving focus and arrow-key selection', () => {
    render(<TabsFixture />);

    const overview = screen.getByRole('tab', { name: '개요' });
    const forecast = screen.getByRole('tab', { name: '수요예측' });
    const lots = screen.getByRole('tab', { name: 'LOT' });

    expect(overview).toHaveAttribute('aria-selected', 'true');
    expect(overview).toHaveAttribute('tabindex', '0');
    expect(forecast).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(overview, { key: 'ArrowRight' });

    expect(forecast).toHaveAttribute('aria-selected', 'true');
    expect(forecast).toHaveAttribute('tabindex', '0');
    expect(document.activeElement).toBe(forecast);

    fireEvent.keyDown(forecast, { key: 'End' });
    expect(lots).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(lots);
  });
});
