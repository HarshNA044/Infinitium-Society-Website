import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MapPin, Mail, Phone, ExternalLink, Instagram, Linkedin, CheckCircle2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Contact_Page() {
  const { request } = useApi();
  const [data, setData] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    // Initial fetch to get contact details from server (static data)
    fetch('/api/contact')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Error fetching contact data", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Store in Firestore for persistence and admin viewing (the "Excel" equivalent)
      await addDoc(collection(db, 'contact_messages'), {
        ...formData,
        timestamp: serverTimestamp(),
        status: 'new'
      });

      // 2. Call server to trigger "email notification" (log)
      await request('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Submission failed", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50/30">
      <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="py-24 px-4 bg-brand-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-900 mb-8 leading-tight uppercase">
              Let's build <br />
              <span className="text-brand-600 font-sans not-italic tracking-widest">the future</span> <br />
              together.
            </h1>
            <p className="text-lg text-zinc-500 mb-12 max-w-md leading-relaxed font-bold uppercase text-[10px] tracking-widest">
              Have questions about INFINITIUM? Want to collaborate or sponsor our next big event? Reach out to us through any of the channels below.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100 group-hover:bg-brand-600 group-hover:text-white transition-all">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="font-black text-xs uppercase tracking-widest mb-1">Email Us</h4>
                   <a href={`mailto:${data.email}`} className="text-zinc-900 text-sm font-bold hover:text-brand-600 transition-colors">{data.email}</a>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-brand-100 group-hover:bg-rose-600 group-hover:text-white transition-all">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="font-black text-xs uppercase tracking-widest mb-1">Instagram</h4>
                   <a href="https://www.instagram.com/infinitium_arsd/" target="_blank" rel="noopener noreferrer" className="text-zinc-900 text-sm font-bold hover:text-rose-600 transition-colors">{data.instagram}</a>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-700 shadow-sm border border-brand-100 group-hover:bg-blue-700 group-hover:text-white transition-all">
                  <Linkedin className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="font-black text-xs uppercase tracking-widest mb-1">LinkedIn</h4>
                   <a href="https://www.linkedin.com/company/infinitium-arsd/" target="_blank" rel="noopener noreferrer" className="text-zinc-900 text-sm font-bold hover:text-blue-700 transition-colors">{data.linkedin}</a>
                </div>
              </div>

              <div className="flex items-start gap-6 group border-t border-slate-200 pt-8">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-zinc-400 shadow-sm border border-brand-100 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="font-black text-xs uppercase tracking-widest mb-1">Our Location</h4>
                   <p className="text-zinc-500 text-sm font-medium whitespace-pre-line max-w-xs">{data.location}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl shadow-brand-900/5 border border-brand-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -mr-10 -mt-10" />
            
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-zinc-900">Message Sent!</h3>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest max-w-xs transition-colors">
                    Thank you for reaching out. We've received your message and will get back to you shortly.
                  </p>
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-6 relative z-10"
                >
                  <div className="space-y-6">
                     <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-2">Full Name</label>
                       <input 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-6 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-brand-600 focus:bg-white outline-none transition-all font-bold text-sm" 
                        placeholder="Ex: Saksham Raj" 
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-2">Email Address</label>
                       <input 
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-6 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-brand-600 focus:bg-white outline-none transition-all font-bold text-sm" 
                        placeholder="Ex: saksham@gmail.com" 
                       />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-2">Message</label>
                     <textarea 
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full px-6 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl h-40 focus:border-brand-600 focus:bg-white outline-none transition-all font-bold text-sm resize-none" 
                      placeholder="How can we help you today?"
                     ></textarea>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    className="w-full py-5 bg-brand-950 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-brand-600 disabled:bg-zinc-300 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 border border-brand-900 shadow-xl shadow-brand-950/10"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'} <Send className="w-5 h-5" />
                  </button>
                  <p className="text-[9px] text-center text-zinc-400 font-bold uppercase tracking-widest">By sending, you agree to our contact terms.</p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
