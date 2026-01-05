import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  HiHome, 
  HiUpload, 
  HiDocumentText, 
  HiCog,
  HiLogout,
  HiMenuAlt2,
  HiX,
  HiBell,
  HiSearch
} from 'react-icons/hi';
import Logo from '../../components/Logo';
import PortalSwitcher from '../../components/PortalSwitcher';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: HiHome, path: '/dashboard' },
    { name: 'Upload Certificate', icon: HiUpload, path: '/dashboard/upload' },
    { name: 'My Certificates', icon: HiDocumentText, path: '/dashboard/certificates' },
    { name: 'Settings', icon: HiCog, path: '/dashboard/settings' },
  ];

  const handleLogout = () => {
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
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
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
                  end={item.path === '/dashboard'}
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
              
              <div className="hidden sm:flex items-center gap-3 bg-dark-100/50 rounded-xl px-4 py-2.5 w-80">
                <HiSearch className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search certificates..."
                  className="bg-transparent border-none outline-none text-white placeholder-gray-400 w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5">
                <HiBell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 
                  flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div className="hidden sm:block">
                  <div className="text-white font-medium text-sm">John Doe</div>
                  <div className="text-gray-400 text-xs">john@example.com</div>
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

export default UserDashboard;
