import { Link, useLocation } from 'react-router-dom';
import { HiSwitchHorizontal, HiUser, HiShieldCheck, HiOfficeBuilding } from 'react-icons/hi';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PortalSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const portals = [
    { 
      name: 'User Portal', 
      path: '/dashboard', 
      icon: HiUser, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      description: 'View & manage your certificates'
    },
    { 
      name: 'Verifier Portal', 
      path: '/verifier', 
      icon: HiShieldCheck, 
      color: 'from-accent-500 to-accent-600',
      bgColor: 'bg-accent-500/20',
      textColor: 'text-accent-400',
      description: 'Scan & verify documents'
    },
    { 
      name: 'Admin Portal', 
      path: '/admin', 
      icon: HiOfficeBuilding, 
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-500/20',
      textColor: 'text-primary-400',
      description: 'Issue & manage all certificates'
    },
  ];

  const getCurrentPortal = () => {
    if (location.pathname.startsWith('/admin')) return portals[2];
    if (location.pathname.startsWith('/verifier')) return portals[1];
    return portals[0];
  };

  const currentPortal = getCurrentPortal();
  const otherPortals = portals.filter(p => p.path !== currentPortal.path);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 
          border border-white/10 transition-all group"
      >
        <div className={`p-2 rounded-lg bg-gradient-to-br ${currentPortal.color}`}>
          <currentPortal.icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-white">{currentPortal.name}</p>
          <p className="text-xs text-gray-500">Switch Portal</p>
        </div>
        <HiSwitchHorizontal className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 bottom-full mb-2 z-50 bg-dark-100 rounded-xl 
                border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2">Switch to</p>
                {otherPortals.map((portal) => (
                  <Link
                    key={portal.path}
                    to={portal.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-all group"
                  >
                    <div className={`p-2 rounded-lg ${portal.bgColor}`}>
                      <portal.icon className={`w-4 h-4 ${portal.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white group-hover:text-white">
                        {portal.name}
                      </p>
                      <p className="text-xs text-gray-500">{portal.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortalSwitcher;
