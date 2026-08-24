import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InventoryDetailHeader } from './InventoryDetailHeader.jsx';

const item = {
  rowId: 'SKU-DETAIL-1',
  skuCode: 'SKU002562',
  skuName: '치즈쭈욱 떡볶이',
  productName: '치즈쭈욱 떡볶이',
  imageUrl: 'https://example.com/detail-product.png',
  storageType: 'FROZEN',
  storageName: '냉동',
  updatedAt: '2026-08-22T00:00:00Z',
};

describe('InventoryDetailHeader', () => {
  it('opens the product image in the motion lightbox and closes it with Escape', async () => {
    render(<InventoryDetailHeader item={item} />);

    fireEvent.click(screen.getByRole('button', { name: '치즈쭈욱 떡볶이 이미지 크게 보기' }));

    expect(screen.getByRole('dialog', { name: '치즈쭈욱 떡볶이 크게 보기' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '치즈쭈욱 떡볶이 크게 보기' })).not.toBeInTheDocument(),
    );
  });
});
