import { useState, useEffect } from 'react';
import * as noteService from '../services/noteService';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Briefcase,
    Wallet,
    Settings,
    LogOut,
    Menu,
    X,
    ListTodo,
    PieChart,
    Bell,
    UserCircle,
    Users,
    FileText,
    Kanban,
    StickyNote,
    AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const SIDEBAR_ITEMS = {
    admin: [
        { label: 'System Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'Activity Overview', path: '/dashboard', icon: PieChart },
        { label: 'Staff Directory', path: '/admin/staff', icon: Users },
        { label: 'Portfolio (HOD)', path: '/portfolio', icon: PieChart },
        { label: 'Finance Panel', path: '/finance', icon: Wallet },
        { label: 'All Projects', path: '/workspace', icon: Briefcase },
        { label: 'Document Tracker', path: '/documents', icon: FileText },
        { label: 'Notes', path: '/notes', icon: StickyNote },
        { label: 'Issue Log', path: '/issues', icon: AlertCircle },
    ],
    hod: [
        { label: 'Portfolio', path: '/portfolio', icon: PieChart },
        { label: 'All Projects', path: '/workspace', icon: Briefcase },
        { label: 'Approvals', path: '/portfolio/approvals', icon: ListTodo },
        { label: 'Document Tracker', path: '/documents', icon: FileText },
        { label: 'Notes', path: '/notes', icon: StickyNote },
        { label: 'Issue Log', path: '/issues', icon: AlertCircle },
    ],
    staff: [
        { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'My Projects', path: '/workspace', icon: Briefcase },
        { label: 'Document Tracker', path: '/documents', icon: FileText },
        { label: 'Notes', path: '/notes', icon: StickyNote },
        { label: 'Issue Log', path: '/issues', icon: AlertCircle },
    ],
    finance: [
        { label: 'Finance Panel', path: '/finance', icon: Wallet },
        { label: 'Payments', path: '/finance/payments', icon: Wallet },
        { label: 'Document Tracker', path: '/documents', icon: FileText },
        { label: 'Notes', path: '/notes', icon: StickyNote },
        { label: 'Issue Log', path: '/issues', icon: AlertCircle },
    ]
};

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem('role') || 'staff';
    let fullName = localStorage.getItem('full_name') || localStorage.getItem('role') || 'User';
    if (fullName === 'null') fullName = localStorage.getItem('role') || 'User';

    const navItems = SIDEBAR_ITEMS[role] || [];

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out shadow-2xl flex flex-col",
                    !isSidebarOpen && "-translate-x-full lg:translate-x-0 lg:w-20"
                )}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                    <div className={cn("flex items-center gap-3", !isSidebarOpen && "lg:justify-center w-full")}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
                            <Kanban size={18} className="text-white" />
                        </div>
                        <span className={cn("font-bold text-lg tracking-tight", !isSidebarOpen && "lg:hidden")}>
                            ISTMO
                        </span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path.split('/').length > 2} // Exact match for root paths unless sub-path
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon size={20} className={cn("shrink-0", !isSidebarOpen && "lg:mx-auto")} />
                            <span className={cn("font-medium", !isSidebarOpen && "lg:hidden")}>
                                {item.label}
                            </span>

                            {/* Tooltip for collapsed state */}
                            {!isSidebarOpen && (
                                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 hidden lg:block">
                                    {item.label}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-1">
                    {role === 'admin' && (
                        <NavLink
                            to="/admin/settings"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors mb-2",
                                isActive ? "text-white bg-slate-800" : "text-slate-400 hover:text-white hover:bg-slate-800",
                                !isSidebarOpen && "lg:justify-center"
                            )}
                        >
                            <Settings size={20} />
                            <span className={cn(!isSidebarOpen && "lg:hidden")}>Settings</span>
                        </NavLink>
                    )}
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 w-full px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors",
                            !isSidebarOpen && "lg:justify-center"
                        )}
                    >
                        <LogOut size={20} />
                        <span className={cn(!isSidebarOpen && "lg:hidden")}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-300",
                isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
            )}>
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-sm/50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-lg font-semibold text-slate-800 hidden sm:block">
                            {SIDEBAR_ITEMS[role]?.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 capitalize">{fullName}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight opacity-70">{role}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 ring-2 ring-white shadow-sm">
                                <UserCircle size={24} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const notes = await noteService.getNotes();
                const now = new Date();
                // Show reminders due within 24 hours
                const dueReminders = notes.filter(n =>
                    !n.is_completed &&
                    n.reminder_date &&
                    new Date(n.reminder_date) <= new Date(now.getTime() + 24 * 60 * 60 * 1000)
                ).sort((a, b) => new Date(a.reminder_date) - new Date(b.reminder_date));
                setNotifications(dueReminders);
            } catch (err) {
                console.error("Failed to fetch reminders for notifications", err);
            }
        };

        fetchReminders();
        const interval = setInterval(fetchReminders, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => new Date(n.reminder_date) <= new Date()).length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all relative group"
            >
                <Bell size={20} className={cn(unreadCount > 0 && "animate-bounce text-blue-600")} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-in zoom-in">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in slide-in-from-top-2">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Reminders</h3>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">
                                {notifications.length} Total
                            </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Bell size={20} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No reminders soon</p>
                                </div>
                            ) : (
                                notifications.map(note => {
                                    const isDue = new Date(note.reminder_date) <= new Date();
                                    return (
                                        <div
                                            key={note.id}
                                            className={cn(
                                                "p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group",
                                                isDue && "bg-red-50/30"
                                            )}
                                            onClick={() => {
                                                setIsOpen(false);
                                                window.location.href = '/notes';
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                    isDue ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                                                )}>
                                                    <StickyNote size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                                        {note.title}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                                        {note.content}
                                                    </p>
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-widest",
                                                        isDue ? "text-red-500" : "text-slate-400"
                                                    )}>
                                                        <Clock size={10} />
                                                        {new Date(note.reminder_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                            <button
                                onClick={() => { setIsOpen(false); window.location.href = '/notes'; }}
                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 active:scale-95 transition-all"
                            >
                                View All Notes
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
