import { fn } from 'storybook/test';
import { LazyThumbnailImage } from './LazyThumbnailImage.jsx';

const meta = {
  title: 'Widgets/Inventory/Lazy Thumbnail Image',
  component: LazyThumbnailImage,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '뷰포트 진입 시 썸네일을 지연 로드하고, 이미지가 없는 상품은 고정 크기의 대체 상태로 표시합니다. 실제 재고 표와 같은 이미지 확대 콜백도 확인할 수 있습니다.',
      },
    },
  },
  args: {
    alt: '재고 상품 썸네일',
    width: 96,
    height: 96,
    onImageClick: fn(),
    item: { skuCode: 'GF-SAL-GRN-05' },
  },
};

export default meta;

export const LoadedThumbnail = {
  args: {
    src: '/assets/brand/stockfit-login-hero.webp',
    alt: 'StockFit 브랜드 이미지',
  },
};

export const NoImage = {
  args: {
    src: null,
    alt: '이미지가 없는 상품',
  },
};

export const InventoryRowGallery = {
  render: (args) => (
    <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4">
      <LazyThumbnailImage {...args} src="/assets/brand/stockfit-login-hero.webp" alt="상품 A" />
      <LazyThumbnailImage {...args} src={null} alt="상품 B" />
      <LazyThumbnailImage {...args} src="/assets/brand/stockfit-sidebar-logo.webp" alt="상품 C" />
    </div>
  ),
};
