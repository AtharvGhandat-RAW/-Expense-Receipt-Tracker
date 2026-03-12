import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { supabase } from '../services/supabaseClient';
import PageTransition from '../components/PageTransition';

// -------------------------------------------------------
// AddExpense – Form Screen (Material Design 3)
// -------------------------------------------------------

const CATEGORIES = [
  { value: 'Food',          emoji: '🍔' },
  { value: 'Travel',        emoji: '✈️' },
  { value: 'Supplies',      emoji: '📦' },
  { value: 'Entertainment', emoji: '🎬' },
  { value: 'Bills',         emoji: '🧾' },
  { value: 'Health',        emoji: '💊' },
  { value: 'Shopping',      emoji: '🛍️' },
  { value: 'Other',         emoji: '💰' },
];

function AddExpense({ darkMode }) {
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [notes, setNotes] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open device camera
  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 80,
      });
      setReceiptPhoto(photo.dataUrl);
    } catch (error) {
      console.log('Camera cancelled or error:', error);
    }
  };

  // Pick from gallery
  const pickFromGallery = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        quality: 80,
      });
      setReceiptPhoto(photo.dataUrl);
    } catch (error) {
      console.log('Gallery cancelled or error:', error);
    }
  };

  // Upload image + insert row into Supabase
  const handleSaveExpense = async () => {
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    setIsSubmitting(true);
    try {
      let receiptImageUrl = null;

      if (receiptPhoto) {
        const base64Data = receiptPhoto.split(',')[1];
        const byteString = atob(base64Data);
        const byteArray = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          byteArray[i] = byteString.charCodeAt(i);
        }
        const mimeType = receiptPhoto.split(';')[0].split(':')[1];
        const extension = mimeType.split('/')[1];
        const fileName = `receipt-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, byteArray, { contentType: mimeType });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);

        receiptImageUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          amount: parseFloat(amount),
          category,
          notes,
          date: new Date().toISOString(),
          receipt_image_url: receiptImageUrl,
        });

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      navigate('/');
    } catch (error) {
      console.error('Save failed:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
    <div className="h-full bg-[#F4F4F5] dark:bg-gray-950 flex flex-col">
      {/* M3 Top App Bar with back arrow */}
      <header className="h-16 bg-white dark:bg-gray-900 w-full flex items-center px-4 shadow-sm gap-3 shrink-0 z-10">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
        <h1 className="text-[22px] font-medium text-gray-900 dark:text-white">Add Expense</h1>
      </header>

      {/* Form */}
      <main className="flex-1 native-scroll px-4 pt-4 pb-24 space-y-5">
        {/* Amount */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <label htmlFor="amount" className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
            Amount (₹)
          </label>
          <input
            id="amount"
            type="number"
            placeholder="0"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-14 bg-transparent border border-gray-400 dark:border-gray-600 rounded-md px-4 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:border-2 focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Category – Chip Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
        >
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.value}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setCategory(cat.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all ${
                  category === cat.value
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                {cat.value}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16, ease: 'easeOut' }}
        >
          <label htmlFor="notes" className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
            Notes
          </label>
          <textarea
            id="notes"
            rows="3"
            placeholder="Add any details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-transparent border border-gray-400 dark:border-gray-600 rounded-md px-4 py-3 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:border-2 focus:outline-none transition-colors resize-none"
          />
        </motion.div>

        {/* Receipt buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24, ease: 'easeOut' }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            onClick={takePhoto}
            className="h-14 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center justify-center gap-2 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          >
            📷 Camera
          </button>
          <button
            type="button"
            onClick={pickFromGallery}
            className="h-14 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center justify-center gap-2 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          >
            🖼️ Gallery
          </button>
        </motion.div>

        {/* Photo Preview */}
        <AnimatePresence>
        {receiptPhoto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative"
          >
            <img
              src={receiptPhoto}
              alt="Receipt preview"
              className="w-full max-h-56 object-contain rounded-xl border border-gray-200 dark:border-gray-700"
            />
            <button
              onClick={() => setReceiptPhoto(null)}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full text-white text-sm flex items-center justify-center"
              aria-label="Remove photo"
            >
              ×
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
        className="px-4 pb-6 pt-3 bg-gradient-to-t from-[#F4F4F5] dark:from-gray-950 via-[#F4F4F5] dark:via-gray-950 to-transparent shrink-0"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleSaveExpense}
          disabled={isSubmitting}
          className={`w-full h-12 rounded-full font-medium shadow-md transition-all ${
            isSubmitting
              ? 'bg-blue-300 text-blue-100 cursor-not-allowed'
              : 'bg-blue-600 text-white'
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </motion.button>
      </motion.div>
    </div>
    </PageTransition>
  );
}

export default AddExpense;
