import { useState } from 'react';
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
    Kanban
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
    ],
    hod: [
        { label: 'Portfolio', path: '/portfolio', icon: PieChart },
        { label: 'All Projects', path: '/workspace', icon: Briefcase },
        { label: 'Approvals', path: '/portfolio/approvals', icon: ListTodo },
        { label: 'Document Tracker', path: '/documents', icon: FileText },
    ],
    staff: [
        { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'My Projects', path: '/workspace', icon: Briefcase },
        { label: 'Document Tracker', path: '/documents', icon: FileText },
    ],
    finance: [
        { label: 'Finance Panel', path: '/finance', icon: Wallet },
        { label: 'Payments', path: '/finance/payments', icon: Wallet },
        { label: 'Document Tracker', path: '/documents', icon: FileText },
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
