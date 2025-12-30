import { motion } from 'framer-motion';

const StepCard = ({ number, title, description, isLast = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: number * 0.1 }}
      className="relative flex gap-6"
    >
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 
          flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/25">
          {number}
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-gradient-to-b from-primary-600/50 to-transparent mt-4"></div>
        )}
      </div>

      {/* Content */}
      <div className="pb-12">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

export default StepCard;
