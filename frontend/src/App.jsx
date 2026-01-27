import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import GlobalBackground from './components/animations/GlobalBackground/GlobalBackground';
import TargetCursor from './components/animations/TargetCursor/TargetCursor';
import { AuthProvider } from './contexts/AuthContext';
import './components/animations/GlobalBackground/GlobalBackground.css';

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center glass-container p-8 rounded-2xl">
      <div className="w-12 h-12 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-300">Loading...</p>
    </div>
  </div>
);

// Lazy loaded pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));

// Components (not lazy loaded as they're small)
import ProtectedRoute from './components/ProtectedRoute';

// Dashboard Pages
const UserDashboard = lazy(() => import('./pages/dashboard/UserDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));

// User Dashboard Sub-pages
const UploadCertificate = lazy(() => import('./pages/dashboard/user/UploadCertificate'));
const MyCertificates = lazy(() => import('./pages/dashboard/user/MyCertificates'));
const CertificateDetails = lazy(() => import('./pages/dashboard/user/CertificateDetails'));
const SelectTemplate = lazy(() => import('./pages/dashboard/user/SelectTemplate'));
const DocumentEditor = lazy(() => import('./pages/dashboard/user/DocumentEditor'));
const IssueDocument = lazy(() => import('./pages/dashboard/user/IssueDocument'));

// Admin Dashboard Sub-pages
const BulkIssuance = lazy(() => import('./pages/dashboard/admin/BulkIssuance'));
const ManageCertificates = lazy(() => import('./pages/dashboard/admin/ManageCertificates'));
const Analytics = lazy(() => import('./pages/dashboard/admin/Analytics'));
const Users = lazy(() => import('./pages/dashboard/admin/Users'));

// Settings page
const Settings = lazy(() => import('./pages/dashboard/Settings'));

function AppContent() {
  const location = useLocation();
  
  // Show galaxy background on landing page, login, and register pages
  const showGalaxyBackground = ['/', '/login', '/register'].includes(location.pathname);
  
  return (
    <>
      {/* Global Background - Full viewport galaxy */}
      {showGalaxyBackground && <GlobalBackground />}
      
      {/* Global Custom Cursor - Target style with spinning corners */}
      <TargetCursor 
        spinDuration={2}
        hideDefaultCursor
        parallaxOn
        hoverDuration={0.2}
      />
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
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
      
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Public verification routes - No authentication required */}
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
          </Routes>
        </Suspense>
      </AuthProvider>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
