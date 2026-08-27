const NAVER_PRODUCT_IMAGE_HOST = 'shop-phinf.pstatic.net';

/**
 * 상품 목록처럼 작은 영역에 표시하는 이미지의 전송량을 줄입니다.
 * 원본 URL은 상세 라이트박스에서 그대로 사용하고, Naver 상품 이미지만
 * 공식 축소 변형(f100)으로 바꿉니다. 알 수 없는 호스트와 상대/데이터 URL은
 * 원본을 보존해 외부 이미지 동작을 바꾸지 않습니다.
 */
export function getImageThumbnailUrl(src) {
  if (!src || typeof src !== 'string') return src;

  try {
    const url = new URL(src, 'http://localhost');
    if (url.hostname === NAVER_PRODUCT_IMAGE_HOST) {
      url.searchParams.set('type', 'f100');
      return url.toString();
    }
    return src;
  } catch {
    return src;
  }
}
