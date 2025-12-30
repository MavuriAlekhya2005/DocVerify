import { motion } from 'framer-motion';

const StatCard = ({ value, label, icon: Icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 
        flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary-400" />
      </div>
      <div className="text-4xl font-bold text-white mb-2">{value}</div>
      <div className="text-gray-400">{label}</div>
    </motion.div>
  );
};

export default StatCard;
