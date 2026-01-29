import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, deleteProject, updateProject } from '../services/projects';
import { Users, Plus, ShieldCheck, Calendar, Wallet, Trash2, Pencil } from 'lucide-react';
import clsx from 'clsx';

const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : "";

export default function AdminDashboard() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]); // Real users
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        owner_id: '',
        assist_coordinator_id: '',
        budget_capex: 500000,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [projRes, userRes] = await Promise.all([
                getProjects(),
                fetch(`${API_URL}/users/`, { headers })
            ]);

            setProjects(projRes);
            if (userRes.ok) setUsers(await userRes.json());
        } catch (err) {
            console.error(err);
        }
    }

    function openCreateModal() {
        setEditingProjectId(null);
        setFormData({
            code: '',
            name: '',
            description: '',
            owner_id: '',
            assist_coordinator_id: '',
            budget_capex: 500000,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    }

    function openEditModal(p) {
        setEditingProjectId(p.id);
        setFormData({
            code: p.code,
            name: p.name,
            description: p.description || '',
            owner_id: p.owner_id || '',
            assist_coordinator_id: p.assist_coordinator_id || '',
            budget_capex: p.budget_capex,
            start_date: p.start_date.split('T')[0],
            end_date: p.end_date.split('T')[0]
        });
        setIsModalOpen(true);
    }

    async function handleSave() {
        try {
            const payload = {
                ...formData,
                owner_id: parseInt(formData.owner_id),
                assist_coordinator_id: formData.assist_coordinator_id ? parseInt(formData.assist_coordinator_id) : null,
                budget_capex: parseFloat(formData.budget_capex),
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString()
            };

            if (editingProjectId) {
                await updateProject(editingProjectId, payload);
                alert("Project updated successfully!");
            } else {
                await createProject(payload);
                alert("Project created and assigned successfully!");
            }

            setIsModalOpen(false);
            loadData();
        } catch (err) {
            alert(`Failed to ${editingProjectId ? 'update' : 'create'} project: ` + err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Are you sure you want to delete this project? This will permanently remove all associated data, including WBS items and payments.")) return;

        try {
            await deleteProject(id);
            loadData();
            alert("Project deleted successfully");
        } catch (err) {
            alert("Failed to delete project: " + err.message);
        }
    }

    const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="text-blue-600" /> Admin Console
                    </h1>
                    <p className="text-slate-500">Manage system projects and assignments.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium"
                >
                    <Plus size={18} /> Assign New Project
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-[600px] animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">
                            {editingProjectId ? "Edit Project" : "Create & Assign Project"}
                        </h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name</label>
                                <input className="w-full border p-2 rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Data Center Upgrade" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Code</label>
                                <input className="w-full border p-2 rounded-lg font-mono uppercase" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="PRJ-2026-001" disabled={!!editingProjectId} />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Main Coordinator</label>
                                <select
                                    className="w-full border p-2 rounded-lg bg-blue-50 border-blue-200"
                                    value={formData.owner_id}
                                    onChange={e => setFormData({ ...formData, owner_id: e.target.value })}
                                >
                                    <option value="">Select Staff</option>
                                    {users.filter(u => ['staff', 'hod', 'admin'].includes(u.role)).map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Assist Coordinator</label>
                                <select
                                    className="w-full border p-2 rounded-lg bg-indigo-50 border-indigo-200"
                                    value={formData.assist_coordinator_id}
                                    onChange={e => setFormData({ ...formData, assist_coordinator_id: e.target.value })}
                                >
                                    <option value="">None</option>
                                    {users.filter(u => ['staff', 'hod', 'admin'].includes(u.role) && u.id !== parseInt(formData.owner_id)).map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                                <input type="date" className="w-full border p-2 rounded-lg" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                                <input type="date" className="w-full border p-2 rounded-lg" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">CAPEX Budget (MYR)</label>
                                <input type="number" className="w-full border p-2 rounded-lg" value={formData.budget_capex} onChange={e => setFormData({ ...formData, budget_capex: e.target.value })} />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                                <textarea className="w-full border p-2 rounded-lg h-24" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} ></textarea>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
                                {editingProjectId ? "Update Project" : "Create & Assign"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Project</th>
                            <th className="px-6 py-4">Coordinators</th>
                            <th className="px-6 py-4">Dates</th>
                            <th className="px-6 py-4">Budget</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {projects.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-900">{p.name}</p>
                                    <p className="text-xs text-slate-500 font-mono">{p.code}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2" title="Main Coordinator">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                {getInitials(p.owner?.full_name)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">{p.owner?.full_name || 'Unassigned'}</p>
                                                <p className="text-[10px] text-blue-600 font-bold uppercase">Main</p>
                                            </div>
                                        </div>
                                        {p.assist_coordinator && (
                                            <div className="flex items-center gap-2" title="Assistant Coordinator">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                                    {getInitials(p.assist_coordinator?.full_name)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{p.assist_coordinator?.full_name}</p>
                                                    <p className="text-[10px] text-indigo-600 font-bold uppercase">Assist</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-slate-700">
                                    {p.budget_capex.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={clsx(
                                        "px-2 py-1 rounded-full text-xs font-bold uppercase border",
                                        p.status === 'completed' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                            p.status === 'delayed' ? "bg-red-100 text-red-700 border-red-200" :
                                                "bg-green-100 text-green-700 border-green-200"
                                    )}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openEditModal(p)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Project"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Project"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
