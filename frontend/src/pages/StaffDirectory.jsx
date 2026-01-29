import { useState, useEffect } from 'react';
import { Users, Search, Briefcase, ListTodo, FileText, CheckCircle2 } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : "";

export default function StaffDirectory() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setStats(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredStats = stats.filter(s =>
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.username?.toLowerCase().includes(search.toLowerCase()) ||
        s.department?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Staff & Workload Directory</h1>
                    <p className="text-slate-500">Monitor team capacity across the department.</p>
                </div>
            </header>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search staff by name, username or department..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Directory Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Staff Member</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Active Projects</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Pending Tasks</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Docs Held</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Workload</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStats.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            {s.full_name ? s.full_name[0] : 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{s.full_name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">@{s.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 uppercase">
                                    {s.department}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm">
                                        <Briefcase size={14} />
                                        {s.stats.active_projects}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-sm ${s.stats.pending_tasks > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-400'
                                        }`}>
                                        <ListTodo size={14} />
                                        {s.stats.pending_tasks}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-sm ${s.stats.held_documents > 0 ? 'bg-purple-50 text-purple-700' : 'bg-slate-50 text-slate-400'
                                        }`}>
                                        <FileText size={14} />
                                        {s.stats.held_documents}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.stats.active_projects + s.stats.pending_tasks > 8 ? 'bg-red-100 text-red-700' :
                                        s.stats.active_projects + s.stats.pending_tasks > 0 ? 'bg-emerald-50 text-emerald-700' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                        {s.stats.active_projects + s.stats.pending_tasks > 8 ? 'Overloaded' :
                                            s.stats.active_projects + s.stats.pending_tasks > 0 ? 'Optimal' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredStats.length === 0 && (
                    <div className="p-12 text-center bg-slate-50/30">
                        <Users className="mx-auto text-slate-200 mb-2" size={40} />
                        <p className="text-slate-500 font-medium">No team members found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
