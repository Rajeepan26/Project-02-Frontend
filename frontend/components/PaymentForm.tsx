import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface PaymentFormProps {
  total: number;
  shipping: number;
  tax: number;
  onSuccess: () => void;
}

interface CardInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

const getCardType = (cardNumber: string): string => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (cleanNumber.startsWith('4')) return 'visa';
  if (cleanNumber.startsWith('5')) return 'mastercard';
  if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) return 'amex';
  if (cleanNumber.startsWith('6')) return 'discover';
  return 'generic';
};

const cardTypes = {
  visa: { name: 'Visa', color: 'from-blue-600 to-blue-800' },
  mastercard: { name: 'Mastercard', color: 'from-orange-500 to-red-600' },
  amex: { name: 'American Express', color: 'from-green-600 to-green-800' },
  discover: { name: 'Discover', color: 'from-orange-400 to-orange-600' },
  generic: { name: 'Credit Card', color: 'from-gray-600 to-gray-800' },
};

export default function PaymentForm({ total, shipping, tax, onSuccess }: PaymentFormProps) {
  const [cardInfo, setCardInfo] = useState<CardInfo>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [errors, setErrors] = useState<Partial<CardInfo>>({});
  const [loading, setLoading] = useState(false);

  const currentCardType = getCardType(cardInfo.cardNumber);
  const cardConfig = cardTypes[currentCardType as keyof typeof cardTypes];

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CardInfo> = {};
    if (!cardInfo.cardNumber.replace(/\s/g, '').trim()) newErrors.cardNumber = 'Card number is required';
    else if (cardInfo.cardNumber.replace(/\s/g, '').length < 16) newErrors.cardNumber = 'Card number must be 16 digits';
    if (!cardInfo.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
    else if (!/^\d{2}\/\d{2}$/.test(cardInfo.expiryDate)) newErrors.expiryDate = 'Invalid expiry date format (MM/YY)';
    else {
      const [monthStr, yearStr] = cardInfo.expiryDate.split('/');
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);
      if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        newErrors.expiryDate = 'Month must be between 01 and 12';
      } else {
        // Get current month/year
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear() % 100;
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          newErrors.expiryDate = 'Expiry date cannot be in the past';
        }
      }
    }
  if (!cardInfo.cvv.trim()) newErrors.cvv = 'CVV is required';
  else if (!/^\d{3}$/.test(cardInfo.cvv)) newErrors.cvv = 'CVV must be exactly 3 digits';
    if (!cardInfo.cardholderName.trim()) newErrors.cardholderName = 'Cardholder name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Payment successful!');
      onSuccess();
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Card Number *</label>
        <input
          type="text"
          value={cardInfo.cardNumber}
          onChange={e => setCardInfo({ ...cardInfo, cardNumber: formatCardNumber(e.target.value) })}
          className={`w-full px-5 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg bg-slate-50 ${errors.cardNumber ? 'border-red-400' : 'border-slate-200'}`}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
        />
        {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Cardholder Name *</label>
        <input
          type="text"
          value={cardInfo.cardholderName}
          onChange={e => setCardInfo({ ...cardInfo, cardholderName: e.target.value.toUpperCase() })}
          className={`w-full px-5 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg bg-slate-50 ${errors.cardholderName ? 'border-red-400' : 'border-slate-200'}`}
          placeholder="NAME ON CARD"
        />
        {errors.cardholderName && <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>}
      </div>
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Expiry Date *</label>
          <input
            type="text"
            value={cardInfo.expiryDate}
            onChange={e => setCardInfo({ ...cardInfo, expiryDate: formatExpiryDate(e.target.value) })}
            className={`w-full px-5 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg bg-slate-50 ${errors.expiryDate ? 'border-red-400' : 'border-slate-200'}`}
            placeholder="MM/YY"
            maxLength={5}
          />
          {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 mb-2">CVV *</label>
          <input
            type="password"
            value={cardInfo.cvv}
            onChange={e => setCardInfo({ ...cardInfo, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
            className={`w-full px-5 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg bg-slate-50 ${errors.cvv ? 'border-red-400' : 'border-slate-200'}`}
            placeholder="●●●"
            maxLength={3}
            inputMode="numeric"
            autoComplete="cc-csc"
          />
          {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
        </div>
      </div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <span className="font-medium text-slate-700">Shipping</span>
          <span className="font-semibold text-slate-800">LKR {shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-slate-700">Tax</span>
          <span className="font-semibold text-slate-800">LKR {tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mt-2 border-t pt-2">
          <span className="font-bold text-lg text-slate-800">Total</span>
          <span className="font-bold text-2xl text-blue-700">LKR {total.toFixed(2)}</span>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 disabled:bg-gray-400 text-white py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-xl disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
} 