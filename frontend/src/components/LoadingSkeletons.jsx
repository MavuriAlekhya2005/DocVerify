/**
 * Loading Skeleton Components
 * Provides placeholder loading states for better UX
 */
import { motion } from 'framer-motion';

// Base skeleton with shimmer animation
const SkeletonBase = ({ className = '' }) => (
  <div 
    className={`bg-white/5 animate-pulse rounded ${className}`}
    style={{
      background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }}
  />
);

// Text line skeleton
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBase 
        key={i} 
        className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} 
      />
    ))}
  </div>
);

// Card skeleton
export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-dark-100/50 rounded-2xl border border-white/10 p-6 ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <SkeletonBase className="w-12 h-12 rounded-xl" />
      <div className="flex-1">
        <SkeletonBase className="h-5 w-3/4 mb-2" />
        <SkeletonBase className="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonBase className="h-4 w-full mb-2" />
    <SkeletonBase className="h-4 w-5/6" />
  </div>
);

// Document list item skeleton
export const SkeletonDocumentItem = () => (
  <div className="bg-dark-100/50 rounded-xl border border-white/10 p-6">
    <div className="flex items-center gap-4">
      <SkeletonBase className="w-16 h-16 rounded-xl" />
      <div className="flex-1">
        <SkeletonBase className="h-5 w-48 mb-2" />
        <SkeletonBase className="h-4 w-32 mb-1" />
        <SkeletonBase className="h-3 w-24" />
      </div>
      <div className="flex gap-2">
        <SkeletonBase className="w-10 h-10 rounded-lg" />
        <SkeletonBase className="w-10 h-10 rounded-lg" />
        <SkeletonBase className="w-20 h-10 rounded-lg" />
      </div>
    </div>
  </div>
);

// Stat card skeleton
export const SkeletonStat = () => (
  <div className="bg-dark-100/50 rounded-xl border border-white/10 p-4">
    <SkeletonBase className="h-8 w-16 mb-2" />
    <SkeletonBase className="h-4 w-24" />
  </div>
);

// Table skeleton
export const SkeletonTable = ({ rows = 5 }) => (
  <div className="bg-dark-100/50 rounded-2xl border border-white/10 overflow-hidden">
    <div className="p-4 border-b border-white/10">
      <div className="flex gap-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonBase key={i} className="h-4 flex-1" />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-4 border-b border-white/5">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(j => (
            <SkeletonBase key={j} className="h-4 flex-1" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Full page loader
export const PageLoader = ({ message = 'Loading...' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-[400px] flex flex-col items-center justify-center"
  >
    <div className="w-12 h-12 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin mb-4" />
    <p className="text-gray-400">{message}</p>
  </motion.div>
);

// Inline spinner
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  return (
    <div 
      className={`${sizes[size]} border-primary-600/30 border-t-primary-600 rounded-full animate-spin ${className}`} 
    />
  );
};

// Add shimmer keyframes to index.css
// @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

export default {
  SkeletonBase,
  SkeletonText,
  SkeletonCard,
  SkeletonDocumentItem,
  SkeletonStat,
  SkeletonTable,
  PageLoader,
  Spinner,
};
