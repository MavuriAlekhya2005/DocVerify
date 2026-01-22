/**
 * Breadcrumb Component - Shows navigation path
 */
import { Link, useLocation } from 'react-router-dom';
import { HiHome, HiChevronRight } from 'react-icons/hi';

const Breadcrumb = ({ items, className = '' }) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from path if items not provided
  const generateBreadcrumbs = () => {
    if (items) return items;

    const pathnames = location.pathname.split('/').filter(x => x);
    
    const breadcrumbMap = {
      'dashboard': 'Dashboard',
      'admin': 'Admin Panel',
      'verifier': 'Verifier Portal',
      'create': 'Create Document',
      'upload': 'Upload Document',
      'certificates': 'My Documents',
      'documents': 'Documents',
      'settings': 'Settings',
      'analytics': 'Analytics',
      'users': 'Users',
      'manage': 'Manage',
      'bulk-issue': 'Bulk Issue',
      'scan': 'Scan & Verify',
      'history': 'History',
      'issue': 'Issue Document',
    };

    return pathnames.map((name, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = breadcrumbMap[name] || name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
      const isLast = index === pathnames.length - 1;

      return { label, path, isLast };
    });
  };

  const crumbs = generateBreadcrumbs();

  if (crumbs.length <= 1) return null;

  return (
    <nav className={`flex items-center text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link 
            to="/" 
            className="text-gray-400 hover:text-white transition-colors flex items-center"
          >
            <HiHome className="w-4 h-4" />
          </Link>
        </li>
        
        {crumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center">
            <HiChevronRight className="w-4 h-4 text-gray-600 mx-1" />
            {crumb.isLast ? (
              <span className="text-white font-medium">{crumb.label}</span>
            ) : (
              <Link 
                to={crumb.path} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
