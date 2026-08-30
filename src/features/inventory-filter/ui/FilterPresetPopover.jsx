import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Bookmark, ChevronDown, Clock, CloseCircle, Trash } from 'reicon-react';
import { useFilterPresetStore } from '../model/filterPresetStore.js';

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function FilterPresetPopover({ onApplyPreset }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('saved');

  const { recentFilters, savedPresets, removeRecentFilter, clearRecentFilters, removeSavedPreset } =
    useFilterPresetStore();

  const handleSelect = (filters) => {
    onApplyPreset(filters);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="저장된 필터 및 최근 검색 기록 보기"
          aria-expanded={open}
          className="flex h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 data-[state=open]:border-emerald-500 data-[state=open]:bg-emerald-50/40 transition-colors shrink-0"
        >
          <Bookmark size={14} className="text-emerald-600" />
          <span>최근/저장 필터</span>
          <ChevronDown
            size={13}
            className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180 text-emerald-600' : ''}`}
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 w-[420px] max-w-[calc(100vw-32px)] rounded-xl border border-gray-200 bg-white p-0 shadow-xl outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {/* 상단 탭 헤더 */}
          <div
            role="tablist"
            aria-label="필터 프리셋 구분"
            className="flex border-b border-gray-100 bg-gray-50/70 p-1.5 rounded-t-xl gap-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'saved'}
              onClick={() => setActiveTab('saved')}
              className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'saved'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
              }`}
            >
              <Bookmark size={13} className={activeTab === 'saved' ? 'text-emerald-600' : 'text-gray-400'} />
              <span>저장된 필터</span>
              <span className="text-[10px] font-semibold text-gray-400">({savedPresets.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'recent'}
              onClick={() => setActiveTab('recent')}
              className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'recent'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
              }`}
            >
              <Clock size={13} className={activeTab === 'recent' ? 'text-emerald-600' : 'text-gray-400'} />
              <span>최근 검색</span>
              <span className="text-[10px] font-semibold text-gray-400">({recentFilters.length})</span>
            </button>
          </div>

          {/* 본문 콘텐츠 */}
          <div className="max-h-80 overflow-y-auto p-2">
            {activeTab === 'saved' ? (
              savedPresets.length === 0 ? (
                <div className="py-7 text-center">
                  <span className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <Bookmark size={16} />
                  </span>
                  <p className="text-xs font-semibold text-gray-600">저장된 필터가 없습니다</p>
                  <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                    필터 조건 적용 후 아래 '적용된 조건' 행의
                    <br />
                    <span className="font-semibold text-emerald-700">[현재 필터 저장하기]</span>를 눌러보세요.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {savedPresets.map((preset) => (
                    <li
                      key={preset.id}
                      className="group flex items-start justify-between gap-2.5 rounded-lg p-2.5 hover:bg-emerald-50/60 transition-colors border border-transparent hover:border-emerald-100"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(preset.filters)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="text-xs font-bold text-gray-900 group-hover:text-emerald-900 break-words leading-relaxed">
                          {preset.name}
                        </div>
                        {preset.name !== preset.summary && (
                          <div className="text-[11px] text-gray-500 group-hover:text-emerald-800 break-words leading-relaxed mt-1">
                            {preset.summary}
                          </div>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedPreset(preset.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-rose-500 rounded transition-opacity shrink-0 mt-0.5"
                        aria-label={`${preset.name} 프리셋 삭제`}
                      >
                        <CloseCircle size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : recentFilters.length === 0 ? (
              <div className="py-7 text-center">
                <span className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <Clock size={16} />
                </span>
                <p className="text-xs font-semibold text-gray-600">최근 검색 기록이 없습니다</p>
                <p className="mt-1 text-[11px] text-gray-400">검색이나 필터를 적용하면 최대 5개까지 자동 기록됩니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <ul className="space-y-1.5">
                  {recentFilters.map((item) => (
                    <li
                      key={item.id}
                      className="group flex items-start justify-between gap-2.5 rounded-lg p-2.5 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(item.filters)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="text-xs font-semibold text-gray-800 group-hover:text-emerald-900 break-words leading-relaxed">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">{formatRelativeTime(item.timestamp)}</div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentFilter(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-gray-600 rounded transition-opacity shrink-0 mt-0.5"
                        aria-label="최근 검색 기록 삭제"
                      >
                        <CloseCircle size={15} />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    onClick={clearRecentFilters}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-rose-600 px-2 py-1 rounded transition-colors"
                  >
                    <Trash size={12} />
                    <span>최근 검색 전체 삭제</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
