import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, ArrowLeft, CheckCircle2, 
  Download, Clock, Tag, Share2, Info, ArrowRight, X
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function EventDetail_Page() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);
  const [formData, setFormData] = useState({
    studentName: '',
    rollNo: '',
    email: ''
  });

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setLoading(true);
      const path = `events/${id}`;
      try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate('/events');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticketId = `INF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const regData = {
        ...formData,
        eventId: event.id,
        eventTitle: event.title,
        ticketId: ticketId,
        sheetId: event.sheetId
      };

      const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL;
      if (!appsScriptUrl) {
        throw new Error("Google Sheets Integration is not configured. Please add 'VITE_APPS_SCRIPT_URL' to your App Secrets in Settings.");
      }

      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });

      setRegistrationSuccess(regData);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = () => {
    const doc = new jsPDF();
    const ticketId = registrationSuccess.ticketId;
    
    // Design matching INFINITIUM aesthetic
    doc.setFillColor(20, 184, 166);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INFINITIUM SOCIETY', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('THE PREMIER SOCIETY OF PHYSICAL SCIENCES - ARSD', 20, 32);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL ENTRY TICKET', 20, 60);
    
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 70, 180, 50, 5, 5, 'FD');
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.text('EVENT NAME', 25, 80);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(event.title.toUpperCase(), 25, 88);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('LOCATION', 25, 100);
    doc.setTextColor(30, 41, 59);
    doc.text(event.location, 25, 108);
    
    doc.setTextColor(100, 116, 139);
    doc.text('DATE', 120, 100);
    doc.setTextColor(30, 41, 59);
    doc.text(event.date, 120, 108);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 135, 190, 135);
    
    doc.setTextColor(100, 116, 139);
    doc.text('STUDENT NAME', 20, 145);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(registrationSuccess.studentName, 20, 153);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.text('ROLL NUMBER', 120, 145);
    doc.setTextColor(30, 41, 59);
    doc.text(registrationSuccess.rollNo, 120, 153);

    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const qrImage = canvas.toDataURL('image/png');
      doc.addImage(qrImage, 'PNG', 75, 170, 60, 60);
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(ticketId, 105, 238, { align: 'center' });
    
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('This is an electronically generated ticket. Please present this QR code at the registration desk.', 105, 260, { align: 'center' });
    doc.text('Verification: teaminfinitium.arsd@gmail.com', 105, 265, { align: 'center' });

    doc.save(`Infinitium_Ticket_${ticketId}.pdf`);
  };

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
    </div>
  );

  const isPast = event.status === 'Past';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[70vh] bg-zinc-950 overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-20">
          <div className="max-w-7xl mx-auto text-center">
             <div className="flex flex-wrap justify-center gap-4 mb-8">
                <span className="px-4 py-1.5 bg-brand-500 text-brand-950 text-[10px] font-black uppercase tracking-widest rounded-full">
                  {event.type}
                </span>
                <span className={cn(
                  "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border",
                  isPast ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-emerald-100 text-emerald-600 border-emerald-200"
                )}>
                  {event.status}
                </span>
             </div>
             <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none italic uppercase mb-8">
               {event.title}
             </h1>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-8 py-20">
        <div className="space-y-12">
            <div>
               <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900 mb-2">
                 {event.subtitle || "Exploring the Frontiers of Physics"}
               </h2>
               <div className="flex flex-wrap gap-8 items-center mt-6 py-6 border-y border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500">
                     <Calendar className="w-4 h-4 text-brand-600" />
                     <span className="text-[10px] font-black uppercase tracking-widest">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                     <MapPin className="w-4 h-4 text-brand-600" />
                     <span className="text-[10px] font-black uppercase tracking-widest">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                     <Tag className="w-4 h-4 text-brand-600" />
                     <span className="text-[10px] font-black uppercase tracking-widest">{event.type}</span>
                  </div>
               </div>
            </div>

            <div className="prose prose-slate max-w-none">
               <p className="text-xl text-slate-600 font-medium leading-relaxed">
                 {event.description}
               </p>
               
               <div className="mt-12 pt-12 border-t border-slate-100">
                 {isPast ? (
                   <div className="inline-block px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-200">
                      Registration Closed
                   </div>
                 ) : (
                   <button 
                     onClick={() => setIsRegistering(true)}
                     className="px-10 py-5 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 active:scale-95 flex items-center gap-3"
                   >
                     Register for Event <ArrowRight className="w-4 h-4" />
                   </button>
                 )}
               </div>
            </div>

            <div className="flex items-center gap-4 pt-10">
               <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest">
                  <Share2 className="w-4 h-4" /> Share
               </button>
               <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest">
                  <Info className="w-4 h-4" /> Policy
               </button>
            </div>
        </div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {isRegistering && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!registrationSuccess) setIsRegistering(false);
              }}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              {!registrationSuccess ? (
                <div className="p-8 md:p-10">
                   <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Register</h2>
                     <button onClick={() => setIsRegistering(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                   
                   <div className="bg-brand-50 p-6 rounded-3xl mb-6 text-slate-900 relative overflow-hidden border border-brand-100">
                     <p className="text-[9px] font-black text-brand-600 uppercase tracking-[0.3em] mb-1">EVENT CONFIRMATION</p>
                     <p className="text-lg font-bold italic text-slate-700">{event?.title}</p>
                     <div className="absolute top-0 right-0 w-24 h-24 bg-brand-200/20 blur-2xl rotate-45 transform translate-x-8 -translate-y-8"></div>
                   </div>

                   <form onSubmit={handleRegister} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                          <input 
                            required
                            type="text" 
                            value={formData.studentName}
                            onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">College Roll No</label>
                          <input 
                            required
                            type="text" 
                            value={formData.rollNo}
                            onChange={(e) => setFormData({...formData, rollNo: e.target.value})}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm"
                            placeholder="22/CS/001"
                          />
                        </div>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">University Email</label>
                       <input 
                         required
                         type="email" 
                         value={formData.email}
                         onChange={(e) => setFormData({...formData, email: e.target.value})}
                         className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm"
                         placeholder="name@arsd.du.ac.in"
                       />
                     </div>
                     <button 
                       disabled={loading}
                       type="submit"
                       className="w-full py-4.5 bg-brand-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/20 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-brand-600/10"
                     >
                       {loading ? 'Processing...' : 'Confirm Registration'}
                     </button>
                   </form>
                </div>
              ) : (
                <div className="p-8 md:p-10 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter uppercase italic">Success</h2>
                  <p className="text-[10px] text-slate-500 mb-8 font-bold uppercase tracking-widest leading-loose">
                    Registration confirmed for <span className="text-brand-600 italic">{event?.title}</span>. 
                    <br />Save the ticket below.
                  </p>
                  
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 mb-8 flex flex-col items-center shadow-inner">
                    <div className="bg-white p-3 rounded-2xl shadow-xl">
                      <QRCodeCanvas 
                        value={registrationSuccess.ticketId} 
                        size={150}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="mt-6 font-black text-[9px] text-slate-400 tracking-[0.4em] uppercase">{registrationSuccess.ticketId}</p>
                  </div>
 
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={downloadTicket}
                      className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20"
                    >
                      <Download className="w-4 h-4" /> Download PDF Ticket
                    </button>
                    <button 
                      onClick={() => {
                        setIsRegistering(false);
                        setRegistrationSuccess(null);
                        setFormData({ studentName: '', rollNo: '', email: '' });
                      }}
                      className="w-full py-3 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:text-slate-900 transition-colors"
                    >
                      Return to Details
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
