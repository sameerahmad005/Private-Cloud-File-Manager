import React, { useState, useEffect } from 'react';
import { Save, Loader2, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { marked } from 'marked';
import { NoteItem } from '../../types';
import { notesApi } from '../../services/api';

interface NotesEditorProps {
  note: NoteItem | null;
  onBack: () => void;
  onSaved: () => void;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  note,
  onBack,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('split');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('Untitled Note');
      setContent('# New Note\n\nWrite your thoughts or documentation here...\n');
    }
  }, [note]);

  const handleSave = async () => {
    if (!title.trim()) return;

    try {
      setSaving(true);
      if (note && note.id) {
        await notesApi.updateNote(note.id, title.trim(), content);
      } else {
        await notesApi.createNote(title.trim(), content);
      }
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3.5 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              className="font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-none focus:outline-none focus:ring-0 text-base sm:text-lg max-w-xs sm:max-w-md"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {savedToast && (
            <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium mr-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved!</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="hidden sm:flex items-center bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeTab === 'write'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeTab === 'split'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Preview
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Editor & Preview Body */}
      <div className="flex-1 flex overflow-hidden">
        {(activeTab === 'write' || activeTab === 'split') && (
          <div className={`flex-1 flex flex-col p-4 ${activeTab === 'split' ? 'border-r border-slate-200 dark:border-slate-800' : ''}`}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type Markdown content here..."
              className="w-full h-full bg-transparent text-slate-900 dark:text-slate-100 font-mono text-sm resize-none focus:outline-none scrollbar-thin"
            />
          </div>
        )}

        {(activeTab === 'preview' || activeTab === 'split') && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50 prose dark:prose-invert text-sm max-w-none scrollbar-thin">
            <div
              dangerouslySetInnerHTML={{
                __html: marked.parse(content || ''),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
