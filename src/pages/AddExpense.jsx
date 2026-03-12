import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { supabase } from '../services/supabaseClient';

// -------------------------------------------------------
// AddExpense – Form Screen (Material Design 3)
// -------------------------------------------------------

function AddExpense() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [notes, setNotes] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open device camera or file picker on desktop
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

  // Upload image + insert row into Supabase
  const handleSaveExpense = async () => {
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
    <div className="min-h-screen bg-[#F4F4F5] flex flex-col">
      {/* M3 Top App Bar with back arrow */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white w-full flex items-center px-4 shadow-sm gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[22px] font-medium text-gray-900">Add Expense</h1>
      </header>

      {/* Form */}
      <main className="flex-1 px-4 pt-20 pb-24 space-y-5">
        {/* Amount – Material Outlined Text Field */}
        <div>
          <label htmlFor="amount" className="block text-sm text-gray-600 mb-1.5">
            Amount (₹)
          </label>
          <input
            id="amount"
            type="number"
            placeholder="0"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-14 bg-transparent border border-gray-400 rounded-md px-4 text-base text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:border-2 focus:outline-none transition-colors"
          />
        </div>

        {/* Category – Material Outlined Dropdown */}
        <div>
          <label htmlFor="category" className="block text-sm text-gray-600 mb-1.5">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-14 bg-white border border-gray-400 rounded-md px-4 text-base text-gray-900 focus:border-blue-600 focus:border-2 focus:outline-none transition-colors"
          >
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Supplies">Supplies</option>
          </select>
        </div>

        {/* Notes – Material Outlined Text Area */}
        <div>
          <label htmlFor="notes" className="block text-sm text-gray-600 mb-1.5">
            Notes
          </label>
          <textarea
            id="notes"
            rows="3"
            placeholder="Add any details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-transparent border border-gray-400 rounded-md px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:border-2 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Snap Receipt Button */}
        <button
          type="button"
          onClick={takePhoto}
          className="w-full h-14 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium flex items-center justify-center gap-2 active:bg-gray-100 transition-colors"
        >
          📷 Snap Receipt
        </button>

        {/* Photo Preview */}
        {receiptPhoto && (
          <img
            src={receiptPhoto}
            alt="Receipt preview"
            className="w-full max-h-56 object-contain rounded-xl border border-gray-200"
          />
        )}
      </main>

      {/* M3 Filled Button – fixed at bottom with fade gradient */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-[#F4F4F5] via-[#F4F4F5] to-transparent">
        <button
          type="button"
          onClick={handleSaveExpense}
          disabled={isSubmitting}
          className={`w-full h-12 rounded-full font-medium shadow-md transition-all ${
            isSubmitting
              ? 'bg-blue-300 text-blue-100 cursor-not-allowed'
              : 'bg-blue-600 text-white active:bg-blue-700 active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </button>
      </div>
    </div>
  );
}

export default AddExpense;
