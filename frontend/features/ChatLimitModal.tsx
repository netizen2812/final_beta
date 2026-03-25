import React, { useState } from 'react';
import { Sparkles, X, Check, Loader2 } from 'lucide-react';
import { loadRazorpayScript } from '../utils/razorpay';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const ChatLimitModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setIsLoading(false);
        return;
      }

      const token = await getToken();
      const { data: order } = await axios.post(`${API_URL}/api/payment/create-order`, {
        planType: 'AI_MONTHLY'
      }, { headers: { Authorization: `Bearer ${token}` } });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Imam",
        description: "Unlimited AI Access (30 Days)",
        order_id: order.id,
        handler: async function (response: any) {
             // Verify payment
             await axios.post(`${API_URL}/api/payment/verify`, {
                 ...response,
                 planType: 'AI_MONTHLY'
             }, { headers: { Authorization: `Bearer ${token}` } });
             onSuccess();
             onClose();
        },
        theme: {
          color: "#052e16"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
          alert("Payment failed. Please try again.");
      });
      rzp.open();

    } catch (e) {
       console.error(e);
       alert("Something went wrong with the payment gateway.");
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
       <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1.5"><X size={20}/></button>

          <div className="p-8 text-center pb-6">
             <div className="w-20 h-20 bg-emerald-50 rounded-full mx-auto flex items-center justify-center mb-6 border-4 border-emerald-100/50 shadow-inner">
                 <Sparkles className="text-emerald-500" size={32} />
             </div>
             <h2 className="text-2xl font-black text-[#052e16] uppercase tracking-wider mb-2">Daily Limit Reached</h2>
             <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
                 You have reached your 6 free messages for today. Unlock unlimited spiritual guidance for the next 30 days!
             </p>

             <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 text-left space-y-3">
                 <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                     <Check size={16} className="text-emerald-500 shrink-0" />
                     Unlimited Daily Messages
                 </div>
                 <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                     <Check size={16} className="text-emerald-500 shrink-0" />
                     Exclusive priority responses
                 </div>
                 <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                     <Check size={16} className="text-emerald-500 shrink-0" />
                     Valid for exactly 30 days
                 </div>
             </div>

             <button 
                onClick={handleCheckout} 
                disabled={isLoading}
                className="w-full bg-[#052e16] hover:bg-emerald-900 text-white rounded-2xl py-4 font-black tracking-widest uppercase transition-all shadow-[0_10px_30px_rgba(5,46,22,0.3)] active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
             >
                {isLoading ? <Loader2 className="animate-spin" size={20}/> : "Unlock for ₹79"}
             </button>
             <button onClick={onClose} className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">
                Maybe Tomorrow
             </button>
          </div>
       </div>
    </div>
  )
}
