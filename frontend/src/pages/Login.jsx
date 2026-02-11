import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { LayoutDashboard, Loader2, Kanban } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await login(username, password);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('full_name', data.full_name);

            // Redirect based on role
            switch (data.role) {
                case 'admin':
                    navigate('/admin');
                    break;
                case 'hod':
                    navigate('/portfolio');
                    break;
                case 'finance':
                    navigate('/finance');
                    break;
                case 'staff':
                    navigate('/dashboard');
                    break;
                default:
                    navigate('/');
            }
        } catch (err) {
            console.error("Login Failure:", err);
            setError(`Login failed: ${err.message || 'Invalid credentials'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-40 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/40 z-10 p-10 ring-1 ring-slate-200/50">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-200 mb-6 border border-white/20 transform hover:rotate-3 transition-transform duration-500">
                        <Kanban size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center">ISTMO Department</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1.5 opacity-60">Project Management System</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity UID</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-slate-200/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium placeholder:text-slate-300"
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Token</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-slate-200/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium placeholder:text-slate-300"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2 animate-shake">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : (
                            <>
                                Authenticate System <LayoutDashboard size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        Internal Authorized Access Only • Secure System
                    </p>
                </div>
            </div>
        </div>
    );
}
