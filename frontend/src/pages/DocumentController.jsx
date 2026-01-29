import { useState, useEffect } from 'react';
import { getDocuments, createDocument, updateDocument, deleteDocument } from '../services/documents';
import { getProjects } from '../services/projects';
import {
    FileText,
    User,
    Clock,
    Plus,
    Search,
    Filter,
    ArrowRight,
    CheckCircle2,
    MoreVertical,
    Trash2,
    Edit2,
    History,
    ArrowDownRight
} from 'lucide-react';
import clsx from 'clsx';

const StatusBadge = ({ status }) => {
    const styles = {
        pending: "bg-amber-50 text-amber-600 border-amber-200",
        in_progress: "bg-blue-50 text-blue-600 border-blue-200",
        signed: "bg-indigo-50 text-indigo-600 border-indigo-200",
        completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
        lost: "bg-red-50 text-red-600 border-red-200",
        cancelled: "bg-slate-100 text-slate-600 border-slate-300"
    };

    return (
        <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider", styles[status] || styles.pending)}>
            {status?.replace('_', ' ')}
        </span>
    );
};

export default function DocumentController() {
    const [documents, setDocuments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isCorrection, setIsCorrection] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    const [newDoc, setNewDoc] = useState({
        title: '',
        ref_number: '',
        description: '',
        current_holder: '',
        project_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [docs, projs] = await Promise.all([
                getDocuments(),
                getProjects()
            ]);
            setDocuments(docs);
            setProjects(projs);
        } catch (err) {
            console.error("Failed to load documents", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddDocument() {
        if (!newDoc.title || !newDoc.current_holder) return;
        try {
            await createDocument({
                ...newDoc,
                project_id: newDoc.project_id ? parseInt(newDoc.project_id) : null
            });
            setIsCreateModalOpen(false);
            setNewDoc({ title: '', ref_number: '', description: '', current_holder: '', project_id: '' });
            loadData();
        } catch (err) {
            console.error("Add Document Error:", err);
            alert(`Failed to add document: ${err.message || 'Unknown Error'}`);
        }
    }

    async function handleUpdateDocument() {
        if (!selectedDoc) return;
        try {
            await updateDocument(selectedDoc.id, {
                current_holder: selectedDoc.current_holder,
                status: selectedDoc.status,
                description: selectedDoc.description,
                is_correction: isCorrection
            });
            setIsUpdateModalOpen(false);
            setSelectedDoc(null);
            setIsCorrection(false);
            loadData();
        } catch (err) {
            console.error("Update Document Error:", err);
            alert(`Failed to update document: ${err.message || 'Unknown Error'}`);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Are you sure you want to delete this document tracker?")) return;
        try {
            await deleteDocument(id);
            loadData();
        } catch (err) {
            alert("Failed to delete");
        }
    }

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.current_holder.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.ref_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Document Controller</h1>
                    <p className="text-slate-500 text-sm">Track physical documents as they move between stakeholders for signatures.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                >
                    <Plus size={18} /> Log New Document
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Tracked</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{documents.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Pending Signature</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{documents.filter(d => d.status === 'pending').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{documents.filter(d => d.status === 'in_progress').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Signed / Ongoing</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{documents.filter(d => d.status === 'signed').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Completed</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{documents.filter(d => d.status === 'completed').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Lost / Cancelled</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{documents.filter(d => ['lost', 'cancelled'].includes(d.status)).length}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex gap-4 bg-slate-50/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by title, holder or ref number..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Document Details</th>
                                <th className="px-6 py-4">Project</th>
                                <th className="px-6 py-4">Current Location / Holder</th>
                                <th className="px-6 py-4">Last Updated</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDocs.length > 0 ? filteredDocs.map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <FileText size={20} />
                                            </div>
                                            <button
                                                onClick={() => { setSelectedDoc(doc); setIsUpdateModalOpen(true); }}
                                                className="text-left group/title"
                                            >
                                                <p className="font-bold text-slate-900 text-sm group-hover/title:text-blue-600 transition-colors">{doc.title}</p>
                                                {doc.ref_number && <p className="text-xs text-slate-500 font-mono mt-1">{doc.ref_number}</p>}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {doc.project_id ? projects.find(p => p.id === doc.project_id)?.code || 'Unknown' : 'General'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{doc.current_holder}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock size={14} />
                                            {doc.updated_at ? new Date(doc.updated_at).toLocaleString() : new Date(doc.created_at).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <StatusBadge status={doc.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => { setSelectedDoc(doc); setIsUpdateModalOpen(true); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded border border-slate-200 shadow-sm transition-all"
                                                title="View History / Timeline"
                                            >
                                                <History size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedDoc(doc); setIsUpdateModalOpen(true); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 shadow-sm transition-all"
                                                title="Transfer to Next Signer"
                                            >
                                                <ArrowRight size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Transfer</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400 italic">No documents found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-[450px] animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Log New Physical Document</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Document Title</label>
                                <input
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Contract Agreement - Phase 1"
                                    value={newDoc.title}
                                    onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Ref Number (Optional)</label>
                                    <input
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                                        placeholder="REF/2026/001"
                                        value={newDoc.ref_number}
                                        onChange={e => setNewDoc({ ...newDoc, ref_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Related Project</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                                        value={newDoc.project_id}
                                        onChange={e => setNewDoc({ ...newDoc, project_id: e.target.value })}
                                    >
                                        <option value="">General / None</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Initial Location / Holder</label>
                                <input
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Finance Dept (Ahmad)"
                                    value={newDoc.current_holder}
                                    onChange={e => setNewDoc({ ...newDoc, current_holder: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none h-20"
                                    value={newDoc.description}
                                    onChange={e => setNewDoc({ ...newDoc, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleAddDocument} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Start Tracking</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Modal with Timeline */}
            {isUpdateModalOpen && selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-0 w-[800px] flex overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Timeline Side */}
                        <div className="w-1/3 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto max-h-[600px]">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Movement History</h4>
                            <div className="space-y-6 relative">
                                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                                {selectedDoc.logs?.map((log, i) => {
                                    const nextLog = selectedDoc.logs[i + 1];
                                    return (
                                        <div key={log.id} className="relative pl-8">
                                            <div className={clsx("absolute left-0 top-1 w-5 h-5 rounded-full border-2 bg-white z-10",
                                                !nextLog ? "border-blue-500 animate-pulse" : "border-emerald-500"
                                            )}></div>
                                            <p className="text-xs font-bold text-slate-900">{log.to_holder}</p>
                                            <div className="flex flex-col gap-0.5 mt-1 border-l-2 border-slate-100 pl-2 ml-[-21px]">
                                                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <ArrowDownRight size={10} className="text-slate-400" />
                                                    <span className="font-medium">Received:</span> {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                </p>
                                                {log.signed_at && (
                                                    <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                                                        <CheckCircle2 size={10} />
                                                        <span>Signed:</span> {new Date(log.signed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </p>
                                                )}
                                                {nextLog && (
                                                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                        <ArrowRight size={10} />
                                                        <span>Transferred:</span> {new Date(nextLog.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </p>
                                                )}
                                                {!log.signed_at && !nextLog && (
                                                    <p className="text-[10px] text-amber-600 font-bold italic mt-1 animate-bounce">
                                                        ⚡ Pending Signature...
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2 italic leading-tight">{log.note}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Form Side */}
                        <div className="w-2/3 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Transfer / Update Document</h3>
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold text-blue-600 uppercase">Document Information</p>
                                        <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedDoc.title}</p>
                                    </div>
                                    <StatusBadge status={selectedDoc.status} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Move to Next Signer / Holder</label>
                                        <input
                                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
                                            value={selectedDoc.current_holder}
                                            onChange={e => setSelectedDoc({
                                                ...selectedDoc,
                                                current_holder: e.target.value,
                                                status: isCorrection ? selectedDoc.status : 'pending'
                                            })}
                                            placeholder="Enter next person's name"
                                        />
                                        <div className="mt-2 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isCorrection"
                                                checked={isCorrection}
                                                onChange={(e) => setIsCorrection(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300"
                                            />
                                            <label htmlFor="isCorrection" className="text-xs font-bold text-amber-600 cursor-pointer">
                                                Reroute / Correction (Tukar orang tanpa sign)
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Current Status</label>
                                        <select
                                            className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                                            value={selectedDoc.status}
                                            onChange={e => setSelectedDoc({ ...selectedDoc, status: e.target.value })}
                                        >
                                            <option value="pending">Pending Signature</option>
                                            <option value="signed">Signed</option>
                                            <option value="in_progress">In Circulation / Review</option>
                                            <option value="completed">Completed / Filed</option>
                                            <option value="lost">Lost / Missing</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Update Note (What needs to be signed?)</label>
                                    <textarea
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none h-24"
                                        value={selectedDoc.description || ''}
                                        onChange={e => setSelectedDoc({ ...selectedDoc, description: e.target.value })}
                                        placeholder="e.g. Signature needed for Clause 4.2..."
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-2">
                                <button onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
                                <button onClick={handleUpdateDocument} className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                                    <CheckCircle2 size={18} /> Record Transfer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
