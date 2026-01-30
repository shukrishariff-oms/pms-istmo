import { useState, useEffect } from 'react';
import { getPortfolioDashboard } from '../services/portfolio';
import {
    Building2,
    CalendarDays,
    CalendarClock,
    AlertTriangle,
    CheckCircle2,
    Clock,
    XCircle,
    TrendingUp
} from 'lucide-react';
import clsx from 'clsx';

const StatusBadge = ({ status }) => {
    const styles = {
        on_track: "bg-emerald-100 text-emerald-800",
        at_risk: "bg-amber-100 text-amber-800",
        delayed: "bg-red-100 text-red-800",
        completed: "bg-blue-100 text-blue-800",
    };
    return (
        <span className={clsx("px-2 py-1 rounded text-xs font-bold uppercase tracking-wide", styles[status] || "bg-slate-100 text-slate-600")}>
            {(status || '').replace('_', ' ')}
        </span>
    );
};

export default function PortfolioPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await getPortfolioDashboard();
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Portfolio Governance</h1>
                    <p className="text-slate-500 text-sm">Monthly Oversight & Health Check</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-center shadow-sm">
                        <p className="text-xs text-slate-400 font-bold uppercase">Active Projects</p>
                        <p className="text-lg font-bold text-slate-800">{data.filter(p => p.status !== 'completed').length}</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-center shadow-sm">
                        <p className="text-xs text-slate-400 font-bold uppercase">Critical Attention</p>
                        <p className="text-lg font-bold text-red-600">{data.filter(p => ['delayed', 'at_risk'].includes(p.status)).length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {data.map(proj => (
                    <div key={proj.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Project Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm",
                                    proj.status === 'delayed' ? "bg-red-500" :
                                        proj.status === 'at_risk' ? "bg-amber-500" :
                                            proj.status === 'completed' ? "bg-blue-500" : "bg-emerald-500"
                                )}>
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 leading-tight">{proj.name}</h3>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 font-mono">{proj.code}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-xs text-slate-500 font-medium">Main: {proj.owner}</span>
                                        </div>
                                        {proj.assist_coordinator && (
                                            <span className="text-[10px] text-indigo-500 font-medium pl-14">
                                                (Assist: {proj.assist_coordinator})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <StatusBadge status={proj.status} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">

                            {/* Column 1: This Month */}
                            <div className="p-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                    <CalendarDays size={14} className="text-blue-500" /> This Month's Activities
                                </h4>
                                <div className="space-y-2">
                                    {proj.tasks_this_month.length > 0 ? (
                                        proj.tasks_this_month.map(t => (
                                            <div key={t.id} className="flex items-start justify-between text-sm group">
                                                <span className={clsx("truncate pr-2", t.status === 'completed' && "line-through text-slate-400")}>
                                                    {t.name}
                                                </span>
                                                <span className={clsx(
                                                    "text-xs px-1.5 py-0.5 rounded",
                                                    t.status === 'completed' ? "bg-green-50 text-green-600" :
                                                        t.status === 'in_progress' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {t.status === 'in_progress' ? 'WIP' : t.status === 'completed' ? 'DONE' : 'TODO'}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No scheduled activities.</p>
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Next Month Forecast */}
                            <div className="p-4 bg-slate-50/20">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                    <CalendarClock size={14} className="text-indigo-500" /> Next Month Forecast
                                </h4>
                                <div className="space-y-2">
                                    {proj.tasks_next_month.length > 0 ? (
                                        proj.tasks_next_month.map(t => (
                                            <div key={t.id} className="flex items-center text-sm text-slate-600">
                                                <TrendingUp size={14} className="mr-2 text-slate-400" />
                                                <span className="truncate">{t.name}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Nothing forecasted yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Column 3: Payment Issues */}
                            <div className="p-4 bg-red-50/30">
                                <h4 className="text-xs font-bold text-red-800/60 uppercase mb-3 flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-red-500" /> Payment Alerts
                                </h4>
                                <div className="space-y-3">
                                    {proj.payment_issues.length > 0 ? (
                                        proj.payment_issues.map(p => (
                                            <div key={p.id} className="bg-white border border-red-100 p-2 rounded shadow-sm">
                                                <p className="text-xs font-semibold text-red-600 line-clamp-1">{p.title}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs font-bold text-slate-700">RM {p.amount.toLocaleString()}</span>
                                                    <span className="text-[10px] text-red-500 font-medium">Overdue</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1">Due: {new Date(p.due).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-600 text-sm mt-4">
                                            <CheckCircle2 size={16} />
                                            <span className="text-xs font-medium">All clear. No payment issues.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}
