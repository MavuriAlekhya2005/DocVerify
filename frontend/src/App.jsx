import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyPage from './pages/VerifyPage';

// Dashboard Pages
import UserDashboard from './pages/dashboard/UserDashboard';
import VerifierDashboard from './pages/dashboard/VerifierDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

// User Dashboard Sub-pages
import UploadCertificate from './pages/dashboard/user/UploadCertificate';
import MyCertificates from './pages/dashboard/user/MyCertificates';
import CertificateDetails from './pages/dashboard/user/CertificateDetails';

// Admin Dashboard Sub-pages
import BulkIssuance from './pages/dashboard/admin/BulkIssuance';
import ManageCertificates from './pages/dashboard/admin/ManageCertificates';
import Analytics from './pages/dashboard/admin/Analytics';
import IssueCertificate from './pages/dashboard/admin/IssueCertificate';

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
        
        {/* Redirect /verify to /verifier */}
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/verify/:id" element={<VerifyPage />} />
        
        {/* User Dashboard Routes */}
        <Route path="/dashboard" element={<UserDashboard />}>
          <Route index element={<MyCertificates />} />
          <Route path="upload" element={<UploadCertificate />} />
          <Route path="certificates" element={<MyCertificates />} />
          <Route path="certificates/:id" element={<CertificateDetails />} />
        </Route>
        
        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<Analytics />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="issue" element={<IssueCertificate />} />
          <Route path="bulk-issue" element={<BulkIssuance />} />
          <Route path="manage" element={<ManageCertificates />} />
        </Route>
        
        {/* Verifier Dashboard Routes - Main verification portal */}
        <Route path="/verifier" element={<VerifierDashboard />}>
          <Route index element={<ScanVerify />} />
          <Route path="scan" element={<ScanVerify />} />
          <Route path="history" element={<VerificationHistory />} />
          <Route path=":id" element={<ScanVerify />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
