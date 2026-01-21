/**
 * Bulk Issuance Page - Feature In Progress
 */

import { motion } from 'framer-motion';
import { HiClock, HiSparkles, HiBell } from 'react-icons/hi';

const BulkIssuance = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Animated Icon */}
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 
            border border-amber-500/30 flex items-center justify-center"
        >
          <HiClock className="w-12 h-12 text-amber-500" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Feature In Progress
        </h1>

        {/* Description */}
        <p className="text-gray-400 mb-8 leading-relaxed">
          We're working hard to bring you bulk document issuance capabilities. 
          This feature will allow you to issue multiple certificates, IDs, and documents at once.
        </p>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
          bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <HiSparkles className="w-5 h-5 text-amber-500" />
          <span className="text-amber-400 font-medium">Coming Soon</span>
        </div>

        {/* Feature Preview */}
        <div className="mt-12 grid gap-4 text-left">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Upcoming Features
          </h3>
          
          {[
            'CSV/Excel bulk upload support',
            'Multiple document type templates',
            'Batch blockchain registration',
            'Progress tracking & status reports',
            'Export results with QR codes',
          ].map((feature, index) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-dark-200/50 border border-white/5"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
              <span className="text-gray-300 text-sm">{feature}</span>
            </motion.div>
          ))}
        </div>

        {/* Notify Me Button */}
        <button
          onClick={() => {
            // Could integrate with email notification
            alert('We\'ll notify you when this feature is ready!');
          }}
          className="mt-8 flex items-center gap-2 mx-auto px-6 py-3 rounded-xl
            bg-dark-100 border border-white/10 text-white hover:bg-dark-50 transition-colors"
        >
          <HiBell className="w-5 h-5" />
          Notify Me When Ready
        </button>
      </motion.div>
    </div>
  );
};

export default BulkIssuance;
