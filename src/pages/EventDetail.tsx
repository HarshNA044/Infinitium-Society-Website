import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, ArrowLeft, CheckCircle2, 
  Download, Clock, Tag, Share2, Info, ArrowRight, X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, orderBy, query, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
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
    otherCourse: '',
    year: '',
    collegeName: 'ARSD College',
    isPartOfSociety: 'No',
    societyDepartment: '',
    availability: 'Yes sure'
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
    if (!formData.course) newErrors.course = "Course is required";
    if (formData.course === 'Others' && !formData.otherCourse.trim()) newErrors.otherCourse = "Please specify your course";
    if (!formData.year) newErrors.year = "Year is required";
    if (formData.isPartOfSociety === 'Yes' && !formData.societyDepartment) newErrors.societyDepartment = "Department is required";
    if (!formData.availability) newErrors.availability = "Availability confirmation is required";
    if (event?.isInterCollege && !formData.collegeName.trim()) newErrors.collegeName = "College Name is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (!timeStr.includes(':')) return timeStr; // Fallback if already formatted
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const formattedMinutes = minutes.padStart(2, '0');
    return `${displayH}:${formattedMinutes} ${ampm}`;
  };

  const generateTicketPdf = async (
    ticketId: string,
    studentName: string,
    collegeName: string,
    rollNo: string,
    course: string,
    otherCourse?: string
  ) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    
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
    doc.text(`${event.date}${event.startTime ? ' | ' + formatTime(event.startTime) : ''}`, 130, 102);
    
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.text('ATTENDEE NAME', 25, 120);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(studentName.toUpperCase(), 25, 127);
    
    doc.setTextColor(148, 163, 184);
    doc.text('INSTITUTION', 130, 120);
    doc.setTextColor(30, 41, 59);
    doc.text(collegeName, 130, 127, { maxWidth: 55 });
    
    doc.setTextColor(148, 163, 184);
    doc.text('ROLL NUMBER', 25, 145);
    doc.setTextColor(30, 41, 59);
    doc.text(rollNo, 25, 152);
    
    doc.setTextColor(148, 163, 184);
    doc.text('DEPARTMENT/COURSE', 130, 145);
    doc.setTextColor(30, 41, 59);
    const finalCourse = course === 'Others' ? (otherCourse || '') : course;
    doc.text(finalCourse, 130, 152);

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
    
    return doc;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const ticketId = `INF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const regData = {
        studentName: formData.studentName,
        rollNo: formData.rollNo,
        email: formData.email,
        phoneNo: formData.phoneNo,
        course: formData.course,
        otherCourse: formData.otherCourse,
        year: formData.year,
        collegeName: formData.collegeName,
        isPartOfSociety: formData.isPartOfSociety,
        societyDepartment: formData.societyDepartment,
        availability: formData.availability,
        eventId: event.id,
        eventTitle: event.title,
        ticketId: ticketId,
        sheetId: event.sheetId,
        attended: false,
        createdAt: new Date().toISOString()
      };

      // Generate the official ticket pass as a high-fidelity PDF instantly
      let pdfBase64 = "";
      try {
        const docObj = await generateTicketPdf(
          ticketId,
          formData.studentName,
          formData.collegeName,
          formData.rollNo,
          formData.course,
          formData.otherCourse
        );
        const fullDataUri = docObj.output('datauristring');
        const base64Index = fullDataUri.indexOf(';base64,');
        if (base64Index !== -1) {
          pdfBase64 = fullDataUri.substring(base64Index + 8);
        } else {
          pdfBase64 = btoa(docObj.output());
        }
      } catch (pdfErr) {
        console.error("Failed to generate PDF ticket for email attachment:", pdfErr);
      }

      // Check for config
      const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL;
      console.log("Apps Script Configured Url:", appsScriptUrl);
      if (!appsScriptUrl) {
        setErrors({ submit: "Registration failed: Apps Script URL is not configured. Please set VITE_APPS_SCRIPT_URL in your workspace properties." });
        setLoading(false);
        return;
      }

      // Check duplicate using temp JSON in Firebase
      let isDuplicate = false;
      const tempId = `temp_reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const tempDocRef = doc(db, 'temp_jsons', tempId);
      
      try {
        console.log("Fetching registrations to build temp JSON for duplicate check...");
        const getRegsResponse = await fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'get_registrations',
            sheetId: event.sheetId
          })
        });
        
        const regsResult = await getRegsResponse.json();
        
        if (regsResult.status === "success") {
          const registrationsList = regsResult.registrations || [];
          
          // Store the registrations as a concise JSON in Firebase to comply with the storage-efficient cache requirement
          console.log(`Writing temporary JSON data to Firebase: temp_jsons/${tempId}`);
          await setDoc(tempDocRef, {
            content: JSON.stringify(registrationsList),
            createdAt: serverTimestamp()
          });
          
          // Read back the temporary JSON data from Firebase to perform the duplicate check
          const tempSnap = await getDoc(tempDocRef);
          if (tempSnap.exists()) {
            const cacheContent = tempSnap.data().content;
            const cachedRegs = JSON.parse(cacheContent);
            
            const normalizedRoll = formData.rollNo.toString().trim().toLowerCase();
            isDuplicate = cachedRegs.some((r: any) => 
               r.rollNo && r.rollNo.toString().trim().toLowerCase() === normalizedRoll
            );
          }
        }
      } catch (checkErr) {
        console.error("Error doing temp JSON database duplicate check:", checkErr);
      } finally {
        // ALWAYS delete the temporary JSON document from Firebase Storage/Firestore once duplicate check completes
        try {
          console.log(`Deleting temporary JSON data from Firebase: temp_jsons/${tempId}`);
          await deleteDoc(tempDocRef);
        } catch (delErr) {
          console.error("Error deleting temp JSON document:", delErr);
        }
      }

      if (isDuplicate) {
        setErrors({ submit: "You have already registered for this event. This College Roll No. is already registered." });
        setLoading(false);
        return;
      }

      try {
        const payload = { 
          ...regData, 
          pdfBase64: pdfBase64
        };
        console.log("Sending registration to Apps Script:", payload);
        
        const response = await fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });
        
        const resultText = await response.text();
        console.log("Apps Script response received:", resultText);
        
        if (resultText) {
          if (resultText.includes("Duplicate Registration") || resultText.includes("already registered") || resultText.toLowerCase().includes("duplicate")) {
            setErrors({ submit: "You have already registered for this event. This College Roll No. is already registered." });
            setLoading(false);
            return;
          } else if (resultText.startsWith("Error:")) {
            setErrors({ submit: `Sheet Error: ${resultText.replace("Error:", "").trim()}` });
            setLoading(false);
            return;
          }
        }
        console.log("Sheet update request sent successfully and verified. Result:", resultText);
      } catch (sErr) {
        console.error("CORS, communication, or endpoint error from Apps Script webhook:", sErr);
        setErrors({ submit: "Failed to connect to the spreadsheet server. Please try again or check the configured Webhook link." });
        setLoading(false);
        return;
      }

      setRegistrationSuccess(regData);
    } catch (err: any) {
      console.error(err);
      setErrors({ submit: err?.message || "An unexpected registration error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = async () => {
    try {
      const docObj = await generateTicketPdf(
        registrationSuccess.ticketId,
        registrationSuccess.studentName,
        registrationSuccess.collegeName,
        registrationSuccess.rollNo,
        registrationSuccess.course,
        registrationSuccess.otherCourse
      );
      docObj.save(`INFINITIUM_${event.title.replace(/\s+/g, '_')}_Ticket.pdf`);
    } catch (err) {
      console.error("Failed to download ticket:", err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: event.title,
      url: `https://infinitium-arsd.vercel.app/events/${event.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`https://infinitium-arsd.vercel.app/events/${event.id}`);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // User cancelled, ignore
      }
      console.error('Error sharing:', err);
    }
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
      <div className="relative h-[40vh] md:h-[50vh] bg-zinc-950 overflow-hidden">
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
             <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter leading-none uppercase mb-4">
               {event.title}
             </h1>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-8 py-10 md:py-12">
        <div className="space-y-12">
            <div>
               <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase text-slate-900 mb-2">
                 {event.subtitle || "Exploring the Frontiers of Physics"}
               </h2>
               <div className="flex flex-wrap gap-4 md:gap-8 items-center mt-6 py-6 border-y border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900">
                     <Calendar className="w-4 h-4 text-brand-600" />
                     <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">When: {event.date} {event.startTime && `@ ${formatTime(event.startTime)}`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-900">
                     <MapPin className="w-4 h-4 text-brand-600" />
                     <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-900">
                     <Tag className="w-4 h-4 text-brand-600" />
                     <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{event.type}</span>
                  </div>
               </div>
            </div>

            <div className="prose prose-slate max-w-none">
               <p className="text-lg md:text-xl text-slate-900 font-medium leading-relaxed">
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
               <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest"
               >
                  <Share2 className="w-4 h-4" /> Share
               </button>
            </div>

            {photos.length > 0 && (
              <div className="pt-20 border-t border-slate-100">
                <div className="flex items-end justify-between mb-12">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 leading-none">Event Highlights</h2>
                    <p className="text-[9px] md:text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] mt-3">Moments in Motion</p>
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
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 mx-4 md:mx-0 max-h-[90vh] flex flex-col"
            >
              {!registrationSuccess ? (
                <>
                  <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
                     <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Registration</h2>
                     <button onClick={() => setIsRegistering(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                       <X className="w-5 h-5" />
                     </button>
                  </div>
                  
                  <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="bg-brand-50 p-5 rounded-2xl mb-6 text-slate-900 relative overflow-hidden border border-brand-100">
                      <p className="text-[9px] font-black text-brand-600 uppercase tracking-[0.3em] mb-1">Confirming for</p>
                      <p className="text-base md:text-lg font-bold text-slate-900">{event?.title}</p>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-200/20 blur-2xl rotate-45 transform translate-x-8 -translate-y-8"></div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
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
                          <select 
                            required
                            value={formData.course}
                            onChange={(e) => setFormData({...formData, course: e.target.value})}
                            className={cn(
                              "w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm",
                              errors.course ? "border-red-500" : "border-slate-200"
                            )}
                          >
                            <option value="">Select Course</option>
                            <option value="B.Sc. Physical Science with Computer Science">B.Sc. Physical Science with Computer Science</option>
                            <option value="B.Sc. Physical Science with Chemistry">B.Sc. Physical Science with Chemistry</option>
                            <option value="B.Sc. Physical Science with Electronics">B.Sc. Physical Science with Electronics</option>
                            <option value="B.Sc. Applied Physical Science with Industrial Chemistry">B.Sc. Applied Physical Science with Industrial Chemistry</option>
                            <option value="Others">Others</option>
                          </select>
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

                      {formData.course === 'Others' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Specify Course</label>
                          <input 
                            required
                            type="text" 
                            value={formData.otherCourse}
                            onChange={(e) => setFormData({...formData, otherCourse: e.target.value})}
                            className={cn(
                              "w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm",
                              errors.otherCourse ? "border-red-500" : "border-slate-200"
                            )}
                            placeholder="B.Sc. Physical Science"
                          />
                          {errors.otherCourse && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{errors.otherCourse}</p>}
                        </motion.div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Part of Society?</label>
                          <select 
                            required
                            value={formData.isPartOfSociety}
                            onChange={(e) => setFormData({...formData, isPartOfSociety: e.target.value})}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                        {formData.isPartOfSociety === 'Yes' && (
                          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Department</label>
                            <select 
                              required
                              value={formData.societyDepartment}
                              onChange={(e) => setFormData({...formData, societyDepartment: e.target.value})}
                              className={cn(
                                "w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm",
                                errors.societyDepartment ? "border-red-500" : "border-slate-200"
                              )}
                            >
                              <option value="">Select Dept</option>
                              <option value="Core">Core</option>
                              <option value="Academics">Academics</option>
                              <option value="Content">Content</option>
                              <option value="Digital">Digital</option>
                              <option value="Event">Event</option>
                              <option value="Public Relations">Public Relations</option>
                              <option value="Sponsorship">Sponsorship</option>
                            </select>
                            {errors.societyDepartment && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{errors.societyDepartment}</p>}
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Confirm Availability?</label>
                        <select 
                          required
                          value={formData.availability}
                          onChange={(e) => setFormData({...formData, availability: e.target.value})}
                          className={cn(
                            "w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all outline-none font-bold text-sm",
                            errors.availability ? "border-red-500" : "border-slate-200"
                          )}
                        >
                          <option value="Yes sure">Yes sure</option>
                          <option value="Maybe">Maybe</option>
                        </select>
                        {errors.availability && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{errors.availability}</p>}
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
                            placeholder="College Name"
                          />
                          {errors.collegeName && <p className="text-[8px] text-red-500 font-bold uppercase ml-2">{errors.collegeName}</p>}
                        </div>
                      )}

                      {errors.submit && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold leading-relaxed text-center uppercase tracking-wide">
                          {errors.submit}
                        </div>
                      )}

                      <div className="pt-6 mt-4">
                        <button 
                          disabled={loading}
                          type="submit"
                          className="w-full py-4 bg-brand-600 text-white rounded-xl font-black uppercase text-sm tracking-[0.2em] hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/20 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-brand-600/10"
                        >
                          {loading ? 'Processing...' : 'Confirm Registration'}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="p-6 md:p-10 text-center overflow-y-auto custom-scrollbar flex-1">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tighter uppercase">Success</h2>
                  <p className="text-[10px] text-slate-900 mb-8 font-bold uppercase tracking-widest leading-loose max-w-xs mx-auto">
                    Registration confirmed for <span className="text-brand-600">{event?.title}</span>. 
                    <br />Save the ticket below.
                  </p>
                  
                  <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 mb-8 flex flex-col items-center shadow-inner max-w-sm mx-auto">
                    <div className="bg-white p-3 rounded-2xl shadow-xl w-36 h-36 flex items-center justify-center">
                      <QRCodeSVG 
                        value={registrationSuccess.ticketId} 
                        size={120}
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
                        setFormData({
                          studentName: '',
                          rollNo: '',
                          email: '',
                          phoneNo: '',
                          course: '',
                          otherCourse: '',
                          year: '',
                          collegeName: 'ARSD College',
                          isPartOfSociety: 'No',
                          societyDepartment: '',
                          availability: 'Yes sure'
                        });
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
