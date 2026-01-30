import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ListTodo, FileText, TrendingUp, Calendar, ArrowRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getProjects } from '../services/projects';
import clsx from 'clsx';
import { formatDate } from '../utils/dateUtils';

const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : "";

const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className={clsx("p-3 rounded-lg", color)}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
    </div>
);

export default function StaffDashboard() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('full_name') || 'User';
    const userId = localStorage.getItem('user_id');
    const isAdmin = role === 'admin';

    useEffect(() => {
        if (!userId) {
            navigate('/login');
            return;
        }
        loadDashboardData();
    }, [userId]);

    async function loadDashboardData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch Projects
            // If admin, pass null to get all. If staff, pass userId.
            const projectsRes = await getProjects(isAdmin ? null : userId);
            setProjects(projectsRes);

            // Fetch Tasks
            const tasksUrl = isAdmin
                ? `${API_URL}/tasks/assigned`
                : `${API_URL}/tasks/assigned?assignee_id=${userId}`;
            const tasksRes = await fetch(tasksUrl, { headers });
            if (tasksRes.ok) setTasks(await tasksRes.json());

            // Fetch Documents
            const docsUrl = isAdmin
                ? `${API_URL}/documents/`
                : `${API_URL}/documents/?holder=${fullName}`;
            const docsRes = await fetch(docsUrl, { headers });
            if (docsRes.ok) setDocuments(await docsRes.json());

        } catch (err) {
            console.error("Dashboard Load Error:", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isAdmin ? 'System Activity Overview' : `Welcome back, ${fullName}!`}
                    </h1>
                    <p className="text-slate-500">
                        {isAdmin ? 'Monitoring all project activities and document tracking.' : "Here's what's happening with your projects today."}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100">
                    <Calendar size={16} />
                    {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label={isAdmin ? "Total Active Projects" : "Active Projects"}
                    value={projects.length}
                    icon={Briefcase}
                    color="bg-blue-50 text-blue-600"
                />
                <StatCard
                    label={isAdmin ? "System-wide Urgent Tasks" : "Assigned Tasks"}
                    value={tasks.filter(t => t.status !== 'completed').length}
                    icon={ListTodo}
                    color="bg-amber-50 text-amber-600"
                />
                <StatCard
                    label={isAdmin ? "Documents in Transit" : "Documents to Sign"}
                    value={documents.filter(d => d.status !== 'completed').length}
                    icon={FileText}
                    color="bg-purple-50 text-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* My Projects */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <Briefcase size={18} className="text-blue-500" /> {isAdmin ? 'Recent Projects' : 'My Projects'}
                        </h2>
                        <button onClick={() => navigate('/workspace')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {projects.slice(0, 5).map(p => (
                            <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => navigate('/workspace')}>{p.name}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs font-mono text-slate-500 uppercase">{p.code}</span>
                                            <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                                                p.owner_id == userId ? "bg-blue-100 text-blue-700" : "bg-indigo-100 text-indigo-700"
                                            )}>
                                                {isAdmin ? (p.owner?.full_name || 'Admin') : (p.owner_id == userId ? "Main Coordinator" : "Assistant")}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/workspace')} className="p-2 text-slate-400 hover:text-blue-600">
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {projects.length === 0 && (
                            <div className="p-8 text-center text-slate-400 italic">No projects assigned yet.</div>
                        )}
                    </div>
                </section>

                {/* Urgent Tasks */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp size={18} className="text-amber-500" /> Urgent Tasks
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {tasks.filter(t => t.status !== 'completed').slice(0, 5).map(t => (
                            <div key={t.id} className="p-4 flex items-center gap-4">
                                <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                    t.status === 'blocked' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                                )}>
                                    {t.status === 'blocked' ? <AlertCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 truncate">{t.name}</p>
                                    <p className="text-xs text-slate-500">Due: {formatDate(t.due_date)}</p>
                                </div>
                                <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                    t.status === 'blocked' ? "bg-red-50 text-red-600 border-red-100" :
                                        t.status === 'in_progress' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                            "bg-slate-50 text-slate-600 border-slate-100"
                                )}>
                                    {t.status?.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                        {tasks.filter(t => t.status !== 'completed').length === 0 && (
                            <div className="p-8 text-center text-slate-400 italic">All tasks completed! Great job.</div>
                        )}
                    </div>
                </section>

                {/* Documents to Sign */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <FileText size={18} className="text-purple-500" /> Pending Documents
                        </h2>
                        <button onClick={() => navigate('/documents')} className="text-xs font-bold text-blue-600 hover:underline">Manage Tracking</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {documents.filter(d => d.status !== 'completed').map(d => (
                            <div key={d.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{d.title}</p>
                                        <p className="text-xs text-slate-500 font-mono">{d.ref_number || 'NO-REF'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                                        <p className="text-sm font-semibold text-amber-600 capitalize">{d.status}</p>
                                    </div>
                                    <button onClick={() => navigate('/documents')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors">
                                        Update <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {documents.filter(d => d.status !== 'completed').length === 0 && (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 size={24} />
                                </div>
                                <p className="text-slate-500 font-medium">No documents waiting for your signature.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
