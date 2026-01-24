import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  HiHome, 
  HiUpload, 
  HiDocumentText, 
  HiCog,
  HiMenuAlt2,
  HiX,
  HiBell,
  HiSearch,
  HiCollection,
  HiPencilAlt
} from 'react-icons/hi';
import Logo from '../../components/Logo';
import ThemeToggle from '../../components/ThemeToggle';
import Breadcrumb from '../../components/Breadcrumb';
import GlassNavIcon from '../../components/animations/GlassIcons/GlassNavIcon';
import UserDropdown from '../../components/UserDropdown';
import api from '../../services/api';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Remember sidebar state
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const menuItems = [
    { name: 'Dashboard', icon: HiHome, path: '/dashboard' },
    { name: 'Create Document', icon: HiPencilAlt, path: '/dashboard/create' },
    { name: 'Bulk Issue', icon: HiCollection, path: '/dashboard/bulk-issue' },
    { name: 'Upload Document', icon: HiUpload, path: '/dashboard/upload' },
    { name: 'My Documents', icon: HiDocumentText, path: '/dashboard/certificates' },
    { name: 'Settings', icon: HiCog, path: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden lg:flex flex-col glass-sidebar transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Logo Section */}
        <div className={`p-4 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          <NavLink to="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-xl font-bold text-white font-display text-glow-sm">DocVerify</span>
            )}
          </NavLink>
        </div>
        
        {/* Collapse Toggle Button - Three lines below logo */}
        <div className={`px-4 pb-4 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 
              transition-all border border-white/10 hover:border-primary-500/40"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <HiMenuAlt2 className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {menuItems.map((item) => (
            <div key={item.path} className="relative group">
              <GlassNavIcon
                to={item.path}
                icon={item.icon}
                label={sidebarCollapsed ? '' : item.name}
                color="primary"
                end={item.path === '/dashboard'}
                collapsed={sidebarCollapsed}
              />
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 
                  opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  <div className="bg-dark-100 border border-white/10 text-white text-sm 
                    px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                    {item.name}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer with Panel Label */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-white/10">
            <div className="px-3 py-2 bg-primary-600/20 text-primary-300 text-xs font-medium rounded-lg text-center">
              User Panel
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <aside className="absolute left-0 top-0 bottom-0 w-64 glass-sidebar">
            <div className="p-6 flex items-center justify-between">
              <NavLink to="/" className="flex items-center gap-2">
                <Logo className="h-10 w-10" />
                <span className="text-xl font-bold text-white font-display text-glow-sm">DocVerify</span>
              </NavLink>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            <nav className="px-4 py-6 space-y-1">
              {menuItems.map((item) => (
                <GlassNavIcon
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.name}
                  color="primary"
                  end={item.path === '/dashboard'}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
              <div className="px-3 py-2 bg-primary-600/20 text-primary-300 text-xs font-medium rounded-lg text-center">
                User Panel
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="glass-header px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <HiMenuAlt2 className="w-6 h-6" />
              </button>
              
              <div className="hidden sm:flex items-center gap-3 glass-input rounded-xl px-4 py-2.5 w-80">
                <HiSearch className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5">
                <HiBell className="w-6 h-6" />
              </button>
              
              <ThemeToggle />
              
              {/* User Dropdown with Sign Out */}
              <UserDropdown />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Breadcrumb className="mb-4" />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
