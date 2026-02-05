import { useState, useEffect } from 'react';
import { getProjects, getProjectPayments } from '../services/projects';
import {
    getDepartmentStats,
    createDepartmentExpense,
    getBudgetRequests,
    createBudgetRequest,
    approveBudgetRequest,
    rejectBudgetRequest,
    deleteDepartmentExpense,
    deleteBudgetRequest,
    updateDepartmentExpense,
    updateBudgetRequest,
    recalculateBudgets
} from '../services/finance';
import { getCategories } from '../services/categories';
import {
    DollarSign,
    Briefcase,
    TrendingUp,
    PieChart,
    Plus,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Wallet,
    X,
    Trash2,
    Pencil,
    RefreshCw
} from 'lucide-react';
import clsx from 'clsx';
import { formatDate } from '../utils/dateUtils';

const currencyFormatter = new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0
});


export default function FinanceDashboard() {
    const [activeTab, setActiveTab] = useState('capex');
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(localStorage.getItem('role') || 'staff');

    // CAPEX Data
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);

    // OPEX Data
    const [deptStats, setDeptStats] = useState({ expenses: [], requests: [] });
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'General' });
    const [opexCategoryFilter, setOpexCategoryFilter] = useState('All');


    // Budget Requests Data
    const [requests, setRequests] = useState([]);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [newRequest, setNewRequest] = useState({ title: '', amount: '', category: 'General', justification: '' });

    const [editingExpense, setEditingExpense] = useState(null);
    const [editingRequest, setEditingRequest] = useState(null);
    const [isRecalculating, setIsRecalculating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData(silent = false) {
        if (!silent) setLoading(true);

        // Parallel load with independent error handling
        await Promise.all([
            (async () => {
                try {
                    const projList = await getProjects();
                    const enrichedProjects = await Promise.all(projList.map(async p => {
                        try {
                            const payments = await getProjectPayments(p.id);
                            const actualCapex = payments
                                .filter(pay => pay.payment_type === 'capex' && pay.status === 'paid')
                                .reduce((sum, pay) => sum + pay.amount, 0);
                            return { ...p, actual_capex: actualCapex };
                        } catch (e) {
                            return { ...p, actual_capex: 0 };
                        }
                    }));
                    setProjects(enrichedProjects);
                } catch (err) {
                    console.error("Failed to load CAPEX data", err);
                    if (!silent) alert("Gagal memuat data CAPEX: " + err.message);
                }
            })(),
            (async () => {
                try {
                    const stats = await getDepartmentStats();
                    console.log("FinanceDashboard: Successfully loaded deptStats:", stats);
                    if (stats && stats.id) {
                        setDeptStats(stats);
                    } else {
                        console.error("FinanceDashboard: Stats loaded but ID missing", stats);
                        if (!silent) alert("Data jabatan dimuatkan tetapi ID jabatan hilang.");
                    }
                } catch (err) {
                    console.error("Failed to load OPEX data", err);
                    if (!silent) alert("Gagal memuat data OPEX: " + err.message);
                }
            })(),
            (async () => {
                try {
                    const reqList = await getBudgetRequests();
                    setRequests(reqList);
                } catch (err) {
                    console.error("Failed to load requests", err);
                }
            })(),
            (async () => {
                try {
                    const catList = await getCategories();
                    setCategories(catList);
                } catch (err) {
                    console.error("Failed to load categories", err);
                }
            })()
        ]);

        if (!silent) setLoading(false);
    }

    async function handleAddExpense() {
        if (!newExpense.title || !newExpense.amount) return;
        try {
            await createDepartmentExpense({
                ...newExpense,
                amount: parseFloat(newExpense.amount)
            });
            setIsExpenseModalOpen(false);
            setNewExpense({ title: '', amount: '', category: 'General' });
            loadData(true); // Silent reload
        } catch (err) {
            alert("Failed to add expense");
        }
    }

    async function handleCreateRequest() {
        if (!newRequest.title || !newRequest.amount) return;
        try {
            await createBudgetRequest({
                ...newRequest,
                amount: parseFloat(newRequest.amount)
            });
            setIsRequestModalOpen(false);
            setNewRequest({ title: '', amount: '', category: 'General', justification: '' });
            loadData(true);
        } catch (err) {
            alert("Failed to create request");
        }
    }


    async function handleApproveRequest(id) {
        try {
            await approveBudgetRequest(id);
            loadData(true);
        } catch (err) { alert("Failed to approve"); }
    }

    async function handleRejectRequest(id) {
        try {
            await rejectBudgetRequest(id);
            loadData(true);
        } catch (err) { alert("Failed to reject"); }
    }

    async function handleDeleteExpense(id) {
        if (!window.confirm("Adakah anda pasti mahu memadam rekod perbelanjaan ini?")) return;
        try {
            await deleteDepartmentExpense(id);
            loadData(true);
        } catch (err) {
            alert("Gagal memadam perbelanjaan: " + err.message);
        }
    }

    async function handleDeleteRequest(id) {
        if (!window.confirm("Adakah anda pasti mahu memadam rekod permohonan bajet ini?")) return;
        try {
            await deleteBudgetRequest(id);
            loadData(true);
        } catch (err) {
            alert("Gagal memadam permohonan: " + err.message);
        }
    }

    // --- Edit Handlers ---
    function handleEditExpense(expense) {
        setEditingExpense(expense);
        setNewExpense({
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setIsExpenseModalOpen(true);
    }

    function handleEditRequest(req) {
        setEditingRequest(req);
        setNewRequest({
            title: req.title,
            amount: req.amount,
            category: req.category,
            justification: req.justification || ''
        });
        setIsRequestModalOpen(true);
    }

    async function handleUpdateExpense(e) {
        if (e) e.preventDefault();
        try {
            await updateDepartmentExpense(editingExpense.id, {
                ...newExpense,
                amount: parseFloat(newExpense.amount)
            });
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
            setNewExpense({ title: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0] });
            loadData(true);
        } catch (err) {
            alert("Gagal mengemaskini perbelanjaan: " + err.message);
        }
    }

    async function handleUpdateRequest(e) {
        if (e) e.preventDefault();
        try {
            await updateBudgetRequest(editingRequest.id, {
                ...newRequest,
                amount: parseFloat(newRequest.amount)
            });
            setIsRequestModalOpen(false);
            setEditingRequest(null);
            setNewRequest({ title: '', amount: '', category: 'General', justification: '' });
            loadData(true);
        } catch (err) {
            alert("Gagal mengemaskini permohonan: " + err.message);
        }
    }

    async function handleRecalculate() {
        if (!window.confirm("Adakah anda pasti mahu mengira semula semua bajet kategori? Ini akan menyelaraskan semula 'Budget Cards' mengikut rekod dalam Ledger.")) return;
        setIsRecalculating(true);
        try {
            await recalculateBudgets();
            alert("Pemulihan bajet berjaya!");
            loadData(true);
        } catch (err) {
            alert("Gagal mengira semula bajet: " + err.message);
        } finally {
            setIsRecalculating(false);
        }
    }

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;

    const totalCapexBudget = projects.reduce((sum, p) => sum + (p.budget_capex || 0), 0);
    const totalCapexSpent = projects.reduce((sum, p) => sum + (p.actual_capex || 0), 0);

    // --- Ledger Logic ---
    // Calculate Baseline injections for categories where budget card > ledger items
    const baselineItems = [];
    (deptStats?.category_budgets || []).forEach(catBudget => {
        const catName = catBudget.category || "Uncategorized";
        const totalBudget = catBudget.amount || 0;
        const ledgerSum = (deptStats.requests || [])
            .filter(r => r.status === 'approved' && (r.category || "Uncategorized") === catName)
            .reduce((sum, r) => sum + (r.amount || 0), 0);

        if (totalBudget > ledgerSum) {
            baselineItems.push({
                id: `baseline-${catName}`,
                title: `Baseline Allocation (${catName})`,
                amount: totalBudget - ledgerSum,
                category: catName,
                type: 'credit',
                date: '2025-01-01T00:00:00Z', // Use early date to ensure it's first
                isBaseline: true
            });
        }
    });

    const allSortedLedger = [
        ...baselineItems,
        ...(deptStats.requests || []).filter(r => r.status === 'approved').map(r => ({ ...r, type: 'credit', date: r.created_at || new Date().toISOString(), originalData: r })),
        ...(deptStats.expenses || []).map(e => ({ ...e, type: 'debit', date: e.date || new Date().toISOString(), originalData: e }))
    ].sort((a, b) => {
        // Compare dates (YYYY-MM-DD only to help grouping credits of the same day)
        const dateA = new Date(a.date).toISOString().split('T')[0];
        const dateB = new Date(b.date).toISOString().split('T')[0];

        if (dateA !== dateB) return new Date(a.date) - new Date(b.date);

        // Same day: Force Credits (Budgets/Baselines) to appear BEFORE Debits (Expenses)
        if (a.type === 'credit' && b.type === 'debit') return -1;
        if (a.type === 'debit' && b.type === 'credit') return 1;

        // If same type and date, use original timestamp/id sorting
        return new Date(a.date) - new Date(b.date);
    });

    // Calculate Running Balances (TRACKED PER CATEGORY)
    // This ensures a row's balance is identical whether viewed in 'All' or a specific category.
    const potBalances = {};
    const ledgerWithBalance = allSortedLedger.map(item => {
        const cat = item.category || "Uncategorized";
        const amount = parseFloat(item.amount) || 0;

        if (potBalances[cat] === undefined) potBalances[cat] = 0;

        if (item.type === 'credit') potBalances[cat] += amount;
        else potBalances[cat] -= amount;

        return { ...item, amount, runningBalance: potBalances[cat] };
    });

    // Derive Flat Categories from settings
    const flatCategories = Array.isArray(categories) ? categories.reduce((acc, cat) => {
        if (!cat || !cat.name) return acc;
        acc.push(cat.name);
        if (cat.children && Array.isArray(cat.children)) {
            cat.children.forEach(sub => {
                if (sub && sub.name) acc.push(`${cat.name} - ${sub.name}`);
            });
        }
        return acc;
    }, []) : [];

    // Derive All Unique Categories (settings + actual data usage)
    const budgetCategories = (deptStats?.category_budgets || []).map(b => b.category || "Uncategorized");
    const expenseCategories = (deptStats?.expenses || []).map(e => e.category || "Uncategorized");
    const requestCategories = (deptStats?.requests || []).filter(r => r.status === 'approved').map(r => r.category || "Uncategorized");

    const uniqueCategories = ['All', ...new Set([
        ...flatCategories,
        ...budgetCategories,
        ...expenseCategories,
        ...requestCategories
    ])];

    // Aggregate Balances for "All" Summary View
    const summaryLedger = Object.entries(potBalances).map(([category, balance]) => ({
        category,
        runningBalance: balance,
        isSummary: true
    })).sort((a, b) => a.category.localeCompare(b.category));

    // Filter Ledger by Category
    const filteredLedger = opexCategoryFilter === 'All'
        ? summaryLedger
        : ledgerWithBalance.filter(item => (item.category || "Uncategorized") === opexCategoryFilter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Financial Performance</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-500 text-sm">Track CAPEX Investments & OPEX Efficiency</p>
                        <button
                            onClick={() => loadData()}
                            className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                        >
                            Force Reload Data
                        </button>
                        {!deptStats.id && !loading && (
                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold animate-pulse">
                                Data Error: No Dept ID
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setActiveTab('capex')}
                        className={clsx("px-4 py-2 text-sm font-bold rounded-md transition-all", activeTab === 'capex' ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50")}
                    >
                        CAPEX Portfolio
                    </button>
                    <button
                        onClick={() => setActiveTab('opex')}
                        className={clsx("px-4 py-2 text-sm font-bold rounded-md transition-all", activeTab === 'opex' ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50")}
                    >
                        Department OPEX
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={clsx("px-4 py-2 text-sm font-bold rounded-md transition-all", activeTab === 'requests' ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50")}
                    >
                        Budget Requests
                        {requests.filter(r => r.status === 'pending').length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {requests.filter(r => r.status === 'pending').length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* CAPEX VIEW */}
            {activeTab === 'capex' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total CAPEX Budget</h3>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={20} /></div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{currencyFormatter.format(totalCapexBudget)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Utilized</h3>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{currencyFormatter.format(totalCapexSpent)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining</h3>
                                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><PieChart size={20} /></div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{currencyFormatter.format(totalCapexBudget - totalCapexSpent)}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Project Budget Allocation</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-white text-xs uppercase text-slate-500 font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Project</th>
                                    <th className="px-6 py-4 text-right">Budget</th>
                                    <th className="px-6 py-4 text-right">Spent</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {projects.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                            <p className="text-xs text-slate-500 font-mono">{p.code}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-sm text-slate-700">
                                            {currencyFormatter.format(p.budget_capex)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-sm text-emerald-600 font-bold">
                                            {currencyFormatter.format(p.actual_capex)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={clsx("text-xs font-bold px-2 py-1 rounded-full",
                                                (p.actual_capex / (p.budget_capex || 1)) > 0.9 ? "bg-red-100 text-red-700" :
                                                    "bg-emerald-100 text-emerald-700"
                                            )}>
                                                {Math.round((p.actual_capex / (p.budget_capex || 1)) * 100)}% Used
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* OPEX VIEW (LEDGER STYLE) */}
            {activeTab === 'opex' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved Budget</h3>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={20} /></div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{currencyFormatter.format(deptStats.budget_opex || 0)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-red-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Spent (Debits)</h3>
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingUp size={20} className="rotate-180" /></div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{currencyFormatter.format(deptStats.opex_used || 0)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-emerald-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining Balance</h3>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{currencyFormatter.format(deptStats.opex_remaining || 0)}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-sm">Category Budgets Breakdown</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-slate-100 border-b border-slate-100">
                            {uniqueCategories.filter(c => {
                                if (c === 'All') return false;
                                const hasRequest = requestCategories.includes(c);
                                const budget = deptStats.category_budgets?.find(b => (b.category || "Uncategorized") === c)?.amount || 0;
                                return hasRequest || budget > 0;
                            }).map(cat => {
                                const budget = deptStats.category_budgets?.find(b => (b.category || "Uncategorized") === cat)?.amount || 0;
                                const spent = (deptStats.expenses || [])
                                    .filter(e => (e.category || "Uncategorized") === cat)
                                    .reduce((sum, e) => sum + e.amount, 0);
                                const remaining = budget - spent;

                                return (
                                    <div key={cat} className="p-4 hover:bg-slate-50 transition-colors">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate">{cat}</p>
                                        <p className="text-sm font-bold text-slate-900">{currencyFormatter.format(budget)}</p>
                                        <div className="mt-2 flex items-center justify-between text-[10px]">
                                            <span className="text-slate-500">Left:</span>
                                            <span className={clsx("font-bold", remaining < 0 ? "text-red-600" : "text-emerald-600")}>
                                                {currencyFormatter.format(remaining)}
                                            </span>
                                        </div>
                                        <div className="mt-1 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                            <div
                                                className={clsx("h-full transition-all duration-500", remaining < 0 ? "bg-red-500" : "bg-blue-500")}
                                                style={{ width: `${Math.min(100, (spent / (budget || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FileText size={18} className="text-indigo-500" /> General Ledger
                                </h3>
                                {/* Category Tabs */}
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                                    {uniqueCategories.filter(cat => {
                                        if (cat === 'All') return true;
                                        const hasRequest = (deptStats?.requests || []).some(r => (r.category || "Uncategorized") === cat);
                                        const budget = (deptStats?.category_budgets || []).find(b => (b.category || "Uncategorized") === cat)?.amount || 0;
                                        return hasRequest || budget > 0;
                                    }).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setOpexCategoryFilter(cat)}
                                            className={clsx("px-3 py-1 text-xs font-bold rounded-md transition-colors",
                                                opexCategoryFilter === cat ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {['admin', 'hod'].includes(role.toLowerCase()) && (
                                    <button
                                        onClick={handleRecalculate}
                                        disabled={isRecalculating}
                                        className={clsx(
                                            "flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                                            isRecalculating ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100"
                                        )}
                                        title="Recalculate all category totals based on approved budget requests"
                                    >
                                        <RefreshCw size={12} className={isRecalculating ? "animate-spin" : ""} />
                                        {isRecalculating ? "Calculating..." : "Recalculate Pots"}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setNewExpense({
                                            title: '',
                                            amount: '',
                                            category: flatCategories.length > 0 ? flatCategories[0] : 'General',
                                            date: new Date().toISOString().split('T')[0]
                                        });
                                        setIsExpenseModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <Plus size={14} /> Log Expense
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        {opexCategoryFilter === 'All' ? (
                                            <>
                                                <th className="px-6 py-3">Category</th>
                                                <th className="px-6 py-3 text-right bg-slate-50">Balance</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-3">Date</th>
                                                <th className="px-6 py-3">Type</th>
                                                <th className="px-6 py-3">Description</th>
                                                <th className="px-6 py-3">Category</th>
                                                <th className="px-6 py-3 text-right">Debit (Out)</th>
                                                <th className="px-6 py-3 text-right">Credit (In)</th>
                                                <th className="px-6 py-3 text-right bg-slate-50">Balance</th>
                                                {['admin', 'hod'].includes(role.toLowerCase()) && <th className="px-4 py-3 text-center">Action</th>}
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {filteredLedger.length > 0 ? filteredLedger.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            {opexCategoryFilter === 'All' ? (
                                                <>
                                                    <td className="px-6 py-3 font-medium text-slate-900">{item.category}</td>
                                                    <td className="px-6 py-3 text-right font-bold text-slate-800 font-mono bg-slate-50/50">
                                                        {currencyFormatter.format(item.runningBalance)}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-3 text-slate-500 max-w-[100px] truncate">{formatDate(item.date)}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                            item.isBaseline ? "bg-slate-100 text-slate-600" :
                                                                (item.type === 'credit' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")
                                                        )}>
                                                            {item.isBaseline ? 'Baseline' : (item.type === 'credit' ? 'Budget' : 'Expense')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 font-medium text-slate-900">{item.title}</td>
                                                    <td className="px-6 py-3 text-slate-500">{item.category}</td>
                                                    <td className="px-6 py-3 text-right text-red-600 font-mono">
                                                        {item.type === 'debit' ? currencyFormatter.format(item.amount) : '-'}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-emerald-600 font-mono">
                                                        {item.type === 'credit' ? currencyFormatter.format(item.amount) : '-'}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-bold text-slate-800 font-mono bg-slate-50/50">
                                                        {currencyFormatter.format(item.runningBalance)}
                                                    </td>
                                                    {['admin', 'hod'].includes(role.toLowerCase()) && (
                                                        <td className="px-4 py-3 text-center">
                                                            {!item.isBaseline && (
                                                                <div className="flex justify-center gap-1">
                                                                    <button
                                                                        onClick={() => item.originalData ? (item.type === 'debit' ? handleEditExpense(item.originalData) : handleEditRequest(item.originalData)) : alert("Editing not available for this item type")}
                                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => item.type === 'debit' ? handleDeleteExpense(item.id) : handleDeleteRequest(item.id)}
                                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                </>
                                            )}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={opexCategoryFilter === 'All' ? 2 : 8} className="p-8 text-center text-slate-400 italic">No transactions found for this period.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div >
            )
            }

            {/* BUDGET REQUESTS TAB */}
            {
                activeTab === 'requests' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-center bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <div>
                                <h2 className="text-xl font-bold text-blue-900">Budget Request Center</h2>
                                <p className="text-blue-600 text-sm">Request additional OPEX budget allocation here. Approvals add to your usable balance.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setNewRequest({
                                        title: '',
                                        amount: '',
                                        category: flatCategories.length > 0 ? flatCategories[0] : 'General',
                                        justification: ''
                                    });
                                    setIsRequestModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all"
                            >
                                <Plus size={16} /> New Request
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {requests.map(req => (
                                <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                                req.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                        )}>
                                            {req.status === 'approved' ? <CheckCircle2 size={24} /> :
                                                req.status === 'rejected' ? <XCircle size={24} /> : <Clock size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{req.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-medium">{req.category}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-xs text-slate-500 font-mono">{formatDate(req.created_at)}</span>
                                            </div>
                                            {req.justification && (
                                                <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded italic">"{req.justification}"</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <span className="text-xl font-bold text-slate-900">{currencyFormatter.format(req.amount)}</span>
                                        <span className={clsx("text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide",
                                            req.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                                req.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                        )}>
                                            {req.status}
                                        </span>

                                        {/* Action Buttons for Admin/HOD Only - Simplified Check */}
                                        {['admin', 'hod'].includes(role.toLowerCase()) && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleEditRequest(req)}
                                                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Edit Request"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRequest(req.id)}
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Delete Request"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                        {req.status === 'pending' && ['admin', 'hod', 'finance'].includes(role) && (
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleRejectRequest(req.id)}
                                                    className="px-3 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded font-bold transition-colors"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleApproveRequest(req.id)}
                                                    className="px-3 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700 rounded font-bold shadow-sm transition-colors"
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {requests.length === 0 && (
                                <div className="text-center p-10 text-slate-400">No budget requests found.</div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Expense Modal */}
            {
                isExpenseModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-96 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {editingExpense ? (
                                        <><Pencil className="text-blue-600" size={24} /> Edit Perbelanjaan</>
                                    ) : (
                                        <><DollarSign className="text-emerald-600" size={24} /> Log Perbelanjaan Baru</>
                                    )}
                                </h2>
                                <button
                                    onClick={() => {
                                        setIsExpenseModalOpen(false);
                                        setEditingExpense(null);
                                        setNewExpense({ title: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0] });
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                editingExpense ? handleUpdateExpense(e) : handleAddExpense();
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                                    <input
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newExpense.title}
                                        onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Amount (MYR)</label>
                                    <input
                                        type="number"
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                                        value={newExpense.category}
                                        onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    >
                                        {flatCategories.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                        {flatCategories.length === 0 && <option>General</option>}
                                    </select>
                                </div>
                                <div className="mt-6 flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold"
                                    >
                                        {editingExpense ? 'Kemaskini Rekod' : 'Simpan Rekod'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Request Modal */}
            {
                isRequestModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-96 animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">New Budget Request</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                editingRequest ? handleUpdateRequest(e) : handleCreateRequest();
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                                    <input
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. Q4 Marketing Budget"
                                        value={newRequest.title}
                                        onChange={e => setNewRequest({ ...newRequest, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Requested Amount (MYR)</label>
                                    <input
                                        type="number"
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newRequest.amount}
                                        onChange={e => setNewRequest({ ...newRequest, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                                        value={newRequest.category}
                                        onChange={e => setNewRequest({ ...newRequest, category: e.target.value })}
                                    >
                                        {flatCategories.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                        {flatCategories.length === 0 && <option>General</option>}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Justification</label>
                                    <textarea
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20"
                                        placeholder="Why is this needed?"
                                        value={newRequest.justification}
                                        onChange={e => setNewRequest({ ...newRequest, justification: e.target.value })}
                                    />
                                </div>
                                <div className="mt-6 flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                                    >
                                        {editingRequest ? 'Kemaskini Permohonan' : 'Hantar Permohonan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

        </div >
    );
}
