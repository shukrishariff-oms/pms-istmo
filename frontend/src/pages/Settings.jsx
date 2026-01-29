import { useState, useEffect } from 'react';
import { User, Lock, Users, Plus, X, Search, Shield, Briefcase, Trash2, Pencil } from 'lucide-react';
import clsx from 'clsx';

const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : "";

export default function Settings() {
    const [activeTab, setActiveTab] = useState('general');

    // User Management State
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null); // Track if we are editing
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'staff',
        department_id: ''
    });

    useEffect(() => {
        if (activeTab === 'team') {
            loadTeamData();
        }
    }, [activeTab]);

    async function loadTeamData() {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [usersRes, deptsRes] = await Promise.all([
                fetch(`${API_URL}/users/`, { headers }),
                fetch(`${API_URL}/users/departments`, { headers })
            ]);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (deptsRes.ok) setDepartments(await deptsRes.json());
        } catch (err) {
            console.error("Failed to load team data", err);
        }
    }

    function openAddModal() {
        setEditingUserId(null);
        setNewUser({ username: '', email: '', full_name: '', password: '', role: 'staff', department_id: '' });
        setIsAddUserModalOpen(true);
    }

    function openEditModal(user) {
        setEditingUserId(user.id);
        setNewUser({
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            password: '', // Don't fill password on edit
            role: user.role,
            department_id: user.department_id || ''
        });
        setIsAddUserModalOpen(true);
    }

    async function handleSaveUser() {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const payload = {
                ...newUser,
                department_id: newUser.department_id ? parseInt(newUser.department_id) : null
            };

            // Remove password if empty during edit (so we don't overwrite with empty string)
            if (editingUserId && !payload.password) {
                delete payload.password;
            }

            let response;
            if (editingUserId) {
                // UPDATE
                response = await fetch(`${API_URL}/users/${editingUserId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            } else {
                // CREATE
                response = await fetch(`${API_URL}/users/`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.detail || "Failed to save user");
                return;
            }

            setIsAddUserModalOpen(false);
            setEditingUserId(null);
            setNewUser({ username: '', email: '', full_name: '', password: '', role: 'staff', department_id: '' });
            loadTeamData();
            alert(editingUserId ? "User updated successfully" : "User created successfully");
        } catch (err) {
            alert("Failed to save user");
        }
    }

    async function handleDeleteUser(id) {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const err = await response.json();
                alert(err.detail || "Failed to delete user");
                return;
            }

            loadTeamData();
        } catch (error) {
            alert("Failed to delete user");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
                    <p className="text-slate-500">Manage application preferences and team access.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={clsx(
                            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === 'general'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                        )}
                    >
                        General & Security
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={clsx(
                            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === 'team'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                        )}
                    >
                        Team Management
                    </button>
                </nav>
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <User size={20} />
                                </div>
                                <h3 className="font-bold text-slate-800">Profile Settings</h3>
                            </div>
                            <button className="text-xs font-bold text-blue-600 hover:underline">Edit</button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Update your personal information and profile picture.</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <Lock size={20} />
                                </div>
                                <h3 className="font-bold text-slate-800">Security</h3>
                            </div>
                            <button className="text-xs font-bold text-blue-600 hover:underline">Change</button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Change password and manage 2FA settings.</p>
                    </div>
                </div>
            )}

            {/* Team Management Tab */}
            {activeTab === 'team' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Users size={18} className="text-blue-500" /> Team Members
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Manage user access and roles.</p>
                            </div>
                            <button
                                onClick={openAddModal}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus size={14} /> Add User
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white text-xs uppercase text-slate-500 font-semibold border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Department</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                        {user.full_name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{user.full_name}</p>
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={clsx("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide",
                                                    user.role === 'admin' ? "bg-purple-100 text-purple-700" :
                                                        user.role === 'hod' ? "bg-blue-100 text-blue-700" :
                                                            "bg-slate-100 text-slate-600"
                                                )}>
                                                    <Shield size={10} className="inline mr-1 mb-0.5" />
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                {departments.find(d => d.id === user.department_id)?.name || <span className="text-slate-400 italic">None</span>}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete User"
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
                        {users.length === 0 && (
                            <div className="p-8 text-center text-slate-400 bg-white">Loading users...</div>
                        )}
                    </div>
                </div>
            )}

            {/* Add/Edit User Modal */}
            {isAddUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px] animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingUserId ? "Edit Team Member" : "Add New Team Member"}
                            </h3>
                            <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                    <input
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="John Doe"
                                        value={newUser.full_name}
                                        onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Username</label>
                                    <input
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="johndoe"
                                        value={newUser.username}
                                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="john@example.com"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    disabled={!!editingUserId} // Optional: disable email edit if unique
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                    Password {editingUserId && <span className="font-normal text-slate-400">(Leave blank to keep current)</span>}
                                </label>
                                <input
                                    type="password"
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder={editingUserId ? "••••••••" : "Create password"}
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="hod">HOD</option>
                                        <option value="admin">Admin</option>
                                        <option value="finance">Finance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                                        value={newUser.department_id}
                                        onChange={e => setNewUser({ ...newUser, department_id: e.target.value })}
                                    >
                                        <option value="">None</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-2">
                            <button onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleSaveUser} className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">
                                {editingUserId ? "Save Changes" : "Create User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
