import { useEffect } from 'react';

export function isEditableElement(element: Element | null): boolean {
  if (!element) return false;
  const tagName = element.tagName;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) return true;
  if ('isContentEditable' in element && (element as HTMLElement).isContentEditable) return true;
  if (element.closest('[contenteditable="true"]')) return true;
  if (element.closest('.monaco-editor, .cm-editor, .md-editor, [role="textbox"]')) return true;
  return false;
}

export interface KeyboardShortcutsOptions {
  onSearchFocus?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onDeleteSelected?: () => void;
  onOpenSelected?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable = isEditableElement(target);
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      const isCmdOrCtrl = isMac ? (e.metaKey || e.ctrlKey) : (e.ctrlKey && !e.metaKey);

      // 1. Escape key (always allowed to close overlays/modals)
      if (e.key === 'Escape') {
        if (options.onEscape) {
          options.onEscape();
        }
        return;
      }

      // 2. Ctrl + K / Cmd + K (Global Search Focus)
      if (isCmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (options.onSearchFocus) {
          options.onSearchFocus();
        }
        return;
      }

      // If user is currently typing inside an input/textarea/editor, do NOT intercept Ctrl+A, Delete, Enter
      if (isEditable) {
        return;
      }

      // 3. Ctrl + Shift + A / Cmd + Shift + A (Deselect All)
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (options.onDeselectAll) {
          options.onDeselectAll();
        }
        return;
      }

      // 4. Ctrl + A / Cmd + A (Select All Files)
      if (isCmdOrCtrl && !e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (options.onSelectAll) {
          options.onSelectAll();
        }
        return;
      }

      // 5. Delete (Delete Selected Items)
      if (e.key === 'Delete') {
        if (options.onDeleteSelected) {
          e.preventDefault();
          options.onDeleteSelected();
        }
        return;
      }

      // 6. Enter (Open Selected Item)
      if (e.key === 'Enter') {
        if (options.onOpenSelected) {
          e.preventDefault();
          options.onOpenSelected();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
