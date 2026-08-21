import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, Edit3, Loader2 } from 'lucide-react';
import { notesApi } from '../services/api';
import { NoteItem } from '../types';
import { NotesEditor } from '../components/notes/NotesEditor';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';

interface NotesPageProps {
  initialEditNote?: NoteItem | null;
}

export const NotesPage: React.FC<NotesPageProps> = ({ initialEditNote }) => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState<NoteItem | null | undefined>(initialEditNote);
  const [isEditing, setIsEditing] = useState<boolean>(!!initialEditNote);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await notesApi.listNotes();
      if (res.success && res.data) {
        setNotes(res.data);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setActiveNote(null);
    setIsEditing(true);
  };

  const handleEditNote = (note: NoteItem) => {
    setActiveNote(note);
    setIsEditing(true);
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await notesApi.deleteNote(noteId);
      fetchNotes();
    } catch {
      alert('Failed to delete note.');
    }
  };

  if (isEditing) {
    return (
      <NotesEditor
        note={activeNote || null}
        onBack={() => setIsEditing(false)}
        onSaved={() => {
          fetchNotes();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
        <div className="flex items-center space-x-3">
          <StickyNote className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Notes & Markdown</h2>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {loading ? (
        <SkeletonLoader viewMode="grid" count={6} />
      ) : notes.length === 0 ? (
        <EmptyState
          title="No notes created yet"
          description="Create Markdown notes stored securely directly in your Google Drive."
          onUpload={handleCreateNew}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleEditNote(note)}
              className="group relative flex flex-col justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/50 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                    <StickyNote className="w-5 h-5" />
                  </span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteNote(e, note.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {note.title}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mt-1.5 font-mono">
                  {note.content.replace(/[#\*_`]/g, '') || 'Empty note content'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Updated {new Date(note.modifiedTime).toLocaleDateString()}</span>
                <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
