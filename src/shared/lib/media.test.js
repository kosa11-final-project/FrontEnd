import { describe, expect, it } from 'vitest';
import { getImageThumbnailUrl } from './media';

describe('getImageThumbnailUrl', () => {
  it('uses the small Naver product image variant for list thumbnails', () => {
    const source = 'https://shop-phinf.pstatic.net/20260313_183/example/product.png';

    expect(getImageThumbnailUrl(source)).toBe(`${source}?type=f100`);
  });

  it('replaces an existing Naver image type without changing the original path', () => {
    const source = 'https://shop-phinf.pstatic.net/example/product.jpg?type=m510&foo=bar';

    expect(getImageThumbnailUrl(source)).toBe('https://shop-phinf.pstatic.net/example/product.jpg?type=f100&foo=bar');
  });

  it('returns Greating originals directly without failing', () => {
    const source = 'https://image.greating.co.kr/IL/item/202312/29/product.jpg';

    expect(getImageThumbnailUrl(source)).toBe(source);
  });

  it('leaves non-Naver, relative, and data URLs unchanged', () => {
    expect(getImageThumbnailUrl('https://images.example.com/product.jpg')).toBe(
      'https://images.example.com/product.jpg',
    );
    expect(getImageThumbnailUrl('/assets/product.jpg')).toBe('/assets/product.jpg');
    expect(getImageThumbnailUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });
});
