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
import { doc, getDoc, collection, getDocs, orderBy, query, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import QRCode from 'qrcode';

export default function EventDetail_Page() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);
  const [formData, setFormData] = useState({
    studentName: '',
    rollNo: '',
    email: '',
    phoneNo: '',
    course: '',
    year: '',
    collegeName: 'ARSD College'
  });

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return;
      setLoading(true);
      const eventRef = doc(db, 'events', id);
      try {
        const docSnap = await getDoc(eventRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
          
          // Fetch photos subcollection
          const photosRef = collection(db, 'events', id, 'photos');
          const q = query(photosRef, orderBy('createdAt', 'desc'));
          const photosSnap = await getDocs(q);
          setPhotos(photosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          navigate('/events');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `events/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, navigate]);

  useEffect(() => {
    if (event && !event.isInterCollege) {
      setFormData(prev => ({ ...prev, collegeName: 'ARSD College' }));
    }
  }, [event]);

  const validate = () => {
    const newErrors: any = {};
    if (!formData.studentName.trim()) newErrors.studentName = "Name is required";
    if (!formData.rollNo.trim()) newErrors.rollNo = "Roll Number is required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Invalid email format";
    if (!formData.phoneNo.match(/^[0-9]{10}$/)) newErrors.phoneNo = "10-digit phone number required";
    if (!formData.course.trim()) newErrors.course = "Course is required";
    if (!formData.year) newErrors.year = "Year is required";
    if (event?.isInterCollege && !formData.collegeName.trim()) newErrors.collegeName = "College Name is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const ticketId = `INF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const timestamp = serverTimestamp();
      
      const regData = {
        ...formData,
        eventId: event.id,
        eventTitle: event.title,
        ticketId: ticketId,
        sheetId: event.sheetId,
        attended: false,
        createdAt: timestamp
      };

      // 1. Save to Google Sheet (Legacy logic)
      const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL;
      if (appsScriptUrl) {
        try {
          await fetch(appsScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...regData, createdAt: new Date().toISOString() })
          });
        } catch (sErr) {
          console.error("Sheet error:", sErr);
        }
      }

      // 2. Save to Firestore (Required for local scanner validation)
      const regRef = doc(db, 'events', event.id, 'registrations', ticketId);
      await setDoc(regRef, regData);

      setRegistrationSuccess(regData);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, `events/${event.id}/registrations`);
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = async () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const ticketId = registrationSuccess.ticketId;
    
    // Generate QR Code Data URL
    const qrDataUrl = await QRCode.toDataURL(ticketId, {
      margin: 1,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    
    // Aesthetic Backdrop
    doc.setFillColor(15, 12, 41); // Deep Navy
    doc.rect(0, 0, 210, 297, 'F');
    
    // Brand Header
    doc.setFillColor(20, 184, 166); // Brand Green
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('INFINITIUM', 105, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subtitleText = 'ATMA RAM SANATAN DHARMA COLLEGE | UNIVERSITY OF DELHI';
    doc.text(subtitleText, 105, 30, { align: 'center' });
    
    // Ticket Container
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 55, 180, 200, 8, 8, 'F');
    
    // Event Details Header
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL ENTRY PASS', 25, 75);
    
    doc.setDrawColor(241, 245, 249);
    doc.line(25, 82, 185, 82);
    
    // Main Content Grid
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('EVENT NAME', 25, 95);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(event.title.toUpperCase(), 25, 102, { maxWidth: 100 });
    
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('DATE & TIME', 130, 95);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(event.date, 130, 102);
    
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.text('ATTENDEE NAME', 25, 120);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(registrationSuccess.studentName.toUpperCase(), 25, 127);
    
    doc.setTextColor(148, 163, 184);
    doc.text('INSTITUTION', 130, 120);
    doc.setTextColor(30, 41, 59);
    doc.text(registrationSuccess.collegeName, 130, 127, { maxWidth: 55 });
    
    doc.setTextColor(148, 163, 184);
    doc.text('ROLL NUMBER', 25, 145);
    doc.setTextColor(30, 41, 59);
    doc.text(registrationSuccess.rollNo, 25, 152);
    
    doc.setTextColor(148, 163, 184);
    doc.text('DEPARTMENT/COURSE', 130, 145);
    doc.setTextColor(30, 41, 59);
    doc.text(registrationSuccess.course, 130, 152);

    // QR Code Section
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(65, 175, 80, 80, 5, 5, 'F');
    doc.addImage(qrDataUrl, 'PNG', 75, 185, 60, 60);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(ticketId, 105, 253, { align: 'center', charSpace: 2 });
    
    // Footer / Terms
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('* Please present this QR Code at the registration desk on the event day.', 105, 270, { align: 'center' });
    doc.text('Unauthorized duplication or resale of this ticket is strictly prohibited.', 105, 275, { align: 'center' });
    
    doc.save(`INFINITIUM_${event.title.replace(/\s+/g, '_')}_Ticket.pdf`);
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
             <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none uppercase mb-8">
               {event.title}
             </h1>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-8 py-20">
        <div className="space-y-12">
            <div>
               <h2 className="text-2xl font-black tracking-tighter uppercase text-slate-900 mb-2">
                 {event.subtitle || "Exploring the Frontiers of Physics"}
               </h2>
               <div className="flex flex-wrap gap-8 items-center mt-6 py-6 border-y border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500">
                     <Calendar className="w-4 h-4 text-brand-600" />
                     <span className="text-[10px] font-black uppercase tracking-widest">When: {event.date}</span>
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
                     className="px-10 py-5 bg-brand-600 text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 active:scale-95 flex items-center gap-3"
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

            {photos.length > 0 && (
              <div className="pt-20 border-t border-slate-100">
                <div className="flex items-end justify-between mb-12">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-900 leading-none">Event Highlights</h2>
                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] mt-3">Moments in Motion</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <motion.div 
                      key={photo.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      onClick={() => setSelectedPhoto(photo.src)}
                      className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group cursor-pointer"
                    >
                      <img 
                        src={photo.src} 
                        alt="Event Highlight" 
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Photo Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full max-h-[85vh] flex items-center justify-center"
            >
              <img src={selectedPhoto} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" referrerPolicy="no-referrer" />
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-12 right-0 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              {!registrationSuccess ? (
                <div className="p-8 md:p-10">
                   <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Register</h2>
                     <button onClick={() => setIsRegistering(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                   
                   <div className="bg-brand-50 p-6 rounded-2xl mb-6 text-slate-900 relative overflow-hidden border border-brand-100">
                     <p className="text-[9px] font-black text-brand-600 uppercase tracking-[0.3em] mb-1">EVENT CONFIRMATION</p>
                     <p className="text-lg font-bold text-slate-700">{event?.title}</p>
                     <div className="absolute top-0 right-0 w-24 h-24 bg-brand-200/20 blur-2xl rotate-45 transform translate-x-8 -translate-y-8"></div>
                   </div>

                   <form onSubmit={handleRegister} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                          <input 
                            required
                            type="text" 
                            value={formData.studentName}
                            onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                            className={cn(
                              "w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm",
                              errors.studentName ? "border-red-500" : "border-slate-200"
                            )}
                            placeholder="Harsh"
                          />
                          {errors.studentName && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{errors.studentName}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">College Roll No</label>
                          <input 
                            required
                            type="text" 
                            value={formData.rollNo}
                            onChange={(e) => setFormData({...formData, rollNo: e.target.value})}
                            className={cn(
                              "w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm",
                              errors.rollNo ? "border-red-500" : "border-slate-200"
                            )}
                            placeholder="23/34288"
                          />
                          {errors.rollNo && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{errors.rollNo}</p>}
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Address</label>
                         <input 
                           required
                           type="email" 
                           value={formData.email}
                           onChange={(e) => setFormData({...formData, email: e.target.value})}
                           className={cn(
                             "w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm",
                             errors.email ? "border-red-500" : "border-slate-200"
                           )}
                           placeholder="harsh@example.com"
                         />
                         {errors.email && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{errors.email}</p>}
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Phone Number</label>
                         <input 
                           required
                           type="tel" 
                           value={formData.phoneNo}
                           onChange={(e) => setFormData({...formData, phoneNo: e.target.value})}
                           className={cn(
                             "w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm",
                             errors.phoneNo ? "border-red-500" : "border-slate-200"
                           )}
                           placeholder="9876543210"
                         />
                         {errors.phoneNo && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{errors.phoneNo}</p>}
                       </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Course</label>
                         <input 
                           required
                           type="text" 
                           value={formData.course}
                           onChange={(e) => setFormData({...formData, course: e.target.value})}
                           className={cn(
                             "w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm",
                             errors.course ? "border-red-500" : "border-slate-200"
                           )}
                           placeholder="B.Sc (H) Physics"
                         />
                         {errors.course && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{errors.course}</p>}
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Year</label>
                         <select 
                           required
                           value={formData.year}
                           onChange={(e) => setFormData({...formData, year: e.target.value})}
                           className={cn(
                             "w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm",
                             errors.year ? "border-red-500" : "border-slate-200"
                           )}
                         >
                           <option value="">Select Year</option>
                           <option value="1">1st Year</option>
                           <option value="2">2nd Year</option>
                           <option value="3">3rd Year</option>
                           <option value="4">4th Year</option>
                         </select>
                         {errors.year && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{errors.year}</p>}
                       </div>
                     </div>
                     
                     {event?.isInterCollege && (
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">College Name</label>
                         <input 
                           required
                           type="text" 
                           value={formData.collegeName}
                           onChange={(e) => setFormData({...formData, collegeName: e.target.value})}
                           className={cn(
                             "w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm",
                             errors.collegeName ? "border-red-500" : "border-slate-200"
                           )}
                           placeholder="Atma Ram Sanatan Dharma College"
                         />
                         {errors.collegeName && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{errors.collegeName}</p>}
                       </div>
                     )}

                     <button 
                       disabled={loading}
                       type="submit"
                       className="w-full py-4 bg-brand-600 text-white rounded-xl font-black uppercase text-sm tracking-[0.2em] hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/20 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-brand-600/10"
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
                    Registration confirmed for <span className="text-brand-600">{event?.title}</span>. 
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
