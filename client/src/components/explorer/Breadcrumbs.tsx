import React from 'react';
import { ChevronRight, HardDrive } from 'lucide-react';

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate }) => {
  return (
    <nav className="flex items-center space-x-1 text-sm font-medium text-slate-600 dark:text-slate-300 overflow-x-auto py-1 scrollbar-none">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isRoot = index === 0;

        return (
          <React.Fragment key={item.id}>
            {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mx-0.5" />}
            <button
              onClick={() => onNavigate(item.id)}
              disabled={isLast}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                isLast
                  ? 'font-semibold text-slate-900 dark:text-slate-100 bg-slate-200/60 dark:bg-slate-800/60 cursor-default'
                  : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {isRoot && <HardDrive className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
              <span>{item.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
