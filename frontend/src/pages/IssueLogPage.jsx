import { useState, useEffect } from 'react';
import issueService from '../services/issueService';
import { getProjects } from '../services/projects';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Trash2,
    MessageSquare,
    ChevronRight,
    Tag,
    User,
    Flag
} from 'lucide-react';
import clsx from 'clsx';

const StatusConfig = {
    open: { label: 'Open', color: 'bg-red-50 text-red-600 border-red-200' },
    in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    closed: { label: 'Closed', color: 'bg-slate-100 text-slate-500 border-slate-300' }
};

const PriorityConfig = {
    low: { label: 'Low', color: 'text-slate-500' },
    medium: { label: 'Medium', color: 'text-blue-600 font-bold' },
    high: { label: 'High', color: 'text-amber-600 font-bold' },
    critical: { label: 'Critical', color: 'text-red-600 font-black animate-pulse' }
};

const CategoryConfig = ["Bug", "Feature Request", "Support", "General"];

export default function IssueLogPage() {
    const [issues, setIssues] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [filter, setFilter] = useState({ status: '', priority: '' });
    const [searchQuery, setSearchQuery] = useState('');

    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'Bug',
        priority: 'medium',
        project_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [issueData, projectData] = await Promise.all([
                issueService.getIssues(),
                getProjects()
            ]);
            setIssues(issueData);
            setProjects(projectData);
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit() {
        if (!form.title || !form.description) return;
        try {
            if (selectedIssue) {
                await issueService.updateIssue(selectedIssue.id, form);
            } else {
                await issueService.createIssue({
                    ...form,
                    project_id: form.project_id ? parseInt(form.project_id) : null
                });
            }
            setIsModalOpen(false);
            resetForm();
            loadData();
        } catch (err) {
            alert("Error saving issue: " + err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Delete this issue record?")) return;
        try {
            await issueService.deleteIssue(id);
            loadData();
        } catch (err) {
            alert("Only admins can delete issues.");
        }
    }

    function resetForm() {
        setForm({ title: '', description: '', category: 'Bug', priority: 'medium', project_id: '' });
        setSelectedIssue(null);
    }

    const filteredIssues = issues.filter(issue => {
        const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !filter.status || issue.status === filter.status;
        const matchesPriority = !filter.priority || issue.priority === filter.priority;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    if (loading) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Issue Log</h1>
                    <p className="text-slate-500 text-sm">Track bug reports, feature requests and support sessions.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} /> Log New Issue
                </button>
            </div>

            {/* Filters Area */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="w-full pl-10 pr-4 py-2 text-sm border-none bg-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        placeholder="Search issues by keyword..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        className="text-xs font-bold border-none bg-slate-50 p-2 rounded-lg outline-none"
                        value={filter.status}
                        onChange={e => setFilter({ ...filter, status: e.target.value })}
                    >
                        <option value="">All Statuses</option>
                        {Object.keys(StatusConfig).map(s => <option key={s} value={s}>{StatusConfig[s].label}</option>)}
                    </select>
                    <select
                        className="text-xs font-bold border-none bg-slate-50 p-2 rounded-lg outline-none"
                        value={filter.priority}
                        onChange={e => setFilter({ ...filter, priority: e.target.value })}
                    >
                        <option value="">All Priorities</option>
                        {Object.keys(PriorityConfig).map(p => <option key={p} value={p}>{PriorityConfig[p].label}</option>)}
                    </select>
                </div>
            </div>

            {/* Issues Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredIssues.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <MessageSquare size={48} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No issues found</p>
                    </div>
                ) : (
                    filteredIssues.map(issue => (
                        <div key={issue.id} className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-400 transition-all hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden">
                            <div className={clsx("absolute top-0 left-0 w-1.5 h-full",
                                issue.status === 'resolved' ? 'bg-emerald-400' :
                                    issue.priority === 'critical' ? 'bg-red-500' : 'bg-slate-200'
                            )}></div>

                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", StatusConfig[issue.status].color)}>
                                            {StatusConfig[issue.status].label}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">#ISSUE-{issue.id}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{issue.title}</h3>
                                    <p className="text-sm text-slate-600 line-clamp-2 max-w-2xl">{issue.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 text-xs">
                                        <Flag size={14} className={PriorityConfig[issue.priority].color} />
                                        <span className={clsx("uppercase tracking-widest", PriorityConfig[issue.priority].color)}>{PriorityConfig[issue.priority].label}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Reporter</p>
                                            <p className="text-xs font-bold text-slate-700">{issue.reporter?.full_name || 'System User'}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                            <User size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Tag size={14} className="text-blue-500" />
                                        <span className="font-bold">{issue.category}</span>
                                    </div>
                                    {issue.project && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <CheckCircle2 size={14} className="text-indigo-500" />
                                            <span className="font-bold">{issue.project.code}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Clock size={14} />
                                        <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setSelectedIssue(issue); setForm(issue); setIsModalOpen(true); }}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(issue.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-[600px] border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                                <AlertCircle className="text-blue-600" />
                                {selectedIssue ? 'Update Issue Report' : 'Log New Support Request'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <ChevronRight className="rotate-90" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Issue Title / Headline</label>
                                <input
                                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                    placeholder="Briefly describe the issue..."
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                                    <select
                                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm outline-none font-bold cursor-pointer"
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                    >
                                        {CategoryConfig.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Priority Level</label>
                                    <select
                                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm outline-none font-bold cursor-pointer"
                                        value={form.priority}
                                        onChange={e => setForm({ ...form, priority: e.target.value })}
                                    >
                                        {Object.keys(PriorityConfig).map(p => <option key={p} value={p}>{PriorityConfig[p].label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {selectedIssue && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Current Status</label>
                                    <select
                                        className="w-full bg-blue-50 text-blue-700 border-none rounded-xl p-3 text-sm outline-none font-black cursor-pointer"
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                    >
                                        {Object.keys(StatusConfig).map(s => <option key={s} value={s}>{StatusConfig[s].label}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Related Project (Optional)</label>
                                <select
                                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm outline-none font-bold cursor-pointer"
                                    value={form.project_id}
                                    onChange={e => setForm({ ...form, project_id: e.target.value })}
                                >
                                    <option value="">General / System-wide</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Detailed Description</label>
                                <textarea
                                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm outline-none h-32 focus:ring-2 focus:ring-blue-500 font-medium"
                                    placeholder="Explain the steps to reproduce or provide more context..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-10 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                            >
                                {selectedIssue ? 'Save Changes' : 'Record Issue'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
