import { useEffect, useId, useState } from 'react';
import { Bookmark, CloseCircle } from 'reicon-react';
import { formatFilterSummary, useFilterPresetStore } from '../model/filterPresetStore.js';

export function SaveFilterPresetDialog({ open, filters, onClose, onSaveSuccess }) {
  if (!open) return null;
  return <SaveFilterPresetModalContent filters={filters} onClose={onClose} onSaveSuccess={onSaveSuccess} />;
}

function SaveFilterPresetModalContent({ filters, onClose, onSaveSuccess }) {
  const inputId = useId();
  const filterSummary = formatFilterSummary(filters);
  const [presetName, setPresetName] = useState(() => (filterSummary !== '전체 조건' ? filterSummary : ''));
  const savePreset = useFilterPresetStore((state) => state.savePreset);

  // ESC 키 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalName = presetName.trim() || filterSummary;
    const saved = savePreset(finalName, filters);
    if (saved) {
      onSaveSuccess?.(saved);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-preset-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl transition-all">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Bookmark size={16} />
            </span>
            <h3 id="save-preset-dialog-title" className="text-base font-bold text-gray-900">
              현재 필터 조건 저장
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <CloseCircle size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 현재 조건 요약 미리보기 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">저장할 필터 조건 요약</label>
            <div className="rounded-lg bg-gray-50 p-2.5 text-xs text-gray-700 font-medium border border-gray-100 leading-relaxed">
              {filterSummary}
            </div>
          </div>

          {/* 저장 필터 이름 입력 */}
          <div>
            <label htmlFor={inputId} className="block text-xs font-bold text-gray-800 mb-1.5">
              저장 필터 이름 <span className="text-emerald-600">*</span>
            </label>
            <input
              id={inputId}
              type="text"
              required
              maxLength={40}
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="예: 매일 아침 냉동 결품 모니터링"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-gray-400">
              저장된 필터 조합을 한 번의 클릭으로 바로 불러올 수 있습니다.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--primary-strong)] shadow-xs transition-colors"
            >
              필터 조합 저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
