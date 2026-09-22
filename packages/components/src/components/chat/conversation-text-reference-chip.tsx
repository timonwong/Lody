'use client';

import { Quote, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { truncateCommentBody } from '@lody/shared';
import { cn } from '@/lib/utils';

export interface ConversationTextReferenceChipItem {
  localId: string;
  text: string;
}

type ConversationTextReferenceChipProps = {
  item: ConversationTextReferenceChipItem;
  onRemove?: (localId: string) => void;
  revealRemoveOnClick?: boolean;
  className?: string;
};

export function ConversationTextReferenceChip({
  item,
  onRemove,
  revealRemoveOnClick = false,
  className,
}: ConversationTextReferenceChipProps) {
  const { t } = useTranslation();
  const [removeVisible, setRemoveVisible] = useState(false);
  const preview = truncateCommentBody(item.text.replace(/\s+/g, ' ').trim(), 72);

  return (
    <div
      data-conversation-text-ref
      className={cn(
        'group/conversation-text-ref relative flex max-w-72 flex-col gap-0.5 rounded-lg border',
        'bg-muted/50 px-2.5 py-1.5 text-xs',
        className
      )}
      onClick={revealRemoveOnClick && onRemove ? () => setRemoveVisible(true) : undefined}
      title={item.text}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Quote className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="truncate font-medium">
          {t('sessions.selectedTextReference', 'Selected text')}
        </span>
        {onRemove ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(item.localId);
            }}
            className={cn(
              'ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-xs',
              'text-muted-foreground/60 hover:bg-muted-foreground/20 hover:text-muted-foreground',
              'transition-opacity group-hover/conversation-text-ref:opacity-100',
              removeVisible || !revealRemoveOnClick ? 'opacity-100' : 'opacity-0',
              'focus-visible:opacity-100'
            )}
            aria-label={t('sessions.removeSelectedTextReference', 'Remove selected text')}
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className="truncate text-foreground/70">&ldquo;{preview}&rdquo;</div>
    </div>
  );
}
