import { useState, useEffect } from 'react';
import {
    Plus,
    StickyNote,
    Trash2,
    Edit3,
    Clock,
    Search,
    X,
    Pin,
    PinOff,
    Copy,
    Check,
    Palette,
    Bell,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Circle
} from 'lucide-react';
import * as noteService from '../services/noteService';
import clsx from 'clsx';

const COLORS = [
    { name: 'Default', hex: '#ffffff', bg: 'bg-white', border: 'border-slate-200' },
    { name: 'Red', hex: '#fef2f2', bg: 'bg-red-50', border: 'border-red-200' },
    { name: 'Amber', hex: '#fffbeb', bg: 'bg-amber-50', border: 'border-amber-200' },
    { name: 'Emerald', hex: '#ecfdf5', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { name: 'Blue', hex: '#eff6ff', bg: 'bg-blue-50', border: 'border-blue-200' },
    { name: 'Indigo', hex: '#eef2ff', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { name: 'Purple', hex: '#faf5ff', bg: 'bg-purple-50', border: 'border-purple-200' },
    { name: 'Rose', hex: '#fff1f2', bg: 'bg-rose-50', border: 'border-rose-200' },
];

export default function NotesPage() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState({
        title: '',
        content: '',
        color: '#ffffff',
        is_pinned: false,
        reminder_date: '',
        is_completed: false
    });
    const [editingId, setEditingId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const data = await noteService.getNotes();
            const sortedData = data.sort((a, b) => {
                // Completed notes go to bottom
                if (a.is_completed !== b.is_completed) {
                    return a.is_completed ? 1 : -1;
                }
                if (a.is_pinned !== b.is_pinned) {
                    return a.is_pinned ? -1 : 1;
                }
                return new Date(b.created_at) - new Date(a.created_at);
            });
            setNotes(sortedData);
        } catch (err) {
            console.error("Failed to load notes", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const noteToSave = {
                ...currentNote,
                reminder_date: currentNote.reminder_date || null
            };

            if (editingId) {
                await noteService.updateNote(editingId, noteToSave);
            } else {
                await noteService.createNote(noteToSave);
            }
            setIsModalOpen(false);
            resetForm();
            loadNotes();
        } catch (err) {
            console.error("Failed to save note", err);
        }
    };

    const resetForm = () => {
        setCurrentNote({ title: '', content: '', color: '#ffffff', is_pinned: false, reminder_date: '', is_completed: false });
        setEditingId(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        try {
            await noteService.deleteNote(id);
            loadNotes();
        } catch (err) {
            console.error("Failed to delete note", err);
        }
    };

    const togglePin = async (note) => {
        try {
            await noteService.updateNote(note.id, { is_pinned: !note.is_pinned });
            loadNotes();
        } catch (err) {
            console.error("Failed to toggle pin", err);
        }
    };

    const toggleComplete = async (note) => {
        try {
            await noteService.updateNote(note.id, { is_completed: !note.is_completed });
            loadNotes();
        } catch (err) {
            console.error("Failed to toggle completion", err);
        }
    };

    const copyToClipboard = (note) => {
        navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
        setCopiedId(note.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const openEdit = (note) => {
        setCurrentNote({
            title: note.title,
            content: note.content,
            color: note.color || '#ffffff',
            is_pinned: note.is_pinned || false,
            reminder_date: note.reminder_date ? new Date(note.reminder_date).toISOString().slice(0, 16) : '',
            is_completed: note.is_completed || false
        });
        setEditingId(note.id);
        setIsModalOpen(true);
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    );

    const pinnedNotes = filteredNotes.filter(n => n.is_pinned && !n.is_completed);
    const activeNotes = filteredNotes.filter(n => !n.is_pinned && !n.is_completed);
    const completedNotes = filteredNotes.filter(n => n.is_completed);

    const NoteCard = ({ note }) => {
        const colorOption = COLORS.find(c => c.hex === note.color) || COLORS[0];
        const isReminderDue = note.reminder_date && new Date(note.reminder_date) < new Date() && !note.is_completed;

        return (
            <div
                className={clsx(
                    "group break-inside-avoid mb-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden",
                    note.is_completed ? "bg-slate-50 border-slate-200 grayscale-[0.5] opacity-75" : colorOption.bg,
                    colorOption.border,
                    note.is_pinned && !note.is_completed ? "ring-2 ring-blue-500/20 shadow-md" : "shadow-sm"
                )}
            >
                <div className={clsx("h-1.5 w-full transition-colors", note.is_completed ? "bg-slate-300" : (note.is_pinned ? "bg-blue-500" : "bg-transparent"))} />

                <div className="p-5">
                    <div className="flex items-start justify-between mb-3 gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleComplete(note); }}
                            className={clsx(
                                "mt-1 shrink-0 transition-all active:scale-90",
                                note.is_completed ? "text-emerald-500" : "text-slate-300 hover:text-blue-500"
                            )}
                        >
                            {note.is_completed ? <CheckCircle2 size={22} className="fill-emerald-50" /> : <Circle size={22} />}
                        </button>

                        <h3 className={clsx(
                            "font-bold leading-tight text-lg flex-1 transition-all",
                            note.is_completed ? "text-slate-400 line-through decoration-slate-300" : "text-slate-900 group-hover:text-blue-700"
                        )}>
                            {note.title}
                        </h3>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            {!note.is_completed && (
                                <button
                                    onClick={() => togglePin(note)}
                                    className={clsx(
                                        "p-1.5 rounded-lg transition-colors",
                                        note.is_pinned ? "text-blue-600 bg-blue-100" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                    )}
                                >
                                    {note.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                                </button>
                            )}
                            <button onClick={() => copyToClipboard(note)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                {copiedId === note.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                            </button>
                            <button onClick={() => openEdit(note)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Edit3 size={16} />
                            </button>
                            <button onClick={() => handleDelete(note.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <p className={clsx(
                        "text-sm whitespace-pre-wrap leading-relaxed mb-4 transition-colors",
                        note.is_completed ? "text-slate-400 line-through decoration-slate-200" : "text-slate-700"
                    )}>
                        {note.content}
                    </p>

                    {note.reminder_date && !note.is_completed && (
                        <div className={clsx(
                            "mb-4 py-2 px-3 rounded-xl flex items-center gap-2 text-xs font-bold",
                            isReminderDue ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-100/50 text-blue-600"
                        )}>
                            <Bell size={14} className={isReminderDue ? "fill-red-600" : ""} />
                            <span>
                                {isReminderDue ? "Due: " : "Reminder: "}
                                {new Date(note.reminder_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                            {isReminderDue && <AlertCircle size={14} />}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-black/5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {note.is_completed ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Clock size={12} />}
                            {note.is_completed ? "Completed" : new Date(note.created_at).toLocaleDateString()}
                        </div>
                        {note.author && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase opacity-60">
                                    {note.author.full_name || note.author.username}
                                </span>
                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                                    {(note.author.full_name || note.author.username)[0]}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
                            <StickyNote size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Notes</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">Collaborate, remember, and organize your daily work thoughts.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Find a specific note..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700 shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40 active:scale-95 flex items-center gap-2 text-sm uppercase tracking-wider"
                    >
                        <Plus size={20} className="stroke-[3]" />
                        Create
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-600/20 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing notes...</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Pinned Section */}
                    {pinnedNotes.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                <Pin size={14} className="text-blue-500" />
                                Pinned Notes
                            </h2>
                            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                                {pinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
                            </div>
                        </section>
                    )}

                    {/* Active Section */}
                    <section className="space-y-4">
                        {pinnedNotes.length > 0 && <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Recent Notes</h2>}
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                            {activeNotes.map(note => <NoteCard key={note.id} note={note} />)}
                        </div>
                    </section>

                    {/* Completed Section */}
                    {completedNotes.length > 0 && (
                        <section className="space-y-4 pt-10 border-t border-slate-100">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                                Completed Tasks
                                <span className="ml-auto text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{completedNotes.length}</span>
                            </h2>
                            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                                {completedNotes.map(note => <NoteCard key={note.id} note={note} />)}
                            </div>
                        </section>
                    )}

                    {filteredNotes.length === 0 && (
                        <div className="p-20 text-center bg-white/50 rounded-[2.5rem] border-4 border-dashed border-slate-200/60 backdrop-blur-sm">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <StickyNote className="text-slate-300" size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-400 tracking-tight">No match found</h2>
                            <p className="text-slate-400 font-medium mt-2">Try searching with different keywords or create a new note.</p>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-8 py-6 bg-slate-50/50 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    {editingId ? <Edit3 size={20} /> : <Plus size={20} />}
                                </div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                    {editingId ? 'Edit Your Note' : 'Capture New Idea'}
                                </h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-slate-200 rounded-xl transition-all active:scale-90">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Note Title</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 text-lg placeholder:text-slate-300"
                                    placeholder="Enter a punchy title..."
                                    value={currentNote.title}
                                    onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Note Content</label>
                                <textarea
                                    required
                                    rows={5}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 resize-none font-medium placeholder:text-slate-300 leading-relaxed"
                                    placeholder="Spill your brilliant thoughts here..."
                                    value={currentNote.content}
                                    onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 ml-1">
                                        <Palette size={14} className="text-slate-400" />
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Theme Color</label>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map(color => (
                                            <button
                                                key={color.hex}
                                                type="button"
                                                onClick={() => setCurrentNote({ ...currentNote, color: color.hex })}
                                                className={clsx(
                                                    "w-8 h-8 rounded-lg border-2 transition-all",
                                                    currentNote.color === color.hex ? "border-blue-500 scale-110 shadow-lg" : "border-transparent"
                                                )}
                                                style={{ backgroundColor: color.hex }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 ml-1">
                                        <Calendar size={14} className="text-slate-400" />
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Set Reminder</label>
                                    </div>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 text-sm"
                                        value={currentNote.reminder_date}
                                        onChange={(e) => setCurrentNote({ ...currentNote, reminder_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-emerald-200 transition-all group">
                                <button
                                    type="button"
                                    onClick={() => setCurrentNote({ ...currentNote, is_completed: !currentNote.is_completed })}
                                    className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        currentNote.is_completed ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white border-2 border-slate-200 text-slate-300"
                                    )}
                                >
                                    {currentNote.is_completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </button>
                                <div>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Mark as Done</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Toggle if this task note is finished.</p>
                                </div>
                            </div>
                        </form>

                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-4 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm uppercase tracking-wide"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!currentNote.title || !currentNote.content}
                                type="button"
                                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95 text-sm uppercase tracking-widest disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {editingId ? 'Keep Changes' : 'Confirm & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`.break-inside-avoid { break-inside: avoid; }`}</style>
        </div>
    );
}
