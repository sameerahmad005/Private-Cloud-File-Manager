import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Settings as SettingsIcon, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccountDropdownProps {
  onNavigateSettings: () => void;
}

export const AccountDropdown: React.FC<AccountDropdownProps> = ({ onNavigateSettings }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  };

  const toggleMenu = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => updatePosition();
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('.account-dropdown-portal')
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const dropdownPortal = isOpen
    ? ReactDOM.createPortal(
        <div
          className="account-dropdown-portal fixed w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 text-xs text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${coords.top}px`,
            right: `${coords.right}px`,
            zIndex: 99999,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{user?.username || 'Administrator'}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'Admin'} Account</p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              onNavigateSettings();
            }}
            className="w-full flex items-center space-x-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <SettingsIcon className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full flex items-center space-x-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="User Account Menu"
        className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
          {user?.username?.charAt(0).toUpperCase() || 'A'}
        </div>
        <span className="hidden sm:inline font-medium text-xs text-slate-700 dark:text-slate-200">
          {user?.username || 'Admin'}
        </span>
      </button>
      {dropdownPortal}
    </>
  );
};
