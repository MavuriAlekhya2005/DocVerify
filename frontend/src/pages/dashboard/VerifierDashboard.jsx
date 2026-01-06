import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  HiQrcode, 
  HiClipboardList, 
  HiCog,
  HiLogout,
  HiMenuAlt2,
  HiX,
  HiBell,
  HiSearch
} from 'react-icons/hi';
import Logo from '../../components/Logo';
import PortalSwitcher from '../../components/PortalSwitcher';
import api from '../../services/api';

const VerifierDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = api.getCurrentUser();

  const getInitials = (name) => {
    if (!name) return 'V';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const menuItems = [
    { name: 'Scan & Verify', icon: HiQrcode, path: '/verifier' },
    { name: 'Verification History', icon: HiClipboardList, path: '/verifier/history' },
    { name: 'Settings', icon: HiCog, path: '/verifier/settings' },
  ];

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-300 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-dark-200 border-r border-white/10">
        <div className="p-6">
          <NavLink to="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="text-xl font-bold text-white font-display">DocVerify</span>
          </NavLink>
          <div className="mt-2 px-2 py-1 bg-accent-600/20 text-accent-400 text-xs font-medium rounded-md inline-block">
            Verifier Portal
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/verifier'}
              className={({ isActive }) =>
                isActive ? 'sidebar-link-active' : 'sidebar-link'
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <PortalSwitcher />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 
              rounded-xl hover:bg-red-500/10 transition-all"
          >
            <HiLogout className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)}></div>
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-dark-200 border-r border-white/10">
            <div className="p-6 flex items-center justify-between">
              <NavLink to="/" className="flex items-center gap-2">
                <Logo className="h-10 w-10" />
                <span className="text-xl font-bold text-white font-display">DocVerify</span>
              </NavLink>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            <nav className="px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/verifier'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    isActive ? 'sidebar-link-active' : 'sidebar-link'
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 
                  rounded-xl hover:bg-red-500/10 transition-all"
              >
                <HiLogout className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-dark-200/50 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <HiMenuAlt2 className="w-6 h-6" />
              </button>
              
              <h1 className="text-white font-semibold hidden sm:block">Certificate Verification</h1>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5">
                <HiBell className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-600 to-primary-600 
                  flex items-center justify-center text-white font-bold">
                  {getInitials(user?.name)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-white font-medium text-sm">{user?.name || 'Verifier'}</div>
                  <div className="text-gray-400 text-xs capitalize">{user?.role || 'verifier'}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VerifierDashboard;
