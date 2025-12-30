import { motion } from 'framer-motion';
import { HiCheck } from 'react-icons/hi';

const PricingCard = ({ 
  name, 
  price, 
  description, 
  features, 
  isPopular = false,
  buttonText = 'Get Started',
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative rounded-2xl p-8 ${
        isPopular 
          ? 'bg-gradient-to-b from-primary-600/20 to-dark-100/50 border-2 border-primary-500' 
          : 'bg-dark-100/50 border border-white/10'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-primary-600 to-accent-600 text-white text-sm 
            font-semibold px-4 py-1.5 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
        <p className="text-gray-400 text-sm mb-6">{description}</p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl font-bold text-white">${price}</span>
          <span className="text-gray-400">/month</span>
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-accent-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <HiCheck className="w-3 h-3 text-accent-500" />
            </div>
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <button className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
        isPopular 
          ? 'btn-primary' 
          : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
      }`}>
        {buttonText}
      </button>
    </motion.div>
  );
};

export default PricingCard;
