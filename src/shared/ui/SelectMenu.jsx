import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, TickCircle } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { Icon } from './Icon.jsx';

export function SelectMenu({
  value,
  onValueChange,
  options,
  placeholder,
  'aria-label': ariaLabel,
  className,
  contentClassName,
  disabled = false,
}) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-xs font-semibold text-gray-700 outline-none transition-colors',
          'hover:bg-white focus:border-[#27B06E] focus:ring-2 focus:ring-[#27B06E]/20',
          'disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-[#27B06E] data-[state=open]:bg-white data-[state=open]:ring-2 data-[state=open]:ring-[#27B06E]/20',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption?.icon ? (
            <Icon
              icon={selectedOption.icon}
              size={15}
              className="shrink-0 text-[color:var(--primary)]"
              aria-hidden="true"
            />
          ) : null}
          <SelectPrimitive.Value placeholder={placeholder}>{selectedOption?.label}</SelectPrimitive.Value>
        </span>
        <SelectPrimitive.Icon asChild>
          <Icon icon={ChevronDown} size={15} className="shrink-0 text-gray-400" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            'z-50 max-h-[320px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-1 shadow-lg',
            'data-[state=closed]:animate-out data-[state=open]:animate-in',
            contentClassName,
          )}
        >
          <SelectPrimitive.Viewport className="max-h-[312px] overflow-y-auto">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  'relative flex min-h-9 cursor-default select-none items-center rounded-md py-2 pl-8 pr-2 text-xs font-medium text-gray-700 outline-none',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-[#F0FDF4] data-[highlighted]:text-[#166534]',
                )}
              >
                <span className="absolute left-2 grid size-4 place-items-center">
                  <SelectPrimitive.ItemIndicator>
                    <Icon icon={TickCircle} size={14} className="text-[#27B06E]" aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <span className="flex min-w-0 items-center gap-2.5">
                  {option.icon ? (
                    <Icon
                      icon={option.icon}
                      size={15}
                      className="shrink-0 text-[color:var(--text-muted)]"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="min-w-0">
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                    {option.description ? (
                      <span className="mt-0.5 block truncate text-[10px] font-normal text-[color:var(--text-muted)]">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </span>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
