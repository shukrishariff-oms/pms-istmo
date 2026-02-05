import { useState, useEffect } from 'react';
import { Plus, StickyNote, Trash2, Edit3, Clock, Search, X } from 'lucide-react';
import * as noteService from '../services/noteService';

export default function NotesPage() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState({ title: '', content: '' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const data = await noteService.getNotes();
            setNotes(data);
        } catch (err) {
            console.error("Failed to load notes", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await noteService.updateNote(editingId, currentNote);
            } else {
                await noteService.createNote(currentNote);
            }
            setIsModalOpen(false);
            setCurrentNote({ title: '', content: '' });
            setEditingId(null);
            loadNotes();
        } catch (err) {
            console.error("Failed to save note", err);
        }
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

    const openEdit = (note) => {
        setCurrentNote({ title: note.title, content: note.content });
        setEditingId(note.id);
        setIsModalOpen(true);
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Personal & Shared Notes</h1>
                    <p className="text-slate-500">Keep track of your thoughts and reminders.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setCurrentNote({ title: '', content: '' });
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm self-start"
                >
                    <Plus size={18} />
                    New Note
                </button>
            </header>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search your notes..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotes.map(note => (
                        <div key={note.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden">
                            <div className="p-5 flex-1">
                                <div className="flex items-start justify-between mb-3 border-b border-slate-50 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <StickyNote size={18} />
                                        </div>
                                        <h3 className="font-bold text-slate-900 line-clamp-1">{note.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(note)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(note.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm whitespace-pre-wrap line-clamp-6 leading-relaxed">
                                    {note.content}
                                </p>
                            </div>
                            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <Clock size={12} />
                                    {new Date(note.created_at).toLocaleDateString()}
                                </div>
                                {note.author && (
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                                        By {note.author.full_name || note.author.username}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredNotes.length === 0 && !loading && (
                <div className="p-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <StickyNote className="mx-auto text-slate-200 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-slate-400">No notes found</h2>
                    <p className="text-slate-400 mt-1">Start by creating your first note above.</p>
                </div>
            )}

            {/* Note Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                {editingId ? <Edit3 size={20} className="text-blue-600" /> : <Plus size={20} className="text-blue-600" />}
                                {editingId ? 'Edit Note' : 'Create New Note'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Title</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900"
                                    placeholder="Note Heading..."
                                    value={currentNote.title}
                                    onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Content</label>
                                <textarea
                                    required
                                    rows={6}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 resize-none font-medium"
                                    placeholder="What's on your mind?..."
                                    value={currentNote.content}
                                    onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                                >
                                    {editingId ? 'Update Note' : 'Save Note'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
