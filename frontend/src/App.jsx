import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PortfolioPanel from './pages/PortfolioPanel';
import ProjectWorkspace from './pages/ProjectWorkspace';
import DashboardLayout from './components/DashboardLayout';

import FinanceDashboard from './pages/FinanceDashboard';
import DocumentController from './pages/DocumentController';
import StaffDashboard from './pages/StaffDashboard';
import StaffDirectory from './pages/StaffDirectory';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const DashboardPlaceholder = ({ title }) => (
  <div className="p-8 text-center text-slate-500">
    <h2 className="text-xl font-bold">{title}</h2>
    <p>Coming soon...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><StaffDashboard /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><PortfolioPanel /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
        <Route path="/workspace" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><DocumentController /></ProtectedRoute>} />
        <Route path="/admin/staff" element={<ProtectedRoute><StaffDirectory /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
