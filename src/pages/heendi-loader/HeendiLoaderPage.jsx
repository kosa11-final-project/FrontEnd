import { LoadingMedia, LottieLoader } from '@/shared/ui';
import { Button } from '@/shared/ui/Button.jsx';

const reference = {
  source: '/animations/heendi-loader-reference.mp4',
  poster: '/animations/heendi-loader-reference-poster.png',
};

export default function HeendiLoaderPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-10 text-[color:var(--foreground)] sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-2 text-[length:var(--font-size-overline)] font-[var(--font-weight-bold)] uppercase tracking-[0.2em] text-[color:var(--primary)]">
            LOADING MOTION REFERENCE
          </p>
          <h1 className="text-[length:var(--font-size-headline1)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
            흰디 로딩 모션 레퍼런스
          </h1>
          <p className="mt-3 max-w-3xl text-[length:var(--font-size-body)] text-[color:var(--text-body)]">
            제공된 MP4를 로딩 화면 후보로 확인하는 비교용 화면입니다. 이 파일은 H.264 영상이므로 Lottie JSON으로 직접
            변환한 것이 아니라, 웹 video 요소로 재생합니다.
          </p>
        </header>

        <section
          className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]"
          aria-label="흰디 로딩 영상"
        >
          <div className="aspect-video bg-[var(--surface-subtle)]">
            <LoadingMedia
              src={reference.source}
              poster={reference.poster}
              label="흰디가 선물을 들고 이동하는 로딩 영상"
              controls
            />
          </div>
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[length:var(--font-size-subtitle1)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
                MP4 reference
              </h2>
              <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
                4.43초 · 1280×720 · 무음 웹용 복사본
              </p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <a href={reference.source} download>
                MP4 다운로드
              </a>
            </Button>
          </div>
        </section>

        <section
          className="mt-5 flex flex-col gap-5 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between"
          aria-label="Lottie 로딩 스피너"
        >
          <div>
            <h2 className="text-[length:var(--font-size-subtitle1)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
              Lottie spinner
            </h2>
            <p className="mt-1 max-w-2xl text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
              작은 로딩 영역에는 투명 배경 벡터 스피너를 사용합니다. Dashboard Filter Foundations 색상 슬롯을 바꿔
              재사용할 수 있습니다.
            </p>
          </div>
          <LottieLoader size={112} label="재고 데이터를 불러오는 중입니다." />
        </section>

        <aside className="mt-5 rounded-[var(--radius-control)] border border-[var(--info-soft)] bg-[var(--info-soft)] px-4 py-3 text-[length:var(--font-size-body-sm)] text-[color:var(--text-body)]">
          원본 MP4는 캐릭터 모션을 확인하는 레퍼런스로 보관하고, 투명 배경·색상 교체·파일 크기 최적화가 필요한 공통
          로딩에는 별도로 재구성한 Lottie 스피너를 사용합니다. 캐릭터가 포함된 동일한 모션을 Lottie로 만들려면 추후 벡터
          캐릭터 작업이 필요합니다.
        </aside>
      </div>
    </main>
  );
}
