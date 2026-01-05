import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// This page now redirects to the main verifier portal
const VerifyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main verifier portal
    if (id) {
      navigate(`/verifier/${id}`, { replace: true });
    } else {
      navigate('/verifier', { replace: true });
    }
  }, [id, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-dark-200 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600/20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Redirecting...</h2>
        <p className="text-gray-400">Taking you to the verification portal</p>
      </div>
    </div>
  );
};

export default VerifyPage;
