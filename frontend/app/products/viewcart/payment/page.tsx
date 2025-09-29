/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRouter } from "next/navigation";
import { useCart } from '@/context/CartContext';
import { useEffect, useState } from 'react';
import { createOnlineOrder, CreateOrderData } from '@/services/orders';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Loader from '@/components/Loader';
import type { CartItem } from '@/context/CartContext';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  city: string;
  postalCode?: string;
}

interface CardInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

// Card type detection function
const getCardType = (cardNumber: string): string => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (cleanNumber.startsWith('4')) return 'visa';
  if (cleanNumber.startsWith('5')) return 'mastercard';
  if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) return 'amex';
  if (cleanNumber.startsWith('6')) return 'discover';
  return 'generic';
};

// Card type configuration
const cardTypes = {
  visa: {
    name: 'Visa',
    color: 'from-blue-600 to-blue-800',
    icon: (
      <svg className="w-6 h-4" viewBox="0 0 48 16" fill="none">
        <path d="M20.4 12.8h-2.4l1.2-8h2.4l-1.2 8zM26.4 4.8c0-.8.4-1.2 1.2-1.2.4 0 .8.2 1.2.4l.8-2.4c-.4-.2-.8-.4-1.6-.4-1.6 0-2.8 1.2-2.8 2.8 0 1.2.8 1.6 1.6 2 .8.4 1.2.6 1.2 1.2 0 .8-.6 1.2-1.4 1.2-1.2 0-2-.4-2.4-.8l-.8 2.4c.6.4 1.4.8 3.2.8 2 0 3.2-1.2 3.2-3.2 0-1.6-1-2.2-2-2.6-.8-.4-1.2-.6-1.2-1.2zM32.8 4.8c0-.8.4-1.2 1.2-1.2.4 0 .8.2 1.2.4l.8-2.4c-.4-.2-.8-.4-1.6-.4-1.6 0-2.8 1.2-2.8 2.8 0 1.2.8 1.6 1.6 2 .8.4 1.2.6 1.2 1.2 0 .8-.6 1.2-1.4 1.2-1.2 0-2-.4-2.4-.8l-.8 2.4c.6.4 1.4.8 3.2.8 2 0 3.2-1.2 3.2-3.2 0-1.6-1-2.2-2-2.6-.8-.4-1.2-.6-1.2-1.2zM38.4 4.8c0-.8.4-1.2 1.2-1.2.4 0 .8.2 1.2.4l.8-2.4c-.4-.2-.8-.4-1.6-.4-1.6 0-2.8 1.2-2.8 2.8 0 1.2.8 1.6 1.6 2 .8.4 1.2.6 1.2 1.2 0 .8-.6 1.2-1.4 1.2-1.2 0-2-.4-2.4-.8l-.8 2.4c.6.4 1.4.8 3.2.8 2 0 3.2-1.2 3.2-3.2 0-1.6-1-2.2-2-2.6-.8-.4-1.2-.6-1.2-1.2z" fill="#1A1F71"/>
        <path d="M44.8 4.8c0-.8.4-1.2 1.2-1.2.4 0 .8.2 1.2.4l.8-2.4c-.4-.2-.8-.4-1.6-.4-1.6 0-2.8 1.2-2.8 2.8 0 1.2.8 1.6 1.6 2 .8.4 1.2.6 1.2 1.2 0 .8-.6 1.2-1.4 1.2-1.2 0-2-.4-2.4-.8l-.8 2.4c.6.4 1.4.8 3.2.8 2 0 3.2-1.2 3.2-3.2 0-1.6-1-2.2-2-2.6-.8-.4-1.2-.6-1.2-1.2z" fill="#F7B600"/>
      </svg>
    ),
    pattern: /^4/
  },
  mastercard: {
    name: 'Mastercard',
    color: 'from-orange-500 to-red-600',
    icon: (
      <svg className="w-6 h-4" viewBox="0 0 48 16" fill="none">
        <circle cx="16" cy="8" r="6" fill="#EB001B"/>
        <circle cx="20" cy="8" r="6" fill="#F79E1B"/>
        <path d="M18 5.5c1.5 1.2 2.5 3 2.5 5s-1 3.8-2.5 5c-1.5-1.2-2.5-3-2.5-5s1-3.8 2.5-5z" fill="#FF5F00"/>
      </svg>
    ),
    pattern: /^5/
  },
  amex: {
    name: 'American Express',
    color: 'from-green-600 to-green-800',
    icon: (
      <svg className="w-6 h-4" viewBox="0 0 48 16" fill="none">
        <path d="M8 2h32c3.3 0 6 2.7 6 6v4c0 3.3-2.7 6-6 6H8c-3.3 0-6-2.7-6-6V8c0-3.3 2.7-6 6-6z" fill="#006FCF"/>
        <path d="M12 6h4v4h-4V6zm8 0h4v4h-4V6zm-4 0h4v4h-4V6z" fill="white"/>
        <path d="M16 10h4v2h-4v-2z" fill="white"/>
      </svg>
    ),
    pattern: /^3[47]/
  },
  discover: {
    name: 'Discover',
    color: 'from-orange-400 to-orange-600',
    icon: (
      <svg className="w-6 h-4" viewBox="0 0 48 16" fill="none">
        <path d="M8 2h32c3.3 0 6 2.7 6 6v4c0 3.3-2.7 6-6 6H8c-3.3 0-6-2.7-6-6V8c0-3.3 2.7-6 6-6z" fill="#FF6000"/>
        <path d="M12 6h24v4H12V6z" fill="white"/>
        <circle cx="16" cy="8" r="1" fill="#FF6000"/>
      </svg>
    ),
    pattern: /^6/
  },
  generic: {
    name: 'Credit Card',
    color: 'from-gray-600 to-gray-800',
    icon: (
      <svg className="w-6 h-4" fill="currentColor" viewBox="0 0 24 16">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 6h16v2H4V6zm0 4v2h16v-2H4z"/>
      </svg>
    ),
    pattern: /.*/
  }
};

export default function PaymentPage() {
  const { cartItems, clearCart, hasHydrated } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    billingAddress: '',
    city: '',
    postalCode: ''
  });
  const [cardInfo, setCardInfo] = useState<CardInfo>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [paymentMethod] = useState('card_payment'); // Only card payment now
  const [errors, setErrors] = useState<Partial<CustomerInfo & CardInfo>>({});

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 500; // Fixed shipping cost
  const total = subtotal + shipping;

  // Get current card type
  const currentCardType = getCardType(cardInfo.cardNumber);
  const cardConfig = cardTypes[currentCardType as keyof typeof cardTypes];

  // Function to get the correct image URL
  const getProductImage = (product: CartItem) => {
      const imagePath = product.image;
      if (!imagePath) {
        return '/images/package.png';
      }
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    const filename = imagePath.replace(/\\/g, '/').split('/').pop();
    const fullUrl = `http://localhost:8000/uploads/products/${filename}`;
    return fullUrl;
  };

  // Format card number with spaces
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

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Validate expiry date and ensure it's not a previous month/year
  const validateExpiryField = (expiry: string): string | undefined => {
    if (!expiry || !expiry.trim()) return 'Expiry date is required';
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return 'Invalid expiry date format (MM/YY)';
    const [mmStr, yyStr] = expiry.split('/');
    const month = parseInt(mmStr, 10);
    const year = parseInt(yyStr, 10) + 2000; // assume 20YY
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return 'Invalid expiry month';
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-based
    if (year < currentYear) return 'Invalid month and year';
    if (year === currentYear && month < currentMonth) return 'Invalid month and year';
    return undefined;
  };

  // Validate form (only card info now)
  const validateForm = (): boolean => {
    const newErrors: Partial<CardInfo> = {};
    if (!cardInfo.cardNumber.replace(/\s/g, '').trim()) newErrors.cardNumber = 'Card number is required';
    else if (cardInfo.cardNumber.replace(/\s/g, '').length < 16) newErrors.cardNumber = 'Card number must be 16 digits';
    const expiryError = validateExpiryField(cardInfo.expiryDate);
    if (expiryError) newErrors.expiryDate = expiryError;
    if (!cardInfo.cvv.trim()) newErrors.cvv = 'CVV is required';
    else if (!/^\d{3}$/.test(cardInfo.cvv)) newErrors.cvv = 'CVV must be 3 digits';
    if (!cardInfo.cardholderName.trim()) newErrors.cardholderName = 'Cardholder name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate CVV field (live)
  const validateCvvField = (cvv: string): string | undefined => {
    if (!cvv || !cvv.trim()) return 'CVV is required';
    if (!/^\d{3}$/.test(cvv)) return 'CVV must be 3 digits';
    return undefined;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const userInfo = token ? JSON.parse(sessionStorage.getItem("userInfo") || sessionStorage.getItem("user") || '{}') : null;
      const customerId = userInfo?._id || userInfo?.id;
      // Use fetched customerInfo for order
      const orderData: CreateOrderData = {
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          billingAddress: customerInfo.billingAddress,
          city: customerInfo.city,
          postalCode: customerInfo.postalCode || ''
        },
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        paymentMethod: paymentMethod,
        subtotal: subtotal,
        shipping: shipping,
        tax: 0, // No tax
        total: total,
        customerId: customerId
      };
      const order = await createOnlineOrder(orderData);
      // --- Save payment in backend payment database ---
      let orderId = (order as any)._id || (order as any).id || (order as any).orderId || (order as any).order?._id;
      if (!orderId) {
        function findId(obj: any): string | undefined {
          if (!obj || typeof obj !== 'object') return undefined;
          if (obj._id) return obj._id;
          for (const key of Object.keys(obj)) {
            const found = findId(obj[key]);
            if (found) return found;
          }
          return undefined;
        }
        orderId = findId(order);
      }
      if (orderId) {
        try {
          await fetch('http://localhost:8000/api/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({
              orderId: orderId,
              paymentMethod: paymentMethod,
              amount: total,
              paymentType: 'online'
            })
          });
          toast.success('Payment recorded in database!');
        } catch (err) {
          toast.error('Failed to record payment in database');
        }
      }
      toast.success('Order placed successfully! You will receive a confirmation email shortly.');
      setOrderPlaced(true);
      clearCart();
      const confirmationData = {
        orderNumber: order.orderNumber || `ORD-${Date.now()}`,
        orderId: order._id || order.id,
        total: total,
        items: cartItems,
        customer: customerInfo,
        paymentMethod: paymentMethod,
        estimatedDelivery: ''
      };
      sessionStorage.setItem('orderConfirmationData', JSON.stringify(confirmationData));
      router.push('/products/viewcart/confirmation');
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasHydrated && cartItems.length === 0 && !orderPlaced) {
      router.push('/products');
    }
    // Fetch user details from backend (use /api/auth/profile)
    const fetchUserDetails = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const res = await fetch('http://localhost:8000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setCustomerInfo({
          name: (data.firstName ? data.firstName + ' ' : '') + (data.lastName || ''),
          email: data.email || '',
          phone: data.phone || '',
          billingAddress: data.address || '',
          city: data.city || '',
          postalCode: data.postalCode || ''
        });
      } catch (err) {
        // fallback: do nothing
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [hasHydrated, cartItems.length, router, orderPlaced]);

  if (loading) {
    return <Loader />;
  }

  if (!hasHydrated) return null;
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fafd] to-[#e9f0fa] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Please add some products to your cart before proceeding to checkout.</p>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0e7ff] to-[#f7fafd] py-12 px-2 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-blue-700 mb-2 tracking-tight drop-shadow">Checkout</h1>
        <p className="text-center text-slate-500 mb-10 text-lg">Complete your purchase</p>
        <div className="flex flex-col lg:flex-row gap-10 items-start justify-center">
          {/* Left: Customer Information (Read-only) */}
          <div className="flex-1 w-full max-w-2xl">
            <div className="bg-white/90 rounded-3xl shadow-2xl p-10 mb-6 border border-blue-100 animate-fade-in">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-600 text-white rounded-xl p-3 flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Customer Information</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      readOnly
                      className="w-full px-5 py-3 border-2 rounded-xl bg-slate-100 text-lg border-slate-200 cursor-not-allowed"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      readOnly
                      className="w-full px-5 py-3 border-2 rounded-xl bg-slate-100 text-lg border-slate-200 cursor-not-allowed"
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      readOnly
                      className="w-full px-5 py-3 border-2 rounded-xl bg-slate-100 text-lg border-slate-200 cursor-not-allowed"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                    <input
                      type="text"
                      value={customerInfo.city}
                      readOnly
                      className="w-full px-5 py-3 border-2 rounded-xl bg-slate-100 text-lg border-slate-200 cursor-not-allowed"
                      placeholder="City"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Billing Address</label>
                    <textarea
                      value={customerInfo.billingAddress}
                      readOnly
                      className="w-full px-5 py-3 border-2 rounded-xl bg-slate-100 text-lg border-slate-200 cursor-not-allowed resize-none"
                      placeholder="Billing address"
                      rows={3}
                    />
                  </div>
                </div>
                {/* Payment Method - Card Payment */}
                <div className="border-t border-slate-200 pt-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Payment Method</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-5 border-2 border-blue-200 rounded-2xl bg-blue-50 shadow-sm">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card_payment"
                        checked
                        readOnly
                        className="w-5 h-5 text-blue-600 border-blue-300 focus:ring-blue-500 accent-blue-600"
                      />
                      <div className="ml-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="font-semibold text-slate-800 text-lg">Credit/Debit Card</span>
                        </div>
                        <p className="text-sm text-slate-600">Pay securely with your card</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Card Details */}
                <div className="border-t border-slate-200 pt-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Card Details</h3>
                  
                  {/* Card Preview */}
                  <div className="mb-8">
                    <div className={`relative w-full h-56 bg-gradient-to-br ${cardConfig.color} rounded-2xl p-6 text-white shadow-2xl transform transition-all duration-300 hover:scale-105`}>
                      {/* Card Background Pattern */}
                      <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
                      
                      {/* Card Content */}
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        {/* Top Section */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              {cardConfig.icon}
                            </div>
                            <span className="font-semibold text-lg">{cardConfig.name}</span>
                          </div>
                          <div className="w-12 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Middle Section - Card Number */}
                        <div className="text-center">
                          <div className="text-2xl font-mono tracking-wider mb-2">
                            {cardInfo.cardNumber || '•••• •••• •••• ••••'}
                          </div>
                          <div className="text-sm opacity-80">Card Number</div>
                        </div>
                        
                        {/* Bottom Section */}
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-sm opacity-80 mb-1">Cardholder Name</div>
                            <div className="font-semibold">
                              {cardInfo.cardholderName || 'YOUR NAME'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm opacity-80 mb-1">Expires</div>
                            <div className="font-semibold">
                              {cardInfo.expiryDate || 'MM/YY'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Input Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Card Number *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardInfo.cardNumber}
                          onChange={(e) => setCardInfo({...cardInfo, cardNumber: formatCardNumber(e.target.value)})}
                          className={`w-full px-5 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-lg bg-slate-50 pr-12 ${errors.cardNumber ? 'border-red-400' : 'border-slate-200'}`}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {cardInfo.cardNumber ? cardConfig.icon : (
                            <div className="flex items-center gap-1">
                              {cardTypes.visa.icon}
                              {cardTypes.mastercard.icon}
                              {cardTypes.amex.icon}
                              {cardTypes.discover.icon}
                            </div>
                          )}
                        </div>
                      </div>
                      {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Cardholder Name *</label>
                      <input
                        type="text"
                        value={cardInfo.cardholderName}
                        onChange={(e) => setCardInfo({...cardInfo, cardholderName: e.target.value.toUpperCase()})}
                        className={`w-full px-5 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-lg bg-slate-50 ${errors.cardholderName ? 'border-red-400' : 'border-slate-200'}`}
                        placeholder="NAME ON CARD"
                      />
                      {errors.cardholderName && <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Expiry Date *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardInfo.expiryDate}
                        onChange={(e) => {
                          const formatted = formatExpiryDate(e.target.value);
                          setCardInfo({...cardInfo, expiryDate: formatted});
                          const expiryError = validateExpiryField(formatted);
                          setErrors(prev => ({ ...prev, expiryDate: expiryError }));
                        }}
                        className={`w-full px-5 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-lg bg-slate-50 ${errors.expiryDate ? 'border-red-400' : 'border-slate-200'}`}
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                      {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">CVV *</label>
                      <div className="relative">
                        <input
                          type="password"
                          inputMode="numeric"
                          value={cardInfo.cvv}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '');
                            // limit to 3 digits
                            const trimmed = digits.slice(0, 3);
                            setCardInfo({...cardInfo, cvv: trimmed});
                            // live validate and set error for CVV only
                            const cvvError = validateCvvField(trimmed);
                            setErrors(prev => ({ ...prev, cvv: cvvError }));
                          }}
                          className={`w-full px-5 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-lg bg-slate-50 pr-12 ${errors.cvv ? 'border-red-400' : 'border-slate-200'}`}
                          placeholder="***"
                          maxLength={3}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </div>
                      {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                    </div>
                  </div>

                  {/* Supported Cards */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-3">Supported Payment Methods:</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {cardTypes.visa.icon}
                        <span className="text-xs font-medium text-slate-600">Visa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {cardTypes.mastercard.icon}
                        <span className="text-xs font-medium text-slate-600">Mastercard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {cardTypes.amex.icon}
                        <span className="text-xs font-medium text-slate-600">American Express</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {cardTypes.discover.icon}
                        <span className="text-xs font-medium text-slate-600">Discover</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 disabled:bg-gray-400 text-white py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-xl disabled:cursor-not-allowed animate-fade-in"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Pay LKR {total.toFixed(2)}
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 text-center mt-4">
                  By placing this order, you agree to our terms and conditions
                </p>
              </form>
            </div>
          </div>
          {/* Right: Order Summary */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-gradient-to-br from-blue-100/80 to-white/90 rounded-3xl shadow-2xl p-10 sticky top-8 border border-blue-200 animate-fade-in">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-emerald-500 text-white rounded-xl p-3 flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v2a4 4 0 004 4h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Order Summary</h3>
              </div>
              {/* Order Items */}
              <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white/80 rounded-xl shadow-sm border border-blue-50 hover:shadow-md transition-shadow">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={getProductImage(item)}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300 rounded-lg"
                        priority={false}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/package.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate">{item.name}</h4>
                      <p className="text-xs text-slate-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-700">LKR {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Price Breakdown */}
              <div className="bg-white/80 rounded-2xl p-6 mb-6 border border-blue-100">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Subtotal</span>
                    <span className="font-semibold text-slate-800">LKR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Shipping</span>
                    <span className="font-semibold text-slate-800">LKR {shipping.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                    <span className="font-bold text-lg text-slate-800">Total</span>
                    <span className="font-bold text-2xl text-blue-700">LKR {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center mt-2">
                <svg className="w-6 h-6 text-blue-400 animate-bounce mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-500 font-medium">Secure card payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
} 