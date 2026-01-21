import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AuthCallback from './pages/auth/AuthCallback';
import VerifyPage from './pages/VerifyPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Dashboard Pages
import UserDashboard from './pages/dashboard/UserDashboard';
import VerifierDashboard from './pages/dashboard/VerifierDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

// User Dashboard Sub-pages
import UploadCertificate from './pages/dashboard/user/UploadCertificate';
import MyCertificates from './pages/dashboard/user/MyCertificates';
import CertificateDetails from './pages/dashboard/user/CertificateDetails';
import SelectTemplate from './pages/dashboard/user/SelectTemplate';
import DocumentEditor from './pages/dashboard/user/DocumentEditor';
import IssueDocument from './pages/dashboard/user/IssueDocument';

// Admin Dashboard Sub-pages
import BulkIssuance from './pages/dashboard/admin/BulkIssuance';
import ManageCertificates from './pages/dashboard/admin/ManageCertificates';
import Analytics from './pages/dashboard/admin/Analytics';
import Users from './pages/dashboard/admin/Users';

// Settings page
import Settings from './pages/dashboard/Settings';

// Verifier Dashboard Sub-pages
import ScanVerify from './pages/dashboard/verifier/ScanVerify';
import VerificationHistory from './pages/dashboard/verifier/VerificationHistory';

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Public verification routes */}
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/verify/:id" element={<VerifyPage />} />
        
        {/* Standalone Document Editor (opens in new window) */}
        <Route path="/editor" element={
          <ProtectedRoute allowedRoles={['user', 'institution', 'admin']}>
            <DocumentEditor />
          </ProtectedRoute>
        } />
        
        {/* Protected User Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['user', 'institution', 'admin']}>
            <UserDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<MyCertificates />} />
          <Route path="create" element={<SelectTemplate />} />
          <Route path="bulk-issue" element={<BulkIssuance />} />
          <Route path="upload" element={<UploadCertificate />} />
          <Route path="certificates" element={<MyCertificates />} />
          <Route path="certificates/:id" element={<CertificateDetails />} />
          <Route path="documents/:id" element={<CertificateDetails />} />
          <Route path="settings" element={<Settings userRole="user" />} />
        </Route>
        
        {/* Protected Admin Dashboard Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'institution']}>
            <AdminDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<Analytics />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="issue" element={<IssueDocument />} />
          <Route path="bulk-issue" element={<BulkIssuance />} />
          <Route path="manage" element={<ManageCertificates />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings userRole="admin" />} />
        </Route>
        
        {/* Protected Verifier Dashboard Routes */}
        <Route path="/verifier" element={
          <ProtectedRoute allowedRoles={['verifier', 'admin', 'institution', 'user']}>
            <VerifierDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<ScanVerify />} />
          <Route path="scan" element={<ScanVerify />} />
          <Route path="history" element={<VerificationHistory />} />
          <Route path="settings" element={<Settings userRole="verifier" />} />
          <Route path=":id" element={<ScanVerify />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
