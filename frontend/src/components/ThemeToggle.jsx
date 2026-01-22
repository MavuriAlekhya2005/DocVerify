/**
 * Theme Toggle Button Component
 * Switches between dark/light/system themes
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMoon, HiSun, HiDesktopComputer, HiChevronDown } from 'react-icons/hi';
import { useTheme, THEMES } from '../contexts/ThemeContext';

const ThemeToggle = ({ showLabel = false, variant = 'button' }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const themeOptions = [
    { value: THEMES.DARK, label: 'Dark', icon: HiMoon },
    { value: THEMES.LIGHT, label: 'Light', icon: HiSun },
    { value: THEMES.SYSTEM, label: 'System', icon: HiDesktopComputer },
  ];

  const currentIcon = resolvedTheme === THEMES.LIGHT ? HiSun : HiMoon;
  const CurrentIcon = currentIcon;

  // Simple toggle button variant
  if (variant === 'button') {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white 
          transition-all border border-white/10 hover:border-white/20"
        title={`Switch to ${resolvedTheme === THEMES.DARK ? 'light' : 'dark'} mode`}
      >
        <motion.div
          key={resolvedTheme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CurrentIcon className="w-5 h-5" />
        </motion.div>
      </motion.button>
    );
  }

  // Dropdown variant with all options
  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 
          text-gray-400 hover:text-white transition-all border border-white/10 hover:border-white/20"
      >
        <CurrentIcon className="w-5 h-5" />
        {showLabel && (
          <>
            <span className="text-sm capitalize">{theme}</span>
            <HiChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setDropdownOpen(false)} 
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-40 py-2 bg-dark-100 rounded-xl border border-white/10 
                shadow-xl shadow-black/20 z-50"
            >
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                      ${isActive 
                        ? 'text-primary-400 bg-primary-500/10' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="theme-indicator"
                        className="ml-auto w-2 h-2 rounded-full bg-primary-500"
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggle;
