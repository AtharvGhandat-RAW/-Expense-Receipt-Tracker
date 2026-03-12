import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// -------------------------------------------------------
// Onboarding – Welcome flow for first-time users
// -------------------------------------------------------
// Swipeable 3-step walkthrough explaining the app's
// key features. Shown only once (controlled by localStorage).
// -------------------------------------------------------

const slides = [
  {
    emoji: '💰',
    title: 'Track Every Rupee',
    description: 'Log your daily expenses in seconds with a clean, mobile-first interface. Never lose track of where your money goes.',
  },
  {
    emoji: '📷',
    title: 'Snap Your Receipts',
    description: 'Use your phone camera to capture receipts instantly. They are stored safely in the cloud for future reference.',
  },
  {
    emoji: '📊',
    title: 'Smart Analytics',
    description: 'See spending breakdowns by category, set monthly budgets, and get alerts before you overspend.',
  },
];

function Onboarding({ onFinish }) {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      onFinish();
    }
  };

  const slide = slides[current];

  return (
    <div className="h-full bg-white flex flex-col items-center justify-center px-8 text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          {/* Animated emoji */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
            className="text-8xl mb-8"
          >
            {slide.emoji}
          </motion.div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{slide.title}</h1>

          {/* Description */}
          <p className="text-base text-gray-500 max-w-xs leading-relaxed mb-10">
            {slide.description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Dots indicator */}
      <div className="flex gap-2 mb-8">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-xs space-y-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={next}
          className="w-full h-12 rounded-full bg-blue-600 text-white font-medium shadow-md"
        >
          {current < slides.length - 1 ? 'Next' : 'Get Started'}
        </motion.button>

        {current < slides.length - 1 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onFinish}
            className="w-full h-12 rounded-full text-gray-500 font-medium"
          >
            Skip
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
