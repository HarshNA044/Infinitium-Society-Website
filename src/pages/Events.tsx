import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, Search, Filter, ArrowRight, X, 
  CheckCircle2, Download, QrCode as QrIcon
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { Logo } from '../App';

export default function Events_Page() {
  const [searchParams] = useSearchParams();
  const registerId = searchParams.get('register');
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);
  const [filter, setFilter] = useState('All');

  const [formData, setFormData] = useState({
    studentName: '',
    rollNo: '',
    email: ''
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const path = 'events';
      try {
        const q = query(collection(db, path), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(data);
        if (registerId) {
          const ev = data.find((e: any) => e.id === registerId);
          if (ev) {
            setSelectedEvent(ev);
            setIsRegistering(true);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [registerId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticketId = `INF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const regData = {
        ...formData,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        ticketId: ticketId,
        sheetId: selectedEvent.sheetId
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
    doc.text(selectedEvent.title.toUpperCase(), 25, 88);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('LOCATION', 25, 100);
    doc.setTextColor(30, 41, 59);
    doc.text(selectedEvent.location, 25, 108);
    
    doc.setTextColor(100, 116, 139);
    doc.text('DATE', 120, 100);
    doc.setTextColor(30, 41, 59);
    doc.text(selectedEvent.date, 120, 108);

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

  const filteredEvents = events.filter((e: any) => filter === 'All' || e.type === filter);

  return (
    <div className="py-20 px-4 min-h-screen bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-brand-100">
              <Calendar className="w-3 h-3" /> Schedule
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85] mb-8 uppercase text-left">
              Events & <br /> <span className="text-brand-600">Archive</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium max-w-xs text-sm leading-relaxed uppercase tracking-widest text-right">
            Broaden your horizons with our planned seminars and vibrant fests.
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {['All', 'Seminar', 'Fest', 'Workshop', 'Field Trip'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2 rounded-full font-bold transition-all",
                filter === f 
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-100" 
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event: any) => (
            <motion.div
              layout
              key={event.id}
              className="bento-card group flex flex-col p-0 overflow-hidden"
            >
              <div className="aspect-[16/9] w-full relative overflow-hidden bg-slate-100">
                <img 
                  src={event.image} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  alt={event.title}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase text-slate-900 tracking-widest border border-white/20">
                  {event.date}
                </div>
              </div>
              <div className="p-8 flex flex-col flex-1">
                <div className="mb-6 flex justify-between items-start">
                  <div className="bg-brand-50 w-12 h-12 rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <span className="text-[9px] bento-tag bg-brand-950 text-brand-300 font-black uppercase tracking-widest">{event.type}</span>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tighter uppercase leading-tight group-hover:text-brand-600 transition-colors">{event.title}</h3>
                <p className="text-xs text-slate-500 mb-8 leading-relaxed line-clamp-3 font-medium flex-1">
                  {event.description}
                </p>
                
                <div className="flex items-center gap-2 text-slate-400 mb-8 text-[10px] font-bold uppercase tracking-widest">
                  <MapPin className="w-3 h-3 text-brand-600" />
                  {event.location}
                </div>

                <Link
                  to={`/events/${event.id}`}
                  className="w-full py-4 bg-brand-950 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-brand-600 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-brand-600/20 active:scale-95 border border-brand-900"
                >
                  Explore Event <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
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
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              {!registrationSuccess ? (
                <div className="p-8 md:p-10">
                   <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Register</h2>
                     <button onClick={() => setIsRegistering(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                   
                   <div className="bg-brand-50 p-8 rounded-2xl mb-10 text-slate-900 relative overflow-hidden border border-brand-100">
                     <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] mb-2">EVENT CONFIRMATION</p>
                     <p className="text-xl font-bold text-slate-700">{selectedEvent?.title}</p>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-brand-200/20 blur-2xl rotate-45 transform translate-x-12 -translate-y-12"></div>
                   </div>

                   <form onSubmit={handleRegister} className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                          <input 
                            required
                            type="text" 
                            value={formData.studentName}
                            onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm"
                            placeholder="Harsh"
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
                            placeholder="23/34288"
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
                       className="w-full py-4.5 bg-brand-600 text-white rounded-xl font-black uppercase text-sm tracking-[0.2em] hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/20 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-brand-600/10"
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
                  <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter uppercase">Success</h2>
                  <p className="text-[10px] text-slate-500 mb-8 font-bold uppercase tracking-widest leading-loose">
                    Registration confirmed for <span className="text-brand-600">{selectedEvent?.title}</span>. 
                    <br />Save the ticket below.
                  </p>
                  
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 mb-8 flex flex-col items-center shadow-inner">
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
                      className="w-full py-4 bg-brand-600 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20"
                    >
                      <Download className="w-4 h-4" /> Download PDF Ticket
                    </button>
                    <button 
                      onClick={() => {
                        setIsRegistering(false);
                        setRegistrationSuccess(null);
                        setSelectedEvent(null);
                        setFormData({ studentName: '', rollNo: '', email: '' });
                      }}
                      className="w-full py-3 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:text-slate-900 transition-colors"
                    >
                      Return to Events
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
