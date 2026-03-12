import { useState } from 'react';

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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center">
      {/* Animated emoji */}
      <div className="text-8xl mb-8 animate-bounce">{slide.emoji}</div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-3">{slide.title}</h1>

      {/* Description */}
      <p className="text-base text-gray-500 max-w-xs leading-relaxed mb-10">
        {slide.description}
      </p>

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
        <button
          onClick={next}
          className="w-full h-12 rounded-full bg-blue-600 text-white font-medium shadow-md active:bg-blue-700 active:scale-[0.98] transition-all"
        >
          {current < slides.length - 1 ? 'Next' : 'Get Started'}
        </button>

        {current < slides.length - 1 && (
          <button
            onClick={onFinish}
            className="w-full h-12 rounded-full text-gray-500 font-medium active:bg-gray-100 transition-colors"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
