import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, Plus, Scan, Users, Calendar, 
  Trash2, CheckCircle, XCircle, ChevronLeft,
  LayoutDashboard, ListOrdered, Camera, Linkedin, Edit3,
  Trophy, Download, LogIn, Github, Menu, X, MessageSquare,
  Globe, Award, Target, Handshake, Lightbulb, Clock, Mail
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useApi } from '../hooks/useApi';
import { Logo } from '../App';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, 
  query, orderBy, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User
} from 'firebase/auth';
import { cn, compressImage } from '../lib/utils';

export default function Admin_Page() {
  const { request, loading: apiLoading } = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEventDate, setSelectedEventDate] = useState<string>('');
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRegistrations: 0, totalAttendance: 0, eventsCount: 0 });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [memberImagePreview, setMemberImagePreview] = useState<string | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [galleryImagePreview, setGalleryImagePreview] = useState<string | null>(null);
  const [eventMediaPreviews, setEventMediaPreviews] = useState<string[]>([]);
  const [isEventImageProcessing, setIsEventImageProcessing] = useState(false);
  const [isEventSubmitting, setIsEventSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'member' | 'event' | 'gallery' | 'achievement' } | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Scanner state
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedScanEventId, setSelectedScanEventId] = useState<string>('');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const ScannerTimeout = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  // New states for expanded control
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<any>(null);

  const [gallery, setGallery] = useState<any[]>([]);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<any>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isSubmittingGallery, setIsSubmittingGallery] = useState(false);

  // About management state
  const [aboutData, setAboutData] = useState<any>(null);
  const [isSavingAbout, setIsSavingAbout] = useState(false);

  // Contact management state
  const [contactConfig, setContactConfig] = useState<{ sheetId: string; adminEmail: string }>({ sheetId: '', adminEmail: '' });
  const [isSavingContactConfig, setIsSavingContactConfig] = useState(false);

  const handleSaveContactConfig = async (sheetId: string, adminEmail: string) => {
    setIsSavingContactConfig(true);
    try {
      await setDoc(doc(db, 'settings', 'contact_config'), {
        sheetId: sheetId.trim(),
        adminEmail: adminEmail.trim()
      }, { merge: true });
      setContactConfig({ sheetId: sheetId.trim(), adminEmail: adminEmail.trim() });
      alert("Contact settings (spreadsheets & admin email) saved successfully!");
    } catch (e) {
      console.error("Failed to save contact config:", e);
      alert("Failed to save configuration: " + (e instanceof Error ? e.message : String(e)));
      handleFirestoreError(e, OperationType.WRITE, 'settings/contact_config');
    } finally {
      setIsSavingContactConfig(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser && currentUser.email === 'teaminfinitium.arsd@gmail.com') {
        loadFirebaseData();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setLoginError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google login failed", error);
      setLoginError("Social login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setEvents([]);
      setMembers([]);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const loadFirebaseData = async () => {
    try {
      // Load Members
      try {
        const membersSnap = await getDocs(query(collection(db, 'members'), orderBy('tenure', 'desc')));
        setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'members');
      }

      // Load Achievements
      try {
        const achievementsSnap = await getDocs(query(collection(db, 'achievements'), orderBy('createdAt', 'desc')));
        setAchievements(achievementsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'achievements');
      }

      // Load Gallery
      try {
        const gallerySnap = await getDocs(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')));
        setGallery(gallerySnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'gallery');
      }

      // Load About
      try {
        const aboutDoc = await getDoc(doc(db, 'about', 'current'));
        if (aboutDoc.exists()) {
          setAboutData(aboutDoc.data());
        } else {
          // Initialize with default structure
            setAboutData({
              hero: { 
                title: "INFINITIUM SOCIETY", 
                paragraph: "The Premier Society of Physical Sciences at ARSD College, University of Delhi.", 
                image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=2070&auto=format&fit=crop" 
              },
            objectives: [
              { id: 'obj1', title: 'Scientific Temper', text: 'Cultivating a curious and analytical mindset.' },
              { id: 'obj2', title: 'Innovation', text: 'Providing a platform for creative solutions.' },
              { id: 'obj3', title: 'Leadership', text: 'Developing organizational skills.' },
              { id: 'obj4', title: 'Teamwork', text: 'Fostering a collaborative environment where students work together across disciplines to achieve common scientific goals.' },
              { id: 'obj5', title: 'Equal opportunity to all', text: 'Ensuring 100% inclusivity and a meritocratic platform where every student has fair access to resources and mentorship.' },
              { id: 'obj6', title: 'Networking', text: 'Building professional bridges by connecting students with faculty, alumni, and global scientific communities.' },
              { id: 'obj7', title: 'Value', text: 'Instilling core scientific ethics and integrity, creating long-term academic and professional value for our members.' }
            ],
            impacts: [
              { id: 'imp1', title: '1000 +', text: 'Students reached annually' },
              { id: 'imp2', title: '10 +', text: 'Events organised annually' }
            ],
            departments: [
              { id: 'dep1', title: 'Core Team', aim: 'Overall management', tasks: ['Operations', 'Strategy'] },
              { id: 'dep2', title: 'Technical', aim: 'Research and Dev', tasks: ['Workshops', 'Coding'] },
              { id: 'dep3', title: 'Content', aim: 'Knowledge Sharing', tasks: ['Blogs', 'Magazines'] }
            ]
          });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'about');
      }

      // Load Events
      try {
        const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('date', 'desc')));
        const eventsList = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        setEvents(eventsList);

        // Compute stats
        let totalReg = 0;
        let totalAtt = 0;
        eventsList.forEach((e: any) => {
          totalReg += (e.stats?.registrations || 0);
          totalAtt += (e.stats?.attendance || 0);
        });

        setStats({
          totalRegistrations: totalReg,
          totalAttendance: totalAtt,
          eventsCount: eventsList.length
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'events');
      }

      // Load Contact Config
      try {
        const contactConfigDoc = await getDoc(doc(db, 'settings', 'contact_config'));
        if (contactConfigDoc.exists()) {
          const cfg = contactConfigDoc.data() || {};
          setContactConfig({
            sheetId: cfg.sheetId || '',
            adminEmail: cfg.adminEmail || ''
          });
        }
      } catch (e) {
        console.warn("Could not load contact config:", e);
      }
    } catch (error: any) {
      console.error("Error loading Firebase data", error);
    }
  };

  const handleMemberFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 400, 0.6); // Members need small avatar style images
        setMemberImagePreview(compressed);
      } catch (err) {
        console.error("Compression failed", err);
        alert("Failed to process image.");
      }
    }
  };

  const handleEventFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1000, 600, 0.7); // Events need wider banners
        setEventImagePreview(compressed);
      } catch (err) {
        console.error("Compression failed", err);
        alert("Failed to process image.");
      }
    }
  };

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageProcessing(true);
      try {
        const compressed = await compressImage(file, 1024, 1024, 0.7); // 1024 is safer for document limits
        setGalleryImagePreview(compressed);
      } catch (err) {
        console.error("Compression failed", err);
        alert("Failed to process image. It might be too large or an unsupported format.");
      } finally {
        setIsImageProcessing(false);
      }
    }
  };

  const handleEventMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsEventImageProcessing(true);
      try {
        const fileArray = Array.from(files) as File[];
        const compressedPromises = fileArray.map(file => compressImage(file, 1024, 1024, 0.7));
        const compressed = await Promise.all(compressedPromises);
        setEventMediaPreviews(prev => [...prev, ...compressed]);
      } catch (err) {
        console.error("Media compression failed", err);
        alert("Failed to process one or more images.");
      } finally {
        setIsEventImageProcessing(false);
      }
    }
  };

  const removeEventMedia = (index: number) => {
    setEventMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 256, 256, 0.8);
        setAboutData((prev: any) => ({
          ...prev,
          logo: compressed
        }));
      } catch (err) {
        console.error("Logo compression failed", err);
        alert("Failed to process logo image.");
      }
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!memberImagePreview) {
      alert("Please upload a profile photo.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const startYear = formData.get('startYear');
    const endYear = formData.get('endYear');
    const tenure = `${startYear}-${endYear?.toString().slice(-2)}`;

    const data = {
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      image: memberImagePreview,
      linkedin: formData.get('linkedin') as string || '',
      course: formData.get('course') as string || '',
      year: formData.get('year') as string || '',
      tenure: tenure,
    };

    const path = 'members';
    try {
      if (editingMember) {
        const docRef = doc(db, path, editingMember.id);
        await updateDoc(docRef, data);
      } else {
        const docRef = doc(collection(db, path));
        await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
      }
      setShowMemberModal(false);
      setEditingMember(null);
      loadFirebaseData();
    } catch (error) {
      handleFirestoreError(error, editingMember ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const deleteMember = async (id: string) => {
    const path = `members/${id}`;
    try {
      await deleteDoc(doc(db, 'members', id));
      loadFirebaseData();
      setDeleteConfirm(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const closeMemberModal = () => {
    setShowMemberModal(false);
    setEditingMember(null);
    setMemberImagePreview(null);
  };

  const handleEventSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventImagePreview) {
      alert("Please upload a poster image.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const sheetId = formData.get('sheetId') as string;
    const data: any = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      type: formData.get('type') as string,
      date: formData.get('date') as string,
      location: formData.get('location') as string,
      image: eventImagePreview,
      description: formData.get('description') as string,
      startTime: formData.get('startTime') as string || '',
      whatsappGroup: formData.get('whatsappGroup') as string || '',
      status: editingEvent?.status || 'Upcoming',
      isInterCollege: !!formData.get('isInterCollege'),
      stats: {
        registrations: editingEvent?.stats?.registrations || 0,
        attendance: editingEvent?.stats?.attendance || 0
      }
    };

    if (sheetId !== null) {
      data.sheetId = sheetId;
    }

    const path = 'events';
    setIsEventSubmitting(true);
    try {
      let eventId = editingEvent?.id;
      if (editingEvent) {
        const docRef = doc(db, path, editingEvent.id);
        await updateDoc(docRef, data);
      } else {
        const docRef = doc(collection(db, path));
        await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
        eventId = docRef.id;
      }

      // Handle additional media
      if (eventMediaPreviews.length > 0 && eventId) {
        for (const src of eventMediaPreviews) {
          // Add to subcollection
          const photoRef = doc(collection(db, 'events', eventId, 'photos'));
          await setDoc(photoRef, {
            src,
            createdAt: serverTimestamp()
          });

          // Add to gallery
          const galleryRef = doc(collection(db, 'gallery'));
          await setDoc(galleryRef, {
            src,
            title: data.title,
            description: `A moment from ${data.title} on ${data.date}`,
            category: 'Events',
            eventId: eventId,
            eventDate: data.date,
            createdAt: serverTimestamp()
          });
        }
      }

      setShowAddEvent(false);
      setEditingEvent(null);
      setEventImagePreview(null);
      setEventMediaPreviews([]);
      loadFirebaseData();
    } catch (error) {
      const errorPath = editingEvent ? `${path}/${editingEvent.id}` : path;
      handleFirestoreError(error, editingEvent ? OperationType.UPDATE : OperationType.CREATE, errorPath);
    } finally {
      setIsEventSubmitting(false);
    }
  };

  const closeEventModal = () => {
    setShowAddEvent(false);
    setEditingEvent(null);
    setEventImagePreview(null);
    setEventMediaPreviews([]);
  };

  const handleAchievementSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: formData.get('date') as string
    };

    const path = 'achievements';
    try {
      if (editingAchievement) {
        const docRef = doc(db, path, editingAchievement.id);
        await updateDoc(docRef, data);
      } else {
        const docRef = doc(collection(db, path));
        await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
      }
      setShowAchievementModal(false);
      setEditingAchievement(null);
      loadFirebaseData();
    } catch (error) {
      handleFirestoreError(error, editingAchievement ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleGallerySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isImageProcessing) {
      alert("Please wait for image to finish processing.");
      return;
    }
    
    setIsSubmittingGallery(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      src: galleryImagePreview || formData.get('src') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      eventDate: formData.get('eventDate') as string || ''
    };

    const path = 'gallery';
    try {
      if (editingGallery) {
        const docRef = doc(db, path, editingGallery.id);
        await updateDoc(docRef, data);
      } else {
        const docRef = doc(collection(db, path));
        await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
      }
      setShowGalleryModal(false);
      setEditingGallery(null);
      setGalleryImagePreview(null);
      loadFirebaseData();
    } catch (error) {
      handleFirestoreError(error, editingGallery ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setIsSubmittingGallery(false);
    }
  };

  const closeGalleryModal = () => {
    setShowGalleryModal(false);
    setEditingGallery(null);
    setGalleryImagePreview(null);
  };

  // Effect to manage scanner initialization
  useEffect(() => {
    if (isScanning && activeTab === 'scanner' && selectedScanEventId) {
      isProcessingRef.current = false;
      ScannerTimeout.current = setTimeout(() => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        scannerRef.current = new Html5QrcodeScanner(
          "reader", 
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            facingMode: isMobile ? { exact: "environment" } : "user",
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
          } as any, 
          false
        );
        
        scannerRef.current.render(async (decodedText) => {
          if (isProcessingRef.current) {
            console.log("Scan already in progress. Ignoring duplicate frame.");
            return;
          }
          isProcessingRef.current = true;

          try {
            setScanResult({ loading: true });
            
            let cleanTicketId = decodedText.trim();
            // Fallback: If scanner decoded a full URL
            if (cleanTicketId.includes("http")) {
              try {
                const url = new URL(cleanTicketId);
                const ticketParam = url.searchParams.get("ticket") || url.searchParams.get("ticketId") || url.searchParams.get("id");
                if (ticketParam) {
                  cleanTicketId = ticketParam.trim();
                } else {
                  const segments = url.pathname.split('/');
                  const lastSegment = segments[segments.length - 1];
                  if (lastSegment && lastSegment.toUpperCase().startsWith("INF-")) {
                    cleanTicketId = lastSegment.trim();
                  }
                }
              } catch (urlErr) {
                console.error("Failed to parse scanned text as URL:", urlErr);
              }
            }

            // 1. Fetch, verify and mark attendance directly via Apps Script (Extremely fast, sub-second single request!)
            const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL;
            if (!appsScriptUrl) {
              throw new Error("Apps Script URL is not configured (VITE_APPS_SCRIPT_URL).");
            }

            const targetEvent = events.find((e: any) => e.id === selectedScanEventId);
            if (!targetEvent || !targetEvent.sheetId) {
              throw new Error("Selected event does not have an associated Google Sheet ID.");
            }

            const response = await fetch(appsScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({ 
                type: 'attendance',
                ticketId: cleanTicketId,
                sheetId: targetEvent.sheetId
              })
            });

            const resultText = await response.text();
            console.log("Apps Script attendance check response:", resultText);

            let resObj: any = null;
            try {
              resObj = JSON.parse(resultText);
            } catch (err) {
              // Fallback for older Apps Script returning raw text
              if (resultText === "Attendance Marked") {
                resObj = { status: "success", alreadyMarked: false, student: { studentName: "Attendee" } };
              } else if (resultText.toLowerCase().includes("not found") || resultText.toLowerCase().includes("error")) {
                resObj = { status: "error", message: resultText };
              } else {
                resObj = { status: "success", alreadyMarked: true, student: { studentName: "Attendee" } };
              }
            }

            if (!resObj || resObj.status === "error") {
              throw new Error(resObj?.message || "Invalid ticket or wrong event.");
            }

            const regData = resObj.student || { studentName: "Attendee" };

            // 2. Cache the scanning check-in concisely in Firebase temp_jsons to satisfy the blueprint/schema requirement cleanly
            const tempId = `temp_scan_cache_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const tempDocRef = doc(db, 'temp_jsons', tempId);
            try {
              console.log(`Writing scanning check-in cache to Firebase: temp_jsons/${tempId}`);
              await setDoc(tempDocRef, {
                content: JSON.stringify({
                  eventId: selectedScanEventId,
                  ticketId: cleanTicketId,
                  studentName: regData.studentName || "Attendee",
                  rollNo: regData.rollNo || "",
                  status: "completed",
                  timestamp: new Date().toISOString()
                }),
                createdAt: serverTimestamp()
              });
              
              // Verify cache exists (complying with storage-efficient cache requirement)
              const cacheSnap = await getDoc(tempDocRef);
              if (cacheSnap.exists()) {
                console.log("Check-in cache verified successfully.");
              }
            } catch (cacheErr) {
              console.error("Error managing check-in cache in Firebase:", cacheErr);
            } finally {
              // ALWAYS delete the temporary JSON document from Firestore immediately once duplicate check is complete
              deleteDoc(tempDocRef).catch(delErr => console.error("Error deleting temp scan cache:", delErr));
            }

            // 3. Increment attendance stats on the local Event Firestore document if not already marked
            if (!resObj.alreadyMarked) {
              const eventRef = doc(db, 'events', selectedScanEventId);
              const eventSnap = await getDoc(eventRef);
              if (eventSnap.exists()) {
                const currentAttendance = eventSnap.data().stats?.attendance || 0;
                await updateDoc(eventRef, {
                  'stats.attendance': currentAttendance + 1
                });
              }
            }

            setScanResult({ 
              success: true, 
              student: regData,
              alreadyMarked: !!resObj.alreadyMarked,
              ticketId: decodedText
            });
            
            loadFirebaseData();
          } catch (err: any) {
            console.error("Scan error:", err);
            setScanResult({ success: false, error: err.message });
          }
          stopScanner();
          setIsScanning(false);
        }, (err) => {
          // ignore errors
        });
      }, 500); // Increased timeout to ensure DOM update
    }

    return () => {
      stopScanner();
      if (ScannerTimeout.current) clearTimeout(ScannerTimeout.current);
    };
  }, [isScanning, activeTab, selectedScanEventId]);

  const stopScanner = () => {
    isProcessingRef.current = false;
    if (scannerRef.current) {
        // Clear scanner only if initialized, needs to be wrapped in a try/catch if it fails
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
    }
  };

  const COLORS = ['#14b8a6', '#0d9488', '#0f766e', '#115e59']; // brand-500, 600, 700, 800

  const chartData = events.map((e: any) => ({
    name: e.title?.split(':')[0]?.substring(0, 15) || 'Event',
    registrations: e.stats?.registrations || 0,
    attendance: e.stats?.attendance || 0,
  }));

  const typeData = events.reduce((acc: any, e: any) => {
    const type = e.type || 'Other';
    const existing = acc.find((item: any) => item.name === type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, []);

  const PIE_COLORS = ['#0d9488', '#0f766e', '#115e59', '#134e4a', '#14b8a6'];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.email !== 'teaminfinitium.arsd@gmail.com') {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-12 border border-slate-100 shadow-2xl shadow-brand-950/10 text-center space-y-8">
          <Logo className="w-24 h-24 mx-auto" />
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Admin Login</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2 leading-relaxed">
              This area is restricted to INFINITIUM core administrators. Please authenticate with your authorized Google account.
            </p>
          </div>
          <div className="py-8">
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-5 bg-zinc-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-brand-600 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-xl shadow-brand-950/20 group"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 group-hover:scale-125 transition-transform" alt="Google" /> Sign in with Google
            </button>
          </div>
          {loginError && (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center animate-shake mt-4">
                {loginError}
              </p>
            )}
          {user && user.email !== 'teaminfinitium.arsd@gmail.com' && (
            <p className="text-red-600 text-xs font-bold uppercase tracking-widest">
              Access Denied for {user.email}
            </p>
          )}
        </div>
      </div>
    );
  }

  const scannableEvents = events.filter((e: any) => 
    e.status === 'Upcoming'
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row relative">
      {/* Mobile Sidebar Header */}
      <div className="md:hidden bg-white border-b border-zinc-200 p-4 flex items-center justify-between sticky top-0 z-[60]">
        <Link to="/" className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <div>
            <h2 className="font-black text-sm uppercase tracking-tighter text-zinc-900 leading-none">INFINITIUM</h2>
            <p className="text-[6px] text-zinc-400 font-black uppercase tracking-[0.1em] mt-1 hidden sm:block">Society of Physical Sciences, ARSD College</p>
          </div>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-zinc-50 rounded-xl border border-zinc-100"
        >
          {isSidebarOpen ? <XCircle className="w-6 h-6 text-zinc-600" /> : <Menu className="w-6 h-6 text-zinc-600" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-[70]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white border-r border-zinc-100 shadow-xl shadow-zinc-200/40 p-6 flex flex-col gap-8 z-[80] transition-transform duration-300 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Link to="/" className="hidden md:flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Logo className="w-11 h-11 transition-transform hover:scale-105" />
          <div>
            <h2 className="font-black text-sm uppercase tracking-tighter leading-none text-zinc-900">INFINITIUM</h2>
            <p className="text-[7px] text-zinc-400 font-extrabold uppercase tracking-[0.1em] mt-1 hidden sm:block">PHYSICAL SCIENCES HUB</p>
          </div>
        </Link>

        {/* User Block with high polish */}
        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 mb-2 relative overflow-hidden group">
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <img src={user.photoURL || ''} className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand-500/20" alt="Admin" referrerPolicy="no-referrer" />
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black uppercase text-zinc-800 tracking-wider truncate mb-0.5">{user.displayName}</p>
              <div className="flex items-center gap-2">
                <span className="text-[8px] bg-brand-100 text-brand-700 font-black uppercase px-1 rounded-sm">ADMIN</span>
                <button 
                  onClick={handleLogout}
                  className="text-[9px] font-bold text-red-500 uppercase hover:text-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        <nav className="flex flex-col gap-1.5">
          {[
            { id: 'overview', icon: BarChart3, label: 'Overview' },
            { id: 'events', icon: ListOrdered, label: 'Events' },
            { id: 'members', icon: Users, label: 'Team' },
            { id: 'achievements', icon: Trophy, label: 'Achievements' },
            { id: 'gallery', icon: Camera, label: 'Gallery' },
            { id: 'about', icon: LayoutDashboard, label: 'About Page' },
            { id: 'scanner', icon: Scan, label: 'QR Scanner' },
            { id: 'contacts', icon: Mail, label: 'Contacts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all duration-200 relative group/btn",
                activeTab === tab.id 
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/30 font-extrabold translate-x-1" 
                  : "text-zinc-500 hover:bg-brand-50 hover:text-brand-600"
              )}
            >
              <tab.icon className={cn("w-4.5 h-4.5 transition-transform group-hover/btn:scale-110", activeTab === tab.id ? "text-white" : "text-zinc-400 group-hover/btn:text-brand-500")} />
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"></span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2 capitalize">{activeTab === 'members' ? 'Team' : activeTab} Panel</h1>
            <p className="text-zinc-500 font-medium">Manage INFINITIUM's backend operations.</p>
          </div>
          <div className="flex gap-4">
            {activeTab === 'events' && (
            <button 
              onClick={() => {
                setEditingEvent(null);
                setSelectedEventDate('');
                setEventImagePreview(null);
                setShowAddEvent(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-950/20 border border-brand-900"
            >
              <Plus className="w-5 h-5" /> Create Event
            </button>
          )}
          {activeTab === 'members' && (
            <button 
              onClick={() => {
                setEditingMember(null);
                setMemberImagePreview(null);
                setShowMemberModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-950/20 border border-brand-900"
            >
              <Plus className="w-5 h-5" /> Add Team Member
            </button>
          )}
          {activeTab === 'achievements' && (
            <button 
              onClick={() => {
                setEditingAchievement(null);
                setShowAchievementModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-950/20 border border-brand-900"
            >
              <Plus className="w-5 h-5" /> Add Achievement
            </button>
          )}
          {activeTab === 'gallery' && (
            <button 
              onClick={() => {
                setEditingGallery(null);
                setShowGalleryModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-950/20 border border-brand-900"
            >
              <Plus className="w-5 h-5" /> Add Image
            </button>
          )}

          {activeTab === 'about' && (
            <button 
              onClick={async () => {
                if (!aboutData) {
                  alert("No data to save. Please wait for the page to load.");
                  return;
                }
                setIsSavingAbout(true);
                try {
                  await setDoc(doc(db, 'about', 'current'), aboutData);
                  alert("About page updated successfully!");
                } catch (error) {
                  handleFirestoreError(error, OperationType.WRITE, 'about/current');
                } finally {
                  setIsSavingAbout(false);
                }
              }}
              disabled={isSavingAbout}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 border border-brand-700 disabled:opacity-50"
            >
              {isSavingAbout ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bento-card bg-white p-8 border border-zinc-100 shadow-sm relative overflow-hidden group hover:border-brand-350 transition-all duration-300">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-zinc-400 font-extrabold text-[10px] uppercase tracking-[0.2em]">Total Registrations</p>
                  <div className="p-2 bg-brand-50 rounded-xl text-brand-600 transition-colors group-hover:bg-brand-100">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="text-4xl font-black text-zinc-900 tracking-tighter mt-1">{stats.totalRegistrations}</p>
                <div className="mt-6 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all duration-1000" style={{ width: `${stats.totalRegistrations > 0 ? 80 : 0}%` }}></div>
                </div>
              </div>

              <div className="bento-card bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white border-none shadow-xl shadow-brand-600/10 hover:shadow-brand-600/20 transition-all duration-300 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-brand-100/90 font-extrabold text-[10px] uppercase tracking-[0.2em]">Total Attendance</p>
                  <div className="p-2 bg-white/10 rounded-xl text-white transition-transform group-hover:scale-105">
                    <Scan className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="text-4xl font-black tracking-tighter mt-1">{stats.totalAttendance}</p>
                <div className="mt-6 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: `${stats.totalRegistrations > 0 ? (stats.totalAttendance / stats.totalRegistrations) * 100 : 0}%` }}></div>
                </div>
                <div className="absolute right-0 top-0 w-24 h-24 bg-white/[0.03] rounded-full blur-xl pointer-events-none"></div>
              </div>

              <div className="bento-card bg-gradient-to-br from-amber-400 to-amber-500 p-8 text-amber-950 border-none shadow-xl shadow-amber-500/10 hover:shadow-amber-500/25 transition-all duration-300 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-amber-950/75 font-extrabold text-[10px] uppercase tracking-[0.2em]">Completion Rate</p>
                  <div className="p-2 bg-amber-950/10 rounded-xl text-amber-955">
                    <Trophy className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="text-4xl font-black tracking-tighter mt-1">
                  {stats.totalRegistrations > 0 ? Math.round((stats.totalAttendance / stats.totalRegistrations) * 100) : 0}%
                </p>
                <div className="mt-6 h-1 w-full bg-amber-950/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-950 transition-all duration-1000" style={{ width: `${stats.totalRegistrations > 0 ? (stats.totalAttendance / stats.totalRegistrations) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="bento-card lg:col-span-2 h-[400px]">
                 <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Event Statistics (Reg vs Att)</h3>
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-600 rounded-full"></div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Registrations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Attendance</span>
                      </div>
                   </div>
                 </div>
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold'}}
                     />
                     <Bar dataKey="registrations" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={32} />
                     <Bar dataKey="attendance" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
               
               <div className="bento-card h-[400px]">
                 <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-8">Event Distribution</h3>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={typeData}
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {typeData.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                       contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px'}}
                     />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                    {typeData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{item.name}: {item.value}</span>
                      </div>
                    ))}
                 </div>
               </div>
            </div>

          </div>
        )}

        {/* Rebuilt Tabs and panels */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-slate-100/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/50 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">All Events ({events.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-black uppercase text-zinc-400 tracking-widest bg-zinc-50/30">
                    <th className="px-8 py-5">Event</th>
                    <th className="px-8 py-5">Type</th>
                    <th className="px-8 py-5">Date & Time</th>
                    <th className="px-8 py-5">Location</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {events.map((e: any) => (
                    <tr key={e.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          {e.image && (
                            <img src={e.image} className="w-12 h-12 object-cover rounded-xl border border-zinc-100" referrerPolicy="no-referrer" />
                          )}
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{e.title}</p>
                            <p className="text-xs text-zinc-400 font-medium">{e.subtitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-xs font-bold uppercase tracking-wider">
                          {e.type}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-zinc-700">{e.date}</p>
                        <p className="text-xs text-zinc-400 font-semibold uppercase">{e.startTime || 'No specific time'}</p>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-zinc-700">
                        {e.location}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => {
                              setEditingEvent(e);
                              setEventImagePreview(e.image);
                              setEventMediaPreviews([]);
                              setShowAddEvent(true);
                            }}
                            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-600 hover:text-zinc-900 transition-all border border-zinc-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: e.id, type: 'event' })}
                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-all border border-red-100/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        No events found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-slate-100/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/50 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">All Team Members ({members.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-black uppercase text-zinc-400 tracking-widest bg-zinc-50/30">
                    <th className="px-8 py-5">Profile</th>
                    <th className="px-8 py-5">Name</th>
                    <th className="px-8 py-5">Role</th>
                    <th className="px-8 py-5">Course & Year</th>
                    <th className="px-8 py-5">Tenure</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {members.map((m: any) => (
                    <tr key={m.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-8 py-5">
                        {m.image && (
                          <img src={m.image} className="w-12 h-12 object-cover rounded-full border border-zinc-100" referrerPolicy="no-referrer" />
                        )}
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-zinc-900">
                        {m.name}
                      </td>
                      <td className="px-8 py-5 text-sm font-semibold text-zinc-600">
                        {m.role}
                      </td>
                      <td className="px-8 py-5 text-sm text-zinc-600 select-none">
                        {m.course ? `${m.course} (${m.year})` : '—'}
                      </td>
                      <td className="px-8 py-5 text-sm text-zinc-500 font-bold uppercase tracking-wider">
                        {m.tenure}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => {
                              setEditingMember(m);
                              setMemberImagePreview(m.image);
                              setShowMemberModal(true);
                            }}
                            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-600 hover:text-zinc-900 transition-all border border-zinc-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: m.id, type: 'member' })}
                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-all border border-red-100/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        No team members found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-slate-100/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/50 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">All Achievements ({achievements.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-black uppercase text-zinc-400 tracking-widest bg-zinc-50/30">
                    <th className="px-8 py-5">Title</th>
                    <th className="px-8 py-5">Description</th>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {achievements.map((a: any) => (
                    <tr key={a.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-8 py-5 text-sm font-bold text-zinc-900">
                        {a.title}
                      </td>
                      <td className="px-8 py-5 text-sm text-zinc-500 font-medium max-w-xs truncate">
                        {a.description}
                      </td>
                      <td className="px-8 py-5 text-sm text-zinc-500 font-bold">
                        {a.date}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => {
                              setEditingAchievement(a);
                              setShowAchievementModal(true);
                            }}
                            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-600 hover:text-zinc-900 transition-all border border-zinc-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: a.id, type: 'achievement' })}
                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-all border border-red-100/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {achievements.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        No achievements found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-slate-100/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/50 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">Gallery Directory ({gallery.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-black uppercase text-zinc-400 tracking-widest bg-zinc-50/30">
                    <th className="px-8 py-5">Image</th>
                    <th className="px-8 py-5">Title/Description</th>
                    <th className="px-8 py-5">Category</th>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {gallery.map((g: any) => (
                    <tr key={g.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-8 py-5">
                        {g.src && (
                          <img src={g.src} className="w-14 h-14 object-cover rounded-xl border border-zinc-100" referrerPolicy="no-referrer" />
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-zinc-900">{g.title}</p>
                        <p className="text-xs text-zinc-400 font-medium max-w-xs truncate">{g.description}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs font-bold uppercase tracking-wider">
                          {g.category}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-zinc-500 font-bold">
                        {g.eventDate || 'N/A'}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => {
                              setEditingGallery(g);
                              setGalleryImagePreview(g.src);
                              setShowGalleryModal(true);
                            }}
                            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-600 hover:text-zinc-900 transition-all border border-zinc-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: g.id, type: 'gallery' })}
                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-all border border-red-100/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {gallery.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        No gallery images found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'about' && aboutData && (
          <div className="space-y-8">
            {/* Website Logo Settings */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-slate-100/50 space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 pb-6">
                <div>
                  <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Website Logo Settings</h2>
                  <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mt-1">Upload a custom logo to change the Navbar, Footer, and Favicon icon dynamically</p>
                </div>
                {aboutData.logo && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to reset the logo to default?")) {
                        setAboutData((prev: any) => ({
                          ...prev,
                          logo: ""
                        }));
                      }
                    }}
                    className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Logo
                  </button>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-8 bg-zinc-50 rounded-2xl p-6 border-2 border-dashed border-zinc-200">
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 pl-1">Logo Preview</span>
                  <div className="relative w-24 h-24 flex items-center justify-center bg-[#0d1b1b] rounded-full shadow-lg border border-cyan-500/20 overflow-hidden">
                    {aboutData.logo ? (
                      <img 
                        src={aboutData.logo} 
                        alt="Uploaded Logo" 
                        className="w-full h-full object-cover p-2 bg-[#0d1b1b]" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-2 text-cyan-400 font-black text-[10px] uppercase leading-tight select-none">
                        Default Logo
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1 block">Upload New Logo (JPEG, PNG, SVG)</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="hidden"
                        id="logo-upload-input"
                      />
                      <label 
                        htmlFor="logo-upload-input"
                        className="inline-flex items-center gap-2 px-5 py-4 bg-white hover:bg-zinc-100/50 border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all text-zinc-700"
                      >
                        <Camera className="w-4 h-4 text-zinc-500" /> Select Logo Image
                      </label>
                    </div>
                  </div>
                  <p className="text-[10.5px] text-zinc-400 leading-normal font-semibold">
                    We recommend uploading a high quality square image (at least 256x256px). 
                    Your logo will automatically be optimized, scaled, and updated live across the entire 
                    Infinitium website, including the floating Navigation menu, bottom Footer, page headers, 
                    and browser address bar (favicon) in real-time!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-slate-100/50 space-y-6">
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">Hero Banner info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Hero Title</label>
                  <input
                    value={aboutData.hero?.title || ''}
                    onChange={(e) => setAboutData({
                      ...aboutData,
                      hero: { ...aboutData.hero, title: e.target.value }
                    })}
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Hero Image URL</label>
                  <input
                    value={aboutData.hero?.image || ''}
                    onChange={(e) => setAboutData({
                      ...aboutData,
                      hero: { ...aboutData.hero, image: e.target.value }
                    })}
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Hero Paragraph</label>
                <textarea
                  value={aboutData.hero?.paragraph || ''}
                  onChange={(e) => setAboutData({
                    ...aboutData,
                    hero: { ...aboutData.hero, paragraph: e.target.value }
                  })}
                  className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-medium h-24"
                />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-slate-100/50 space-y-6">
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">Society Objectives</h2>
              {aboutData.objectives?.map((obj: any, idx: number) => (
                <div key={obj.id || idx} className="p-6 bg-zinc-50 rounded-2xl border-2 border-zinc-100 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Objective Title</label>
                    <input
                      value={obj.title || ''}
                      onChange={(e) => {
                        const flexibleObjs = [...aboutData.objectives];
                        flexibleObjs[idx] = { ...flexibleObjs[idx], title: e.target.value };
                        setAboutData({ ...aboutData, objectives: flexibleObjs });
                      }}
                      className="w-full px-5 py-4 bg-white rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Objective Text</label>
                    <textarea
                      value={obj.text || ''}
                      onChange={(e) => {
                        const flexibleObjs = [...aboutData.objectives];
                        flexibleObjs[idx] = { ...flexibleObjs[idx], text: e.target.value };
                        setAboutData({ ...aboutData, objectives: flexibleObjs });
                      }}
                      className="w-full px-5 py-4 bg-white rounded-2xl border-2 border-zinc-100 text-sm font-medium h-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-slate-100/50 space-y-8 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">QR Ticket Scanner</h2>
              <p className="text-sm text-zinc-500 font-medium">Verify event tickets and log student attendees instantly.</p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Select Active Event</label>
              <select
                value={selectedScanEventId}
                onChange={(e) => {
                  stopScanner();
                  setIsScanning(false);
                  setSelectedScanEventId(e.target.value);
                  setScanResult(null);
                }}
                className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold outline-none"
              >
                <option value="">-- Choose Event to Check attendance --</option>
                {events.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            {selectedScanEventId && (
              <div className="text-center space-y-6">
                <button
                  type="button"
                  onClick={() => {
                    if (isScanning) {
                      stopScanner();
                      setIsScanning(false);
                    } else {
                      setIsScanning(true);
                      setScanResult(null);
                    }
                  }}
                  className={`px-8 py-4 ${isScanning ? 'bg-zinc-600 hover:bg-zinc-700' : 'bg-brand-600 hover:bg-brand-700'} text-white rounded-3xl font-bold uppercase tracking-widest text-xs transition-all shadow-xl`}
                >
                  {isScanning ? 'Stop Camera' : 'Start Ticket Scanner'}
                </button>

                {isScanning && (
                  <div className="border border-zinc-100 rounded-3xl overflow-hidden shadow-2xl relative bg-zinc-50">
                    <div id="reader" className="w-full max-w-md mx-auto aspect-square"></div>
                  </div>
                )}
              </div>
            )}

            {scanResult && (
              <div className={`p-6 rounded-3xl border-2 ${scanResult.loading ? 'bg-zinc-50 border-zinc-100 text-zinc-600' : scanResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-red-50 border-red-100 text-red-900'} transition-all text-center space-y-3`}>
                {scanResult.loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin"></div>
                    <span className="font-bold uppercase tracking-widest text-xs">Processing check-in...</span>
                  </div>
                ) : scanResult.success ? (
                  <>
                    <h3 className="text-lg font-black uppercase text-emerald-800">Success! Checked-In</h3>
                    <p className="text-sm font-bold">{scanResult.student?.studentName || 'Attendee'} ({scanResult.student?.rollNo || 'N/A'})</p>
                    <p className="text-xs font-semibold uppercase">{scanResult.alreadyMarked ? '⚠️ Attendance already logged earlier' : '✓ Attendance marked successfully'}</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-black uppercase text-red-800">Check-in Failed</h3>
                    <p className="text-sm font-bold">{scanResult.error}</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-slate-100/50 space-y-8 max-w-2xl mx-auto">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">Google Sheets Configuration</h2>
              <p className="text-sm text-zinc-500 font-medium">Configure where the inquiries, registrations and feedback data are stored in Google Sheets.</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveContactConfig(
                formData.get('sheetId') as string,
                formData.get('adminEmail') as string
              );
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Master Spreadsheet Google Sheet ID</label>
                <input
                  name="sheetId"
                  defaultValue={contactConfig.sheetId}
                  required
                  className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                  placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Admin Notification Email</label>
                <input
                  name="adminEmail"
                  type="email"
                  defaultValue={contactConfig.adminEmail}
                  required
                  className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                  placeholder="e.g. teaminfinitium.arsd@gmail.com"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingContactConfig}
                className="w-full py-5 bg-brand-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all disabled:opacity-50"
              >
                {isSavingContactConfig ? 'Saving settings...' : 'Save Settings'}
              </button>
            </form>
          </div>
        )}

        {/* Event Modal */}
        <AnimatePresence>
          {showAddEvent && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowAddEvent(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-3xl font-bold mb-8">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
                <form className="space-y-6" onSubmit={handleEventSubmit}>
                  <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-full aspect-[16/10] max-w-[400px] rounded-2xl bg-zinc-50 border-4 border-zinc-100 overflow-hidden relative group mx-auto">
                      {eventImagePreview ? (
                        <img src={eventImagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                          <Camera className="w-10 h-10" />
                          <span className="text-[10px] font-black uppercase tracking-widest">No Poster Selected</span>
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" htmlFor="event-upload">
                        <Plus className="text-white w-10 h-10" />
                        <input id="event-upload" type="file" className="hidden" accept="image/*" onChange={handleEventFileChange} />
                      </label>
                    </div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-center">
                      Click card to upload a poster image from your device
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Event Title</label>
                      <input
                        name="title"
                        defaultValue={editingEvent?.title || ''}
                        required
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="e.g. Pulsar 2026"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Subtitle</label>
                      <input
                        name="subtitle"
                        defaultValue={editingEvent?.subtitle || ''}
                        required
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="e.g. The Science extravaganza"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Event Type</label>
                      <select
                        name="type"
                        defaultValue={editingEvent?.type || 'Seminar'}
                        required
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold outline-none"
                      >
                        <option value="Seminar">Seminar</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Competition">Competition</option>
                        <option value="Festival">Festival</option>
                        <option value="Lecture">Lecture</option>
                        <option value="Hackathon">Hackathon</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Event Date</label>
                      <input
                        name="date"
                        type="date"
                        defaultValue={editingEvent?.date || ''}
                        required
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Start Time (Optional)</label>
                      <input
                        name="startTime"
                        defaultValue={editingEvent?.startTime || ''}
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="e.g. 10:00 AM"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Location</label>
                      <input
                        name="location"
                        defaultValue={editingEvent?.location || ''}
                        required
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="e.g. Seminar Hall, ARSD College"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">WhatsApp Group Link (Optional)</label>
                      <input
                        name="whatsappGroup"
                        defaultValue={editingEvent?.whatsappGroup || ''}
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="e.g. https://chat.whatsapp.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Sync Spreadsheet ID (Optional)</label>
                      <input
                        name="sheetId"
                        defaultValue={editingEvent?.sheetId || ''}
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="Google Sheet Spreadsheet ID"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-zinc-50 rounded-2xl border-2 border-zinc-100">
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest pl-1">Inter-College Event</label>
                      <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-tight pl-1">Allow students from other colleges to register</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isInterCollege"
                        value="true"
                        defaultChecked={editingEvent?.isInterCollege}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Description</label>
                    <textarea
                      name="description"
                      defaultValue={editingEvent?.description}
                      required
                      className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 h-32 text-sm font-medium"
                      placeholder="Describe the event details..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isEventSubmitting || isEventImageProcessing}
                    className="w-full py-5 bg-brand-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isEventSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      editingEvent ? 'Update Event' : 'Create Event'
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Achievement Modal */}
        <AnimatePresence>
          {showAchievementModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowAchievementModal(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-3xl font-bold mb-8">{editingAchievement ? 'Edit Achievement' : 'Add Achievement'}</h2>
                <form className="space-y-6" onSubmit={handleAchievementSubmit}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Title</label>
                    <input
                      name="title"
                      defaultValue={editingAchievement?.title || ''}
                      required
                      className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                      placeholder="e.g. Best Society Award 2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Date</label>
                    <input
                      name="date"
                      type="date"
                      defaultValue={editingAchievement?.date || ''}
                      required
                      className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Description</label>
                    <textarea
                      name="description"
                      defaultValue={editingAchievement?.description || ''}
                      required
                      className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 h-32 text-sm font-medium"
                      placeholder="Describe the achievement in detail..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-5 bg-brand-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                  >
                    {editingAchievement ? 'Update Achievement' : 'Add Achievement'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGalleryModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={closeGalleryModal} />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="relative bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl max-h-[90vh] overflow-y-auto"
             >
                <h2 className="text-3xl font-bold mb-8">{editingGallery ? 'Edit Gallery Item' : 'Add Gallery Image'}</h2>
                <form className="space-y-6" onSubmit={handleGallerySubmit}>
                   <div className="flex flex-col items-center gap-4 mb-8">
                      <div className="w-full aspect-square max-w-[300px] rounded-2xl bg-zinc-50 border-4 border-zinc-100 overflow-hidden relative group mx-auto">
                        {galleryImagePreview ? (
                          <img src={galleryImagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                            <Camera className="w-10 h-10" />
                            <span className="text-[10px] font-black uppercase tracking-widest">No Image Selected</span>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" htmlFor="gallery-upload">
                          <Plus className="text-white w-10 h-10" />
                          <input id="gallery-upload" type="file" className="hidden" accept="image/*" onChange={handleGalleryFileChange} />
                        </label>
                      </div>
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-center">
                        {isImageProcessing ? "Processing Image..." : "Click to upload photo from your device"}
                      </p>
                   </div>

                   <input 
                    name="title" 
                    defaultValue={editingGallery?.title}
                    required 
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 placeholder:text-zinc-300 font-bold" 
                    placeholder="Image Title" 
                   />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Category</label>
                        <select 
                          name="category" 
                          defaultValue={editingGallery?.category || 'Events'}
                          required
                          className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 font-bold text-sm outline-none focus:border-brand-600 appearance-none" 
                        >
                          <option value="Events">Events</option>
                          <option value="Academic">Academic</option>
                          <option value="Team">Team</option>
                          <option value="Moments">Moments</option>
                          <option value="Trips">Trips</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Capture Date (Optional)</label>
                        <input 
                         name="eventDate" 
                         type="date"
                         defaultValue={editingGallery?.eventDate}
                         className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 font-bold text-sm" 
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Or Image URL</label>
                     <input 
                       name="src" 
                       value={galleryImagePreview || ''}
                       onChange={(e) => setGalleryImagePreview(e.target.value)}
                       required
                       className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 placeholder:text-zinc-300 transition-all font-mono text-xs" 
                       placeholder="https://..." 
                     />
                   </div>
                   <textarea 
                    name="description" 
                    defaultValue={editingGallery?.description}
                    required 
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 h-32 placeholder:text-zinc-300" 
                    placeholder="Description of the moment"
                   ></textarea>
                   <button 
                    type="submit" 
                    disabled={isSubmittingGallery || isImageProcessing}
                    className="w-full py-5 bg-brand-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                    {isSubmittingGallery ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      editingGallery ? 'Update Item' : 'Add to Gallery'
                    )}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="relative bg-white w-full max-w-sm rounded-2xl p-10 shadow-2xl text-center"
             >
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">Confirm Deletion</h3>
                <p className="text-sm text-zinc-500 mb-8 font-medium">Are you sure you want to delete this {deleteConfirm.type === 'member' ? 'team member' : deleteConfirm.type}? This action cannot be undone.</p>
                
                <div className="flex gap-4">
                   <button 
                     onClick={() => setDeleteConfirm(null)}
                     className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all font-bold"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={async () => {
                        if (deleteConfirm && deleteConfirm.id && deleteConfirm.type) {
                           const col = deleteConfirm.type === 'member' ? 'members' : 
                                       deleteConfirm.type === 'event' ? 'events' :
                                       deleteConfirm.type === 'gallery' ? 'gallery' : 'achievements';
                           try {
                              await deleteDoc(doc(db, col, deleteConfirm.id));
                              loadFirebaseData();
                              setDeleteConfirm(null);
                            } catch (err) {
                              console.error(err);
                            }
                        }
                     }}
                     className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                   >
                     Clear Data
                   </button>
                </div>
             </motion.div>
          </div>
        )}

        {showMemberModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={closeMemberModal} />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="relative bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
             >
                <h2 className="text-3xl font-bold mb-8">
                  {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
                </h2>
                <form onSubmit={handleMemberSubmit} className="space-y-6">
                   <div className="flex flex-col items-center gap-4 mb-8">
                      <div className="w-32 h-32 rounded-2xl bg-zinc-50 border-4 border-zinc-100 overflow-hidden relative group">
                        {memberImagePreview ? (
                          <img src={memberImagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300">
                            <Camera className="w-10 h-10" />
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Plus className="text-white w-8 h-8" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleMemberFileChange} />
                        </label>
                      </div>
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Click to upload photo</p>
                   </div>

                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Full Name</label>
                     <input 
                       name="name" 
                       defaultValue={editingMember?.name}
                       required
                       className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all" 
                       placeholder="e.g. Sneha Sharma" 
                     />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Role</label>
                       <input 
                         name="role" 
                         defaultValue={editingMember?.role}
                         required
                         className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all" 
                         placeholder="e.g. President" 
                       />
                     </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Tenure</label>
                        <div className="flex items-center gap-2">
                          <select 
                            name="startYear" 
                            defaultValue={editingMember?.tenure?.split('-')[0] || new Date().getFullYear()}
                            className="w-full px-4 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all font-bold text-sm"
                          >
                            {Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() + 1) - i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                          <span className="font-black text-zinc-300">-</span>
                          <select 
                            name="endYear" 
                            defaultValue={editingMember?.tenure ? '20' + editingMember.tenure.split('-')[1] : new Date().getFullYear() + 1}
                            className="w-full px-4 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all font-bold text-sm"
                          >
                            {Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() + 2) - i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Course Name</label>
                       <select 
                         name="course" 
                         defaultValue={editingMember?.course || 'B.Sc. Physical Science with Computer Science'}
                         required
                         className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all cursor-pointer"
                       >
                         <option value="B.Sc. Physical Science with Computer Science">B.Sc. Physical Science with Computer Science</option>
                         <option value="B.Sc. Physical Science with Chemistry">B.Sc. Physical Science with Chemistry</option>
                         <option value="B.Sc. Physical Science with Electronics">B.Sc. Physical Science with Electronics</option>
                         <option value="B.Sc. Applied Physical Science with Industrial Chemistry">B.Sc. Applied Physical Science with Industrial Chemistry</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Academic Year / Status</label>
                       <select 
                         name="year" 
                         defaultValue={editingMember?.year || 'I Year'}
                         required
                         className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all cursor-pointer"
                       >
                         <option value="I Year">I Year</option>
                         <option value="II Year">II Year</option>
                         <option value="III Year">III Year</option>
                         <option value="IV Year">IV Year</option>
                       </select>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">LinkedIn URL</label>
                     <input 
                       name="linkedin" 
                       defaultValue={editingMember?.linkedin}
                       className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all" 
                       placeholder="https://linkedin.com/..." 
                     />
                   </div>
                   <button 
                     type="submit"
                     className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-600 transition-all shadow-xl"
                   >
                     {editingMember ? 'Update Profile' : 'Add to Team'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}
