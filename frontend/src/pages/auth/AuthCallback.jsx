import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      toast.error(error);
      navigate('/login');
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store auth data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        toast.success(`Welcome, ${user.name}!`);
        
        // Navigate based on role
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'verifier') {
          navigate('/verifier');
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Failed to parse user data:', err);
        toast.error('Authentication failed');
        navigate('/login');
      }
    } else {
      toast.error('Authentication failed');
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-dark-300 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600/20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Signing you in...</h2>
        <p className="text-gray-400">Please wait while we complete authentication</p>
      </div>
    </div>
  );
};

export default AuthCallback;
