import { createContext, useContext, useId, useMemo, useState } from 'react';
import { cn } from '@/shared/lib/cn';

const AccordionContext = createContext(null);
const AccordionItemContext = createContext(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('Accordion primitives must be used inside Accordion.');
  return context;
}

function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);
  if (!context) throw new Error('AccordionTrigger and AccordionContent must be used inside AccordionItem.');
  return context;
}

export function Accordion({ defaultValue = [], multiple = false, className, children, ...props }) {
  const rootId = useId();
  const [openItems, setOpenItems] = useState(() => new Set(defaultValue));
  const value = useMemo(
    () => ({
      rootId,
      multiple,
      openItems,
      toggleItem(itemValue) {
        setOpenItems((current) => {
          const next = multiple ? new Set(current) : new Set();
          if (current.has(itemValue)) next.delete(itemValue);
          else next.add(itemValue);
          return next;
        });
      },
    }),
    [multiple, openItems, rootId],
  );

  return (
    <AccordionContext.Provider value={value}>
      <div data-slot="accordion" className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value: itemValue, className, children, ...props }) {
  const { rootId, multiple, openItems } = useAccordionContext();
  const itemId = `${rootId}-${itemValue}`;
  const isOpen = openItems.has(itemValue);
  const fillsAvailableSpace = isOpen && multiple && openItems.size > 1;

  return (
    <AccordionItemContext.Provider
      value={{
        itemValue,
        itemId,
        isOpen,
        fillsAvailableSpace,
        triggerId: `${itemId}-trigger`,
        contentId: `${itemId}-content`,
      }}
    >
      <section
        data-slot="accordion-item"
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(
          'min-h-0 min-w-0 flex flex-col border-b border-[var(--border)] last:border-b-0',
          fillsAvailableSpace && 'flex-1',
          className,
        )}
        {...props}
      >
        {children}
      </section>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({ className, children, ...props }) {
  const { toggleItem } = useAccordionContext();
  const { itemValue, isOpen, triggerId, contentId } = useAccordionItemContext();

  return (
    <h3 className="shrink-0">
      <button
        id={triggerId}
        type="button"
        aria-controls={contentId}
        aria-expanded={isOpen}
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(
          'group flex min-h-16 w-full items-center justify-between gap-3 bg-[var(--primary-soft)] px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]',
          className,
        )}
        onClick={() => toggleItem(itemValue)}
        {...props}
      >
        {children}
      </button>
    </h3>
  );
}

export function AccordionContent({ className, children, ...props }) {
  const { isOpen, fillsAvailableSpace, triggerId, contentId } = useAccordionItemContext();

  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      data-slot="accordion-content"
      data-state={isOpen ? 'open' : 'closed'}
      hidden={!isOpen}
      className={cn('min-w-0 overflow-hidden', fillsAvailableSpace && 'min-h-0 flex-1 overflow-y-auto', className)}
      {...props}
    >
      {children}
    </div>
  );
}
