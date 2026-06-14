import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Linkedin, Instagram, Send, CheckCircle2, 
  MapPin, Clock, MessageSquare, ShieldCheck, Sparkles 
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function Contact_Page() {
  const [societyEmail, setSocietyEmail] = useState('teaminfinitium.arsd@gmail.com');

  useEffect(() => {
    const fetchContactEmail = async () => {
      try {
        const configDocRef = doc(db, 'settings', 'contact_config');
        const configSnap = await getDoc(configDocRef);
        if (configSnap.exists()) {
          const configData = configSnap.data();
          if (configData.adminEmail && configData.adminEmail.trim()) {
            setSocietyEmail(configData.adminEmail.trim());
          }
        }
      } catch (err) {
        console.warn("Failed to load settings configuration on mount:", err);
      }
    };
    fetchContactEmail();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitError("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Fetch adminEmail and sheetId from global contact configuration settings in Firestore
      let adminEmail = '';
      let sheetId = '';
      
      try {
        const configDocRef = doc(db, 'settings', 'contact_config');
        const configSnap = await getDoc(configDocRef);
        
        if (configSnap.exists()) {
          const configData = configSnap.data();
          adminEmail = configData.adminEmail || '';
          sheetId = configData.sheetId || '';
        }
      } catch (configErr) {
        console.warn("Failed to load settings configuration:", configErr);
      }

      // 2. Fetch configured Google Apps Script Webhook URL
      const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL;

      if (!appsScriptUrl) {
        throw new Error("Apps Script Webhook is not configured in backend settings.");
      }

      if (!sheetId) {
        throw new Error("Spreadsheet storage destination is not configured yet.");
      }

      // 3. Post to Spreadsheet and trigger automated email forwarding in Google Apps Script
      // Absolutely ZERO data is stored in Firebase Firestore, honoring strict constraints.
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors', // standard Apps Script handling
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          sheetId: sheetId,
          adminEmail: adminEmail || undefined, // send email if configured
          name: formData.name,
          email: formData.email,
          subject: formData.subject || 'Direct Inquiry',
          message: formData.message
        })
      });

      setSubmitSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error("Submission failed:", err);
      setSubmitError(err.message || "Failed to submit message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-12 pb-24 relative overflow-x-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100/80 rounded-full text-brand-600 font-bold uppercase text-[9px] tracking-widest mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" /> Reach Out to Us
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase mb-6 leading-tight"
          >
            Contact <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-cyan-600">Us</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 text-sm font-semibold uppercase tracking-widest max-w-lg mx-auto leading-relaxed"
          >
            Have queries about events, registrations, or want to collaborate? Fill the form or ping us on our socials.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-8">
          
          {/* Contact Details Column */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/45">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Society Info</h2>
              
              <div className="space-y-6">
                {/* Physical address */}
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Our Location</h4>
                    <p className="text-xs text-slate-700 font-bold leading-relaxed mt-1">
                      Atma Ram Sanatan Dharma College <br />
                      University of Delhi, Ring Road, <br />
                      Dhaula Kuan, New Delhi - 110021
                    </p>
                  </div>
                </div>

                {/* Email address */}
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</h4>
                    <a href={`mailto:${societyEmail}`} className="text-xs text-brand-600 font-black hover:underline hover:text-brand-700 block mt-1 transition-colors">
                      {societyEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Social media connections */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/45">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Social Channels</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                
                {/* Instagram channel */}
                <a 
                  href="https://www.instagram.com/infinitium_arsd/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-5 bg-gradient-to-r from-pink-50 to-rose-50 border border-rose-100/70 hover:border-rose-200 rounded-2xl flex items-center justify-between group transition-all transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-rose-500 text-white rounded-xl">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Instagram</h4>
                      <p className="text-xs text-rose-950 font-black mt-0.5">@infinitium_arsd</p>
                    </div>
                  </div>
                  <span className="text-xs text-rose-500 font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
                </a>

                {/* LinkedIn channel */}
                <a 
                  href="https://www.linkedin.com/company/infinitium-arsd/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/70 hover:border-blue-200 rounded-2xl flex items-center justify-between group transition-all transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                      <Linkedin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">LinkedIn</h4>
                      <p className="text-xs text-blue-950 font-black mt-0.5">INFINITIUM ARSD</p>
                    </div>
                  </div>
                  <span className="text-xs text-blue-500 font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
                </a>

              </div>
            </div>

          </motion.div>

          {/* Interactive Form Column */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-7"
          >
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/45 relative overflow-hidden">
              
              <AnimatePresence mode="wait">
                {!submitSuccess ? (
                  <motion.form 
                    key="contact-form"
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div>
                      <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Send inquiry</h2>
                    </div>

                    {submitError && (
                      <div className="p-4 bg-red-50 text-red-700 text-xs font-bold border border-red-100 rounded-2xl">
                        {submitError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Full Name <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          name="name" 
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="e.g. Harsh"
                          className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 hover:border-slate-200 focus:border-brand-600 focus:bg-white rounded-2xl text-xs sm:text-sm font-semibold transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Email Address <span className="text-red-500">*</span></label>
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="e.g. abc@gmail.com"
                          className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 hover:border-slate-200 focus:border-brand-600 focus:bg-white rounded-2xl text-xs sm:text-sm font-semibold transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Subject <span className="text-slate-300">(Optional)</span></label>
                      <input 
                        type="text" 
                        name="subject" 
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="e.g. Collaboration Proposal / Membership Query"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 hover:border-slate-200 focus:border-brand-600 focus:bg-white rounded-2xl text-xs sm:text-sm font-semibold transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Message <span className="text-red-500">*</span></label>
                      <textarea 
                        name="message" 
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        placeholder="Type your detailed message here..."
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 hover:border-slate-200 focus:border-brand-600 focus:bg-white rounded-2xl text-xs sm:text-sm font-semibold resize-none transition-all outline-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-8 py-4 bg-brand-950 hover:bg-brand-600 active:scale-95 text-white font-extrabold rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-950/15"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                            Submit Message
                          </>
                        )}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success-container"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12 md:py-20 flex flex-col items-center"
                  >
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-6">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Message Received!</h2>
                    <p className="text-slate-500 text-sm font-bold uppercase mt-2 max-w-sm tracking-wide">
                      Thank you for contacting INFINITIUM!
                    </p>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed mt-4 max-w-md">
                      Your inquiry has been stored securely. Our core team will review your message and reach back to you at your email soon.
                    </p>

                    <button 
                      onClick={() => setSubmitSuccess(false)}
                      className="mt-8 px-6  py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 font-extrabold uppercase text-[10px] tracking-widest rounded-xl transition-all"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}
