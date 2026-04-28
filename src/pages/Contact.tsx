import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Send, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';
import { useApi } from '../hooks/useApi';

export default function Contact_Page() {
  const { request } = useApi();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    request('/api/contact').then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="py-24 px-4 bg-brand-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-6xl font-black tracking-tighter text-zinc-900 mb-8 leading-tight italic uppercase">Let's build <br /><span className="text-brand-600 font-sans not-italic tracking-widest">the future</span> <br />together.</h1>
            <p className="text-xl text-zinc-500 mb-12 max-w-md leading-relaxed font-medium uppercase text-xs tracking-widest">
              Have questions about INFINITIUM? Want to collaborate or sponsor our next big event? Reach out to us.
            </p>

            <div className="space-y-10">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="font-black text-xs uppercase tracking-widest mb-1 italic">Our Location</h4>
                   <p className="text-zinc-500 text-sm font-medium whitespace-pre-line">{data.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="font-black text-xs uppercase tracking-widest mb-1 italic">Email Us</h4>
                   <p className="text-zinc-500 text-sm font-bold">{data.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="font-black text-xs uppercase tracking-widest mb-1 italic">Call Us</h4>
                   <p className="text-zinc-500 text-sm font-bold">{data.phone}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl shadow-brand-900/5 border border-brand-100"
          >
            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                   <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-2">Your Name</label>
                   <input className="w-full px-6 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-3xl focus:border-brand-600 outline-none transition-all font-bold text-sm" placeholder="Alex" />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-2">Email Address</label>
                   <input className="w-full px-6 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-3xl focus:border-brand-600 outline-none transition-all font-bold text-sm" placeholder="alex@gmail.com" />
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-2">Message</label>
                 <textarea className="w-full px-6 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-3xl h-40 focus:border-brand-600 outline-none transition-all font-bold text-sm" placeholder="How can we help?"></textarea>
              </div>
              <button className="w-full py-5 bg-brand-950 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-brand-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border border-brand-900 shadow-xl shadow-brand-950/20">
                Send Message <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
