import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjects, getProjectDetails, getProjectWBS, getProjectPayments, createProjectWBS, createProjectTask, createProjectPayment, updateProject, updateProjectPayment, deleteProjectPayment, deleteProjectWBS, deleteProjectTask, updateProjectWBS, updateProjectTask } from '../services/projects';
import { getUsers } from '../services/users';
import {
    Calendar,
    CheckCircle2,
    AlertCircle,
    Clock,
    Wallet,
    Layers,
    ChevronRight,
    ChevronDown,
    ArrowRight,
    TrendingUp,
    Plus,
    Pencil,
    X,
    Briefcase,
    Trash2,
    GitBranch
} from 'lucide-react';
import clsx from 'clsx';

const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : "";

// --- Subcomponents ---

const StatusBadge = ({ status }) => {
    const styles = {
        on_track: "bg-emerald-100 text-emerald-700 border-emerald-200",
        at_risk: "bg-amber-100 text-amber-700 border-amber-200",
        delayed: "bg-red-100 text-red-700 border-red-200",
        completed: "bg-blue-100 text-blue-700 border-blue-200",
        // Task statuses
        not_started: "bg-slate-100 text-slate-600 border-slate-200",
        in_progress: "bg-blue-50 text-blue-600 border-blue-200",
        blocked: "bg-red-50 text-red-600 border-red-200",
        // Payment statuses
        unpaid: "bg-slate-100 text-slate-500",
        claimed: "bg-amber-50 text-amber-600",
        verified: "bg-indigo-50 text-indigo-600",
        approved: "bg-purple-50 text-purple-600",
        paid: "bg-emerald-50 text-emerald-600 font-semibold"
    };

    return (
        <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium border", styles[status] || styles.not_started)}>
            {(status || 'not_started').replace('_', ' ').toUpperCase()}
        </span>
    );
};

const TAB_CLASSES = "px-4 py-2 text-sm font-medium border-b-2 transition-colors";
const ACTIVE_TAB = "border-blue-600 text-blue-600";
const INACTIVE_TAB = "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300";

export default function ProjectWorkspace() {
    const [projectsList, setProjectsList] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    // Data State
    const [project, setProject] = useState(null);
    const [wbs, setWbs] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        owner_id: '',
        assist_coordinator_id: '',
        budget_capex: 0,
        start_date: '',
        end_date: '',
        status: ''
    });

    // Modal State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTaskData, setNewTaskData] = useState({
        wbs_id: '',
        parent_id: null,
        name: '',
        start_date: '',
        end_date: ''
    });

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentFormData, setPaymentFormData] = useState({
        title: '',
        vendor_name: '',
        amount: 0,
        payment_type: 'capex',
        planned_date: '',
        status: 'unpaid'
    });

    // WBS Edit State
    const [isEditWBSModalOpen, setIsEditWBSModalOpen] = useState(false);
    const [selectedWBSItem, setSelectedWBSItem] = useState(null);
    const [wbsFormData, setWbsFormData] = useState({ name: '' });

    // Task Edit State
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
    const [selectedTaskItem, setSelectedTaskItem] = useState(null);
    const [taskFormData, setTaskFormData] = useState({
        name: '',
        parent_id: null,
        assignee_id: '',
        status: '',
        planned_start: '',
        due_date: ''
    });

    useEffect(() => {
        async function loadList() {
            setLoading(true);
            try {
                const role = localStorage.getItem('role');
                const userId = role === 'staff' ? localStorage.getItem('user_id') : null;

                const list = await getProjects(userId);
                setProjectsList(list);
                if (list.length > 0) {
                    setSelectedProjectId(list[0].id);
                } else {
                    setLoading(false); // No projects to load, so stop loading
                }
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        }
        loadList();
    }, []);

    useEffect(() => {
        if (!selectedProjectId) return;

        async function loadData() {
            setLoading(true);
            setError(null);
            try {
                const [p, w, pay] = await Promise.all([
                    getProjectDetails(selectedProjectId),
                    getProjectWBS(selectedProjectId),
                    getProjectPayments(selectedProjectId)
                ]);
                setProject(p);
                setWbs(w);
                setPayments(pay);
            } catch (err) {
                console.error(err);
                setError("Failed to load project details. Please check your connection or database.");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [selectedProjectId]);

    useEffect(() => {
        async function loadUsers() {
            try {
                const u = await getUsers();
                setUsers(u);
            } catch (err) {
                console.error(err);
            }
        }
        loadUsers();
    }, []);

    function openEditModal() {
        setEditFormData({
            code: project.code,
            name: project.name,
            description: project.description || '',
            owner_id: project.owner_id,
            assist_coordinator_id: project.assist_coordinator_id || '',
            budget_capex: project.budget_capex,
            start_date: project.start_date.split('T')[0],
            end_date: project.end_date.split('T')[0],
            status: project.status
        });
        setIsEditModalOpen(true);
    }

    async function handleUpdateProject() {
        try {
            const payload = {
                ...editFormData,
                owner_id: parseInt(editFormData.owner_id),
                assist_coordinator_id: editFormData.assist_coordinator_id ? parseInt(editFormData.assist_coordinator_id) : null,
                budget_capex: parseFloat(editFormData.budget_capex),
                start_date: new Date(editFormData.start_date).toISOString(),
                end_date: new Date(editFormData.end_date).toISOString()
            };

            await updateProject(project.id, payload);
            setIsEditModalOpen(false);
            // Refresh project data
            const updated = await getProjectDetails(selectedProjectId);
            setProject(updated);
            alert("Project updated successfully!");
        } catch (err) {
            alert("Failed to update project: " + err.message);
        }
    }

    // --- Payment Handlers ---

    function openPaymentModal(pay = null) {
        if (pay) {
            setSelectedPayment(pay);
            setPaymentFormData({
                title: pay.title,
                vendor_name: pay.vendor_name,
                amount: pay.amount,
                payment_type: pay.payment_type,
                planned_date: pay.planned_date.split('T')[0],
                status: pay.status
            });
        } else {
            setSelectedPayment(null);
            setPaymentFormData({
                title: '',
                vendor_name: 'TBD Vendor',
                amount: 0,
                payment_type: 'capex',
                planned_date: new Date().toISOString().split('T')[0],
                status: 'unpaid'
            });
        }
        setIsPaymentModalOpen(true);
    }

    async function handleSavePayment() {
        try {
            const payload = {
                ...paymentFormData,
                amount: parseFloat(paymentFormData.amount),
                planned_date: new Date(paymentFormData.planned_date).toISOString()
            };

            if (selectedPayment) {
                await updateProjectPayment(selectedPayment.id, payload);
            } else {
                await createProjectPayment(selectedProjectId, payload);
            }

            const pay = await getProjectPayments(selectedProjectId);
            setPayments(pay);
            setIsPaymentModalOpen(false);
        } catch (err) {
            alert("Failed to save payment: " + err.message);
        }
    }

    async function handleTogglePaymentStatus(pay) {
        try {
            const nextStatus = pay.status === 'paid' ? 'unpaid' : 'paid';
            await updateProjectPayment(pay.id, { status: nextStatus });
            const updatedPay = await getProjectPayments(selectedProjectId);
            setPayments(updatedPay);
        } catch (err) {
            alert("Failed to update status: " + err.message);
        }
    }

    async function handleDeletePayment(paymentId) {
        if (!confirm("Are you sure you want to delete this payment?")) return;
        try {
            await deleteProjectPayment(paymentId);
            const pay = await getProjectPayments(selectedProjectId);
            setPayments(pay);
        } catch (err) {
            alert("Failed to delete: " + err.message);
        }
    }

    async function handleDeleteWBS(wbsId) {
        if (!confirm("Are you sure you want to delete this phase? This will also delete all tasks inside it.")) return;
        try {
            await deleteProjectWBS(wbsId);
            const w = await getProjectWBS(selectedProjectId);
            setWbs(w);
        } catch (err) {
            alert("Failed to delete phase: " + err.message);
        }
    }

    async function handleDeleteTask(taskId) {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            await deleteProjectTask(taskId);
            const w = await getProjectWBS(selectedProjectId);
            setWbs(w);
        } catch (err) {
            alert("Failed to delete task: " + err.message);
        }
    }

    // --- WBS & Task Edit Handlers ---

    function openEditWbsModal(phase) {
        setSelectedWBSItem(phase);
        setWbsFormData({ name: phase.name });
        setIsEditWBSModalOpen(true);
    }

    async function handleSaveWbs() {
        if (!wbsFormData.name) return;
        try {
            await updateProjectWBS(selectedWBSItem.id, wbsFormData);
            const w = await getProjectWBS(selectedProjectId);
            setWbs(w);
            setIsEditWBSModalOpen(false);
        } catch (err) {
            alert("Failed to update phase: " + err.message);
        }
    }

    function openEditTaskModal(task) {
        setSelectedTaskItem(task);
        setTaskFormData({
            name: task.name,
            parent_id: task.parent_id,
            assignee_id: task.assignee_id || '',
            status: task.status,
            planned_start: task.planned_start ? task.planned_start.split('T')[0] : '',
            due_date: task.due_date ? task.due_date.split('T')[0] : ''
        });
        setIsEditTaskModalOpen(true);
    }

    function handleAddSubTask(parentTask) {
        const today = new Date().toISOString().split('T')[0];
        setNewTaskData({
            wbs_id: parentTask.wbs_id,
            parent_id: parentTask.id,
            name: '',
            start_date: today,
            end_date: today
        });
        setIsTaskModalOpen(true);
    }

    async function handleSaveTask() {
        if (!taskFormData.name || !taskFormData.due_date) {
            alert("Name and Due Date are required");
            return;
        }
        try {
            const payload = {
                ...taskFormData,
                assignee_id: taskFormData.assignee_id ? parseInt(taskFormData.assignee_id) : null,
                planned_start: taskFormData.planned_start ? new Date(taskFormData.planned_start).toISOString() : null,
                due_date: new Date(taskFormData.due_date).toISOString()
            };
            await updateProjectTask(selectedTaskItem.id, payload);
            const w = await getProjectWBS(selectedProjectId);
            setWbs(w);
            setIsEditTaskModalOpen(false);
        } catch (err) {
            alert("Failed to update task: " + err.message);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
    );

    if (!project && projectsList.length > 0) return (
        <div className="p-8 text-center text-slate-500">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Unable to load project</h3>
            <p>Please try refreshing the page or contact support.</p>
        </div>
    );

    if (projectsList.length === 0) return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">No Projects Found</h3>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                    You don't have any assigned projects yet. If you're an admin, you can create new projects in the "System Overview" panel.
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* List Selector (Mock Sidebar for Project Switching) */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
                {projectsList.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                            selectedProjectId === p.id
                                ? "bg-slate-900 text-white shadow-md"
                                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                        )}
                    >
                        {p.code}
                    </button>
                ))}
            </div>

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                            <StatusBadge status={project.status} />
                        </div>
                        <p className="text-slate-500 max-w-2xl">{project.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Budget</p>
                            <p className="text-2xl font-bold text-slate-900">MYR {((project.budget_capex || 0) + (project.budget_opex_allocation || 0)).toLocaleString()}</p>
                        </div>
                        {localStorage.getItem('role') === 'admin' && (
                            <button
                                onClick={openEditModal}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold"
                            >
                                <Pencil size={14} /> Edit Details
                            </button>
                        )}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-6 mt-8 pt-6 border-t border-slate-100">
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Start Date</p>
                        <p className="text-sm font-semibold text-slate-700 mt-1 flex items-center gap-2">
                            <Calendar size={14} />
                            {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">End Date</p>
                        <p className="text-sm font-semibold text-slate-700 mt-1 flex items-center gap-2">
                            <Clock size={14} />
                            {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">CAPEX Utilization</p>
                        <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">45% Used</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Task Progress</p>
                        <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">60% Completed</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    {['overview', 'wbs', 'timeline', 'payments', 'files'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(TAB_CLASSES, activeTab === tab ? ACTIVE_TAB : INACTIVE_TAB)}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px]">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="p-8 grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-600" />
                                Current Focus
                            </h3>
                            <div className="space-y-4">
                                {wbs.flatMap(w => w.tasks || []).filter(t => t.status === 'in_progress').map(task => (
                                    <div key={task.id} className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-slate-800">{task.name}</p>
                                            <p className="text-xs text-slate-500">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <StatusBadge status={task.status} />
                                    </div>
                                ))}
                                {wbs.flatMap(w => w.tasks || []).filter(t => t.status === 'in_progress').length === 0 && (
                                    <p className="text-slate-400 italic">No tasks currently in progress.</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <AlertCircle size={20} className="text-amber-500" />
                                At Risk / Delayed
                            </h3>
                            <div className="space-y-4">
                                {wbs.flatMap(w => w.tasks || []).filter(t =>
                                    ['blocked', 'delayed'].includes(t.status) ||
                                    (t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed')
                                ).map(task => (
                                    <div key={task.id} className="p-4 bg-red-50/50 border border-red-100 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-slate-800">{task.name}</p>
                                            <p className="text-xs text-red-500 font-medium">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <StatusBadge status={task.status || 'blocked'} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* WBS TAB - DATA GRID ONLY */}
                {activeTab === 'wbs' && (
                    <div className="p-0 relative">
                        {/* Task Creation Modal */}
                        {isTaskModalOpen && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                                <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-96 p-6 animate-in fade-in zoom-in duration-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Task</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Target Phase</label>
                                            <select
                                                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={newTaskData.wbs_id}
                                                onChange={(e) => setNewTaskData({ ...newTaskData, wbs_id: e.target.value })}
                                            >
                                                {wbs.map(phase => (
                                                    <option key={phase.id} value={phase.id}>{phase.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Task Name</label>
                                            <input
                                                type="text"
                                                autoFocus
                                                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={newTaskData.name}
                                                onChange={(e) => setNewTaskData({ ...newTaskData, name: e.target.value })}
                                                placeholder="e.g. Server Configuration"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full text-sm border border-slate-300 rounded-lg p-2 outline-none"
                                                    value={newTaskData.start_date}
                                                    onChange={(e) => setNewTaskData({ ...newTaskData, start_date: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full text-sm border border-slate-300 rounded-lg p-2 outline-none"
                                                    value={newTaskData.end_date}
                                                    onChange={(e) => setNewTaskData({ ...newTaskData, end_date: e.target.value })}
                                                    min={newTaskData.start_date}
                                                />
                                            </div>
                                        </div>
                                        {/* Duration Preview */}
                                        <div className="bg-slate-50 p-2 rounded text-xs text-slate-500 text-center border border-slate-100">
                                            Auto-Calculated Duration: <span className="font-bold text-slate-800">
                                                {newTaskData.start_date && newTaskData.end_date
                                                    ? Math.max(1, Math.ceil((new Date(newTaskData.end_date) - new Date(newTaskData.start_date)) / (1000 * 60 * 60 * 24)))
                                                    : '-'} Days
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-2">
                                        <button
                                            onClick={() => setIsTaskModalOpen(false)}
                                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!newTaskData.name || !newTaskData.start_date || !newTaskData.end_date) return;

                                                await createProjectTask(selectedProjectId, {
                                                    wbs_id: parseInt(newTaskData.wbs_id),
                                                    parent_id: newTaskData.parent_id,
                                                    name: newTaskData.name,
                                                    status: "not_started",
                                                    planned_start: new Date(newTaskData.start_date).toISOString(),
                                                    due_date: new Date(newTaskData.end_date).toISOString()
                                                });
                                                const w = await getProjectWBS(selectedProjectId);
                                                setWbs(w);
                                                setIsTaskModalOpen(false);
                                                setNewTaskData(prev => ({ ...prev, name: '' })); // Reset name only
                                            }}
                                            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                                        >
                                            Save Task
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={async () => {
                                    const phaseName = prompt("Enter new Phase Name (e.g., 4.0 Testing):");
                                    if (phaseName) {
                                        await createProjectWBS(selectedProjectId, { name: phaseName });
                                        const w = await getProjectWBS(selectedProjectId);
                                        setWbs(w);
                                    }
                                }}
                                className="mr-2 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                <Plus size={16} /> Add Phase
                            </button>
                            <button
                                onClick={() => {
                                    if (wbs.length > 0) {
                                        const today = new Date().toISOString().split('T')[0];
                                        setNewTaskData({
                                            wbs_id: wbs[0].id,
                                            parent_id: null,
                                            name: '',
                                            start_date: today,
                                            end_date: today
                                        });
                                        setIsTaskModalOpen(true);
                                    } else {
                                        alert("Please create a Phase first.");
                                    }
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
                            >
                                <Plus size={16} /> Add Task
                            </button>
                        </div>
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold sticky top-0 bg-white z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-slate-200 w-16 text-center">ID</th>
                                        <th className="px-6 py-4 border-b border-slate-200">WBS / Task Name</th>
                                        <th className="px-6 py-4 border-b border-slate-200">Assignee</th>
                                        <th className="px-6 py-4 border-b border-slate-200">Duration</th>
                                        <th className="px-6 py-4 border-b border-slate-200">Start - Finish</th>
                                        <th className="px-6 py-4 border-b border-slate-200 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {wbs.map((phase, pIdx) => (
                                        <>
                                            <tr key={`phase-${phase.id}`} className="group bg-slate-50/50">
                                                <td className="px-6 py-3 text-xs font-bold text-slate-400 text-center">{pIdx + 1}</td>
                                                <td colSpan={4} className="px-6 py-3 font-bold text-slate-800 flex items-center gap-2">
                                                    <Layers size={16} className="text-slate-500" />
                                                    {phase.name}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => openEditWbsModal(phase)}
                                                            className="p-1 text-slate-300 hover:text-blue-500 transition-colors"
                                                            title="Edit Phase"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteWBS(phase.id)}
                                                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                            title="Delete Phase"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {(() => {
                                                const renderRecursive = (items, parentId = null, depth = 0, prefix = '') => {
                                                    return items
                                                        .filter(t => t.parent_id === parentId)
                                                        .map((task, tIdx) => {
                                                            const currentPrefix = prefix ? `${prefix}.${tIdx + 1}` : `${pIdx + 1}.${tIdx + 1}`;
                                                            const start = new Date(task.planned_start || task.created_at || Date.now());
                                                            const end = new Date(task.due_date);
                                                            const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

                                                            return (
                                                                <React.Fragment key={task.id}>
                                                                    <tr className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                                                                        <td className="px-6 py-4 text-xs text-slate-400 text-center font-mono">{currentPrefix}</td>
                                                                        <td className="px-6 py-4 text-sm text-slate-700 relative" style={{ paddingLeft: `${depth * 24 + 48}px` }}>
                                                                            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-100"></div>
                                                                            <div className="absolute left-6 top-1/2 w-4 h-px bg-slate-200"></div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium">{task.name}</span>
                                                                                <button
                                                                                    onClick={() => handleAddSubTask(task)}
                                                                                    className="p-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
                                                                                    title="Add Sub-task"
                                                                                >
                                                                                    <GitBranch size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-sm text-slate-500">
                                                                            {task.assignee ? task.assignee.full_name : 'Unassigned'}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                                                                            {duration}d
                                                                        </td>
                                                                        <td className="px-6 py-4 text-xs text-slate-500">
                                                                            {task.planned_start ? new Date(task.planned_start).toLocaleDateString() : '-'} - {new Date(task.due_date).toLocaleDateString()}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-center relative">
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                <StatusBadge status={task.status} />
                                                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                                    <button
                                                                                        onClick={() => openEditTaskModal(task)}
                                                                                        className="p-1 text-slate-300 hover:text-blue-500 transition-colors"
                                                                                        title="Edit Task"
                                                                                    >
                                                                                        <Pencil size={14} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDeleteTask(task.id)}
                                                                                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                                                        title="Delete Task"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                    {renderRecursive(items, task.id, depth + 1, currentPrefix)}
                                                                </React.Fragment>
                                                            );
                                                        });
                                                };
                                                return renderRecursive(phase.tasks || []);
                                            })()}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TIMELINE TAB - GANTT VIEW */}
                {activeTab === 'timeline' && (
                    <div className="flex flex-col h-[600px] border border-slate-300 bg-white select-none">
                        <div className="h-10 border-b border-slate-200 bg-slate-50 flex items-center px-4 justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <span className="font-bold">GANTT VISUALIZATION</span>
                                <span className="h-4 w-px bg-slate-300 mx-1"></span>
                                <span>Project Baseline: {new Date(project.start_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        {/* MS Project Header */}
                        <div className="flex text-xs font-bold text-slate-700 bg-slate-100 border-b border-slate-300">
                            <div className="w-12 p-2 border-r border-slate-300 text-center">ID</div>
                            <div className="w-6 p-2 border-r border-slate-300 text-center">i</div>
                            <div className="w-64 p-2 border-r border-slate-300">Task Name</div>
                            <div className="w-24 p-2 border-r border-slate-300">Start</div>
                            <div className="w-24 p-2 border-r border-slate-300">Finish</div>
                            <div className="flex-1 p-2 bg-slate-50 text-center text-slate-400">Timeline</div>
                        </div>

                        {/* Grid Rows */}
                        <div className="overflow-y-auto flex-1 bg-white">
                            {wbs.map((phase, pIdx) => (
                                <div key={`phase-${phase.id}`}>
                                    {/* Phase Row */}
                                    <div className="flex text-xs border-b border-slate-100 bg-slate-50/80 font-bold hover:bg-blue-50">
                                        <div className="w-12 p-1 px-2 border-r border-slate-200 text-right text-slate-500">{pIdx + 1}</div>
                                        <div className="w-6 p-1 border-r border-slate-200 text-center">
                                            <Layers size={10} className="mx-auto text-slate-500" />
                                        </div>
                                        <div className="w-64 p-1 px-2 border-r border-slate-200 truncate uppercase text-slate-800">
                                            {phase.name}
                                        </div>
                                        <div className="w-24 p-1 border-r border-slate-200"></div>
                                        <div className="w-24 p-1 border-r border-slate-200"></div>
                                        <div className="flex-1 p-1 relative bg-slate-50/30"></div>
                                    </div>

                                    {/* Task Rows */}
                                    {(() => {
                                        const renderTimelineRecursive = (items, parentId = null, depth = 0, prefix = '') => {
                                            return items
                                                .filter(t => t.parent_id === parentId)
                                                .map((task, tIdx) => {
                                                    const currentPrefix = prefix ? `${prefix}.${tIdx + 1}` : `${pIdx + 1}.${tIdx + 1}`;
                                                    const start = new Date(task.planned_start || task.created_at || Date.now());
                                                    const end = new Date(task.due_date);
                                                    const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
                                                    const projStart = new Date(project.start_date);
                                                    const offsetDays = Math.max(0, Math.floor((start - projStart) / (1000 * 60 * 60 * 24)));
                                                    const width = duration * 10;
                                                    const left = offsetDays * 10;

                                                    return (
                                                        <React.Fragment key={task.id}>
                                                            <div className="flex text-xs border-b border-slate-100 hover:bg-blue-50 group">
                                                                <div className="w-12 p-1 px-2 border-r border-slate-200 text-right text-slate-400">{currentPrefix}</div>
                                                                <div className="w-6 p-1 border-r border-slate-200 text-center">
                                                                    <div className={clsx("w-3 h-3 mx-auto mt-0.5 rounded-sm",
                                                                        task.status === 'completed' ? "bg-blue-500" :
                                                                            task.status === 'in_progress' ? "bg-green-500" : "bg-slate-300"
                                                                    )}></div>
                                                                </div>
                                                                <div className="w-64 p-1 truncate relative" style={{ paddingLeft: `${depth * 12 + 24}px`, borderRight: '1px solid #e2e8f0' }}>
                                                                    <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200"></div>
                                                                    <div className="absolute left-2 top-1/2 w-3 h-px bg-slate-200"></div>
                                                                    {task.name}
                                                                </div>
                                                                <div className="w-24 p-1 border-r border-slate-200 text-slate-600">
                                                                    {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                </div>
                                                                <div className="w-24 p-1 border-r border-slate-200 text-slate-600">
                                                                    {end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                </div>

                                                                {/* Gantt Bar Visualization */}
                                                                <div className="flex-1 relative border-l border-slate-100 bg-white">
                                                                    <div className="absolute inset-0 flex">
                                                                        {[...Array(20)].map((_, i) => (
                                                                            <div key={i} className="flex-1 border-r border-slate-50"></div>
                                                                        ))}
                                                                    </div>
                                                                    <div className={clsx(
                                                                        "absolute top-1.5 h-3 rounded-sm shadow-sm opacity-80 min-w-[4px]",
                                                                        task.status === 'completed' ? 'bg-blue-500' :
                                                                            task.status === 'in_progress' ? 'bg-green-500' : 'bg-slate-400'
                                                                    )}
                                                                        style={{
                                                                            left: `${Math.min(left, 400)}px`,
                                                                            width: `${width}px`
                                                                        }}></div>
                                                                    <div className="absolute top-1 text-[10px] text-slate-400 whitespace-nowrap"
                                                                        style={{ left: `${Math.min(left, 400) + width + 5}px` }}
                                                                    >
                                                                        {task.assignee?.full_name?.split(' ')[0]}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {renderTimelineRecursive(items, task.id, depth + 1, currentPrefix)}
                                                        </React.Fragment>
                                                    );
                                                });
                                        };
                                        return renderTimelineRecursive(phase.tasks || []);
                                    })()}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PAYMENTS TAB */}
                {activeTab === 'payments' && (
                    <div className="p-0">
                        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-200 bg-slate-50/30">
                            <div className="p-6 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase">Total Planned</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">MYR {payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</p>
                            </div>
                            <div className="p-6 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase">Actual Paid</p>
                                <p className="text-xl font-bold text-emerald-600 mt-1">
                                    MYR {payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-6 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase">Outstanding</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">
                                    MYR {payments.filter(p => p.status !== 'paid').reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border-b border-slate-100 bg-white flex justify-end">
                            <button
                                onClick={() => openPaymentModal()}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
                            >
                                <Plus size={16} /> Schedule Payment
                            </button>
                        </div>

                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white text-xs uppercase text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4 border-b border-slate-200">Milestone / Item</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Details</th>
                                    <th className="px-6 py-4 border-b border-slate-200 text-right">Amount (MYR)</th>
                                    <th className="px-6 py-4 border-b border-slate-200 text-center">Status</th>
                                    <th className="px-6 py-4 border-b border-slate-200"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map(pay => (
                                    <tr key={pay.id} className="group hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-900 text-sm">{pay.title}</p>
                                            <p className="text-xs text-slate-500 mt-1">{pay.vendor_name || 'TBD Vendor'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                {pay.payment_type.toUpperCase()}
                                            </span>
                                            <p className="text-xs text-slate-500 mt-1">Due: {new Date(pay.planned_date).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {pay.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleTogglePaymentStatus(pay)}
                                                className="hover:scale-105 transition-transform"
                                                title="Click to toggle status"
                                            >
                                                <StatusBadge status={pay.status} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openPaymentModal(pay)}
                                                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Edit Payment"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePayment(pay.id)}
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Delete Payment"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* FILES TAB */}
                {activeTab === 'files' && (
                    <div className="p-10 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Layers size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Project Files</h3>
                        <p className="text-slate-500 mt-2">No files uploaded yet.</p>
                        <button className="mt-6 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm">
                            Upload Document
                        </button>
                    </div>
                )}
            </div>

            {/* Edit Project Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-[600px] animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Edit Project Details</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Code</label>
                                <input
                                    className="w-full border p-2 rounded-lg bg-slate-50 border-slate-200 outline-none font-mono uppercase"
                                    value={editFormData.code || ''}
                                    onChange={e => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name</label>
                                <input
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 border-slate-200 outline-none"
                                    value={editFormData.name}
                                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                <select
                                    className="w-full border p-2 rounded-lg bg-slate-50 border-slate-200 outline-none"
                                    value={editFormData.status}
                                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                                >
                                    <option value="on_track">On Track</option>
                                    <option value="at_risk">At Risk</option>
                                    <option value="delayed">Delayed</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">CAPEX Budget (MYR)</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded-lg border-slate-200 outline-none"
                                    value={editFormData.budget_capex}
                                    onChange={e => setEditFormData({ ...editFormData, budget_capex: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Main Coordinator</label>
                                <select
                                    className="w-full border p-2 rounded-lg bg-blue-50 border-blue-200 outline-none"
                                    value={editFormData.owner_id}
                                    onChange={e => setEditFormData({ ...editFormData, owner_id: e.target.value })}
                                >
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Assist Coordinator</label>
                                <select
                                    className="w-full border p-2 rounded-lg bg-indigo-50 border-indigo-200 outline-none"
                                    value={editFormData.assist_coordinator_id}
                                    onChange={e => setEditFormData({ ...editFormData, assist_coordinator_id: e.target.value })}
                                >
                                    <option value="">None</option>
                                    {users.filter(u => u.id !== parseInt(editFormData.owner_id)).map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded-lg border-slate-200 outline-none"
                                    value={editFormData.start_date}
                                    onChange={e => setEditFormData({ ...editFormData, start_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded-lg border-slate-200 outline-none"
                                    value={editFormData.end_date}
                                    onChange={e => setEditFormData({ ...editFormData, end_date: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="w-full border p-2 rounded-lg h-24 border-slate-200 outline-none"
                                    value={editFormData.description}
                                    onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                            <button onClick={handleUpdateProject} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-all active:scale-95">
                                Update Project
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-[500px] animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                {selectedPayment ? 'Edit Payment' : 'Schedule New Payment'}
                            </h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Title / Milestone</label>
                                <input
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 border-slate-200 outline-none"
                                    value={paymentFormData.title}
                                    onChange={e => setPaymentFormData({ ...paymentFormData, title: e.target.value })}
                                    placeholder="e.g. Mobilization 10%"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Vendor Name</label>
                                <input
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 border-slate-200 outline-none"
                                    value={paymentFormData.vendor_name}
                                    onChange={e => setPaymentFormData({ ...paymentFormData, vendor_name: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (MYR)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded-lg border-slate-200 outline-none"
                                        value={paymentFormData.amount}
                                        onChange={e => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Planned Date (Due)</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded-lg border-slate-200 outline-none"
                                        value={paymentFormData.planned_date}
                                        onChange={e => setPaymentFormData({ ...paymentFormData, planned_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Type</label>
                                    <select
                                        className="w-full border p-2 rounded-lg bg-slate-50 border-slate-200 outline-none"
                                        value={paymentFormData.payment_type}
                                        onChange={e => setPaymentFormData({ ...paymentFormData, payment_type: e.target.value })}
                                    >
                                        <option value="capex">CAPEX</option>
                                        <option value="opex">OPEX</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                    <select
                                        className="w-full border p-2 rounded-lg bg-slate-50 border-slate-200 outline-none"
                                        value={paymentFormData.status}
                                        onChange={e => setPaymentFormData({ ...paymentFormData, status: e.target.value })}
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="claimed">Claimed</option>
                                        <option value="verified">Verified</option>
                                        <option value="approved">Approved</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePayment}
                                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                {selectedPayment ? 'Update Payment' : 'Schedule Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* WBS Phase Edit Modal */}
            {isEditWBSModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-[400px] animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Edit WBS Phase</h2>
                            <button onClick={() => setIsEditWBSModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Phase Name</label>
                                <input
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 border-slate-200 outline-none font-bold"
                                    value={wbsFormData.name}
                                    onChange={e => setWbsFormData({ name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setIsEditWBSModalOpen(false)} className="px-6 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleSaveWbs} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Edit Modal */}
            {isEditTaskModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-[500px] animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Edit Task Details</h2>
                            <button onClick={() => setIsEditTaskModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Task Name</label>
                                <input
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 border-slate-200 outline-none"
                                    value={taskFormData.name}
                                    onChange={e => setTaskFormData({ ...taskFormData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Assignee</label>
                                    <select
                                        className="w-full border p-2 rounded-lg border-slate-200 outline-none bg-slate-50"
                                        value={taskFormData.assignee_id}
                                        onChange={e => setTaskFormData({ ...taskFormData, assignee_id: e.target.value })}
                                    >
                                        <option value="">Unassigned</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                    <select
                                        className="w-full border p-2 rounded-lg border-slate-200 outline-none bg-slate-50"
                                        value={taskFormData.status}
                                        onChange={e => setTaskFormData({ ...taskFormData, status: e.target.value })}
                                    >
                                        <option value="not_started">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="blocked">Blocked</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded-lg border-slate-200 outline-none"
                                        value={taskFormData.planned_start}
                                        onChange={e => setTaskFormData({ ...taskFormData, planned_start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Finish Date (Due)</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded-lg border-slate-200 outline-none"
                                        value={taskFormData.due_date}
                                        onChange={e => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setIsEditTaskModalOpen(false)} className="px-6 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleSaveTask} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-lg shadow-blue-200">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
