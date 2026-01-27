import { NavLink } from 'react-router-dom';
import './GlassIcons.css';

const gradientMapping = {
  blue: 'linear-gradient(hsl(223, 90%, 50%), hsl(208, 90%, 50%))',
  purple: 'linear-gradient(hsl(283, 90%, 50%), hsl(268, 90%, 50%))',
  red: 'linear-gradient(hsl(3, 90%, 50%), hsl(348, 90%, 50%))',
  indigo: 'linear-gradient(hsl(253, 90%, 50%), hsl(238, 90%, 50%))',
  orange: 'linear-gradient(hsl(43, 90%, 50%), hsl(28, 90%, 50%))',
  green: 'linear-gradient(hsl(123, 90%, 40%), hsl(108, 90%, 40%))',
  cyan: 'linear-gradient(hsl(183, 90%, 50%), hsl(168, 90%, 50%))',
  pink: 'linear-gradient(hsl(333, 90%, 50%), hsl(318, 90%, 50%))',
  primary: 'linear-gradient(hsl(239, 84%, 67%), hsl(224, 84%, 67%))'
};

/**
 * GlassNavIcon - Single navigation item with glass morphism effect
 * Designed for sidebar navigation links with collapsed state support
 */
const GlassNavIcon = ({ 
  to, 
  icon: Icon, 
  label, 
  color = 'primary',
  isActive = false,
  onClick,
  collapsed = false,
  end = false
}) => {
  const getBackgroundStyle = () => {
    if (gradientMapping[color]) {
      return { background: gradientMapping[color] };
    }
    return { background: color };
  };

  return (
    <NavLink 
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive: navActive }) => `
        glass-nav-icon group flex items-center gap-3 rounded-xl 
        transition-all duration-300 relative overflow-hidden
        ${collapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2.5'}
        ${navActive || isActive 
          ? 'bg-primary-600/20 text-white shadow-lg shadow-primary-500/20' 
          : 'text-gray-300 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {({ isActive: navActive }) => (
        <>
          {/* Glass effect background on hover/active */}
          <span 
            className={`
              glass-nav-icon__back absolute inset-0 opacity-0 
              transition-opacity duration-300 rounded-xl
              ${navActive || isActive ? 'opacity-20' : 'group-hover:opacity-10'}
            `}
            style={getBackgroundStyle()}
          />
          
          {/* Icon with glass effect */}
          <span className={`
            glass-nav-icon__icon relative z-10 p-1.5 rounded-lg
            transition-all duration-300
            ${navActive || isActive 
              ? 'bg-primary-600/30 shadow-inner' 
              : 'group-hover:bg-white/10'
            }
          `}>
            <Icon className="w-5 h-5" />
          </span>
          
          {/* Label - visible text with enhanced styling */}
          {!collapsed && label && (
            <span className={`glass-nav-icon__label relative z-10 font-medium text-sm
              ${navActive || isActive 
                ? 'text-white' 
                : 'text-gray-200 group-hover:text-white'
              }`}
            >
              {label}
            </span>
          )}
          
          {/* Active indicator */}
          {(navActive || isActive) && !collapsed && (
            <span className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full
              bg-primary-500
            `} />
          )}
          
          {/* Active dot for collapsed state */}
          {(navActive || isActive) && collapsed && (
            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full
              bg-primary-500
            `} />
          )}
        </>
      )}
    </NavLink>
  );
};

export default GlassNavIcon;
