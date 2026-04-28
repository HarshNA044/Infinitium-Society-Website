import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, Plus, Scan, Users, Calendar, 
  Trash2, CheckCircle, XCircle, ChevronLeft,
  LayoutDashboard, ListOrdered, Camera, Linkedin, Edit3,
  Trophy, Download, LogIn, Github
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useApi } from '../hooks/useApi';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, 
  query, orderBy, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User
} from 'firebase/auth';
import { cn } from '../lib/utils';

export default function Admin_Page() {
  const { request, loading: apiLoading } = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'member' | 'event' | 'gallery' | 'achievement' } | null>(null);
  
  // Scanner state
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedScanEventId, setSelectedScanEventId] = useState<string>('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // New states for expanded control
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<any>(null);

  const [gallery, setGallery] = useState<any[]>([]);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<any>(null);

  // About management state
  const [aboutData, setAboutData] = useState<any>(null);
  const [isSavingAbout, setIsSavingAbout] = useState(false);

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
      const membersSnap = await getDocs(query(collection(db, 'members'), orderBy('tenure', 'desc')));
      setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Load Achievements
      const achievementsSnap = await getDocs(query(collection(db, 'achievements'), orderBy('createdAt', 'desc')));
      setAchievements(achievementsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Load Gallery
      const gallerySnap = await getDocs(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')));
      setGallery(gallerySnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Load About
      const aboutDoc = await getDoc(doc(db, 'about', 'current'));
      if (aboutDoc.exists()) {
        setAboutData(aboutDoc.data());
      } else {
        // Initialize with default structure to prevent setDoc(null) errors
        setAboutData({
          hero: { 
            title: "INFINITIUM SOCIETY", 
            subtitle: "The Premier Society of Physical Sciences at ARSD College, University of Delhi. Empowering students with scientific temper and innovation.", 
            image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=2070&auto=format&fit=crop" 
          },
          objectives: [
            { id: 'obj1', title: 'Scientific Temper', text: 'Cultivating a curious and analytical mindset among students.' },
            { id: 'obj2', title: 'Innovation', text: 'Providing a platform for creative solutions and technical growth.' },
            { id: 'obj3', title: 'Leadership', text: 'Developing organizational and leadership skills through event management.' }
          ],
          impacts: [
            { id: 'imp1', title: '1500+', text: 'Students reached annually' },
            { id: 'imp2', title: '50+', text: 'Technical events organized' }
          ],
          departments: [
            { id: 'dep1', title: 'Core Team', aim: 'Overall management', tasks: ['Operations', 'Strategy'] }
          ]
        });
      }

      // Load Events
      const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('date', 'desc')));
      const eventsList = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setEvents(eventsList);

      // Compute stats from events
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
    } catch (error) {
      console.error("Error loading Firebase data", error);
    }
  };

  const handleMemberFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size exceeds 2MB. Please choose a smaller file.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMemberImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEventFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size exceeds 5MB. Please choose a smaller file.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size exceeds 5MB. Please choose a smaller file.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startYear = formData.get('startYear');
    const endYear = formData.get('endYear');
    const tenure = `${startYear}-${endYear?.toString().slice(-2)}`;

    const data = {
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      image: memberImagePreview || formData.get('image') as string,
      linkedin: formData.get('linkedin') as string || '',
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
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      type: formData.get('type') as string,
      date: formData.get('date') as string,
      location: formData.get('location') as string,
      image: eventImagePreview || formData.get('image') as string,
      description: formData.get('description') as string,
      sheetId: formData.get('sheetId') as string,
      status: editingEvent?.status || 'Upcoming',
      stats: editingEvent?.stats || { registrations: 0, attendance: 0 }
    };

    const path = 'events';
    try {
      if (editingEvent) {
        const docRef = doc(db, path, editingEvent.id);
        await updateDoc(docRef, data);
      } else {
        const docRef = doc(collection(db, path));
        await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
      }
      setShowAddEvent(false);
      setEditingEvent(null);
      setEventImagePreview(null);
      loadFirebaseData();
    } catch (error) {
      handleFirestoreError(error, editingEvent ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const closeEventModal = () => {
    setShowAddEvent(false);
    setEditingEvent(null);
    setEventImagePreview(null);
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
    const formData = new FormData(e.currentTarget);
    const data = {
      src: galleryImagePreview || formData.get('src') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string
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
    }
  };

  const closeGalleryModal = () => {
    setShowGalleryModal(false);
    setEditingGallery(null);
    setGalleryImagePreview(null);
  };

  useEffect(() => {
    if (activeTab === 'scanner' && isScanning && selectedScanEventId) {
      const targetEvent = events.find((e: any) => e.id === selectedScanEventId);
      if (!targetEvent) {
        setIsScanning(false);
        return;
      }

      scannerRef.current = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } }, 
        false
      );
      
      scannerRef.current.render(async (decodedText) => {
        try {
          const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL;
          if (!appsScriptUrl) throw new Error("Apps Script URL not configured");

          setScanResult({ loading: true });
          
          const response = await fetch(appsScriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
              action: 'markAttendance',
              sheetId: targetEvent.sheetId,
              ticketId: decodedText 
            })
          });
          
          const result = await response.json();
          
          if (result.status === 'success') {
            setScanResult({ 
              success: true, 
              student: result.student,
              alreadyMarked: result.alreadyMarked,
              ticketId: decodedText
            });
            loadFirebaseData();
          } else {
            throw new Error(result.message || "Verification failed");
          }
        } catch (err: any) {
          setScanResult({ success: false, error: err.message });
        }
        stopScanner();
        setIsScanning(false);
      }, (err) => {
        // ignore errors
      });
    }

    return () => stopScanner();
  }, [activeTab, isScanning, selectedScanEventId]);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
  };

  const COLORS = ['#14b8a6', '#0d9488', '#0f766e', '#115e59']; // brand-500, 600, 700, 800

  const chartData = events.map((e: any) => ({
    name: e.title?.split(':')[0] || 'Event',
    registrations: e.stats?.registrations || 0,
    attendance: e.stats?.attendance || 0,
  }));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.email !== 'teaminfinitium.arsd@gmail.com') {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-800 rounded-[3rem] p-12 border border-zinc-700 shadow-2xl text-center space-y-8">
          <div className="w-20 h-20 bg-brand-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-brand-600/40">
            <LayoutDashboard className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Admin Access</h1>
            <p className="text-zinc-400 font-medium leading-relaxed">
              This area is restricted to INFINITIUM core administrators. Please authenticate with your authorized Google account.
            </p>
          </div>
          <div className="py-8">
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-5 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-400 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-white/5"
            >
              <Github className="w-5 h-5" /> Sign in with Google
            </button>
          </div>
          {loginError && (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center animate-shake mt-4">
                {loginError}
              </p>
            )}
          {user && user.email !== 'teaminfinitium.arsd@gmail.com' && (
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest">
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
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-lg">Admin View</h2>
        </div>

        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 mb-4">
          <div className="flex items-center gap-3">
            <img src={user.photoURL || ''} className="w-8 h-8 rounded-full" alt="Admin" />
            <div className="overflow-hidden">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest truncate">{user.displayName}</p>
              <button 
                onClick={handleLogout}
                className="text-[9px] font-bold text-red-500 uppercase hover:underline"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { id: 'overview', icon: BarChart3, label: 'Overview' },
            { id: 'events', icon: ListOrdered, label: 'Events' },
            { id: 'members', icon: Users, label: 'Members' },
            { id: 'achievements', icon: Trophy, label: 'Achievements' },
            { id: 'gallery', icon: Camera, label: 'Gallery' },
            { id: 'about', icon: LayoutDashboard, label: 'About Page' },
            { id: 'scanner', icon: Scan, label: 'QR Scanner' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                activeTab === tab.id ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" : "text-zinc-500 hover:bg-brand-50 hover:text-brand-600"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2 capitalize">{activeTab} Panel</h1>
            <p className="text-zinc-500 font-medium">Manage INFINITIUM's backend operations.</p>
          </div>
          <div className="flex gap-4">
            {activeTab === 'events' && (
            <button 
              onClick={() => {
                setEditingEvent(null);
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
              <Plus className="w-5 h-5" /> Add Member
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bento-card bg-white p-8">
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">Total Registrations</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalRegistrations}</p>
                <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600 w-3/4"></div>
                </div>
              </div>
              <div className="bento-card bg-brand-600 p-8 text-white border-none shadow-brand-600/20">
                <p className="text-brand-100 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">Total Attendance</p>
                <p className="text-4xl font-black tracking-tighter">{stats.totalAttendance}</p>
                <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-1/2"></div>
                </div>
              </div>
              <div className="bento-card bg-amber-400 p-8 border-amber-500">
                <p className="text-amber-900/60 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">Completion Rate</p>
                <p className="text-4xl font-black text-amber-950 tracking-tighter">
                  {stats.totalRegistrations > 0 ? Math.round((stats.totalAttendance / stats.totalRegistrations) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
               <div className="bento-card lg:col-span-2 h-[400px]">
                 <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Event Performance</h3>
                   <div className="flex gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-600 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Regs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Attnd</span>
                      </div>
                   </div>
                 </div>
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                     <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                     />
                     <Bar dataKey="registrations" fill="#14b8a6" radius={[6, 6, 0, 0]} barSize={20} />
                     <Bar dataKey="attendance" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
               
               <div className="bento-card bg-brand-950 border border-brand-900 text-white">
                 <h3 className="text-xs font-black uppercase text-brand-400 tracking-[0.3em] mb-8">Recent Activity</h3>
                 <div className="space-y-6">
                    {[
                      { user: "Aryan S.", action: "Registered", time: "2m ago", event: "Pulsar 2026" },
                      { user: "Ishita M.", action: "Attended", time: "15m ago", event: "AI Seminar" },
                      { user: "Kabir R.", action: "Registered", time: "1h ago", event: "UI Workshop" },
                      { user: "Mehak P.", action: "Feedback", time: "2h ago", event: "Pulsar 2026" },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 items-start border-l-2 border-brand-800 pl-4 py-1">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-brand-100"><span className="text-brand-400">{item.user}</span> {item.action}</p>
                          <p className="text-[9px] text-brand-100/40 uppercase font-black tracking-widest mt-1">{item.event} • {item.time}</p>
                        </div>
                      </div>
                    ))}
                 </div>
                 <button className="mt-auto w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all">
                    View Full Audit Log
                 </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[800px]">
               <thead className="bg-zinc-50">
                 <tr>
                   <th className="px-8 py-5 text-sm font-bold text-zinc-500 tracking-wider">EVENT NAME</th>
                   <th className="px-8 py-5 text-sm font-bold text-zinc-500 tracking-wider">TYPE</th>
                   <th className="px-8 py-5 text-sm font-bold text-zinc-500 tracking-wider">REGS</th>
                   <th className="px-8 py-5 text-sm font-bold text-zinc-500 tracking-wider">ATTND</th>
                   <th className="px-8 py-5 text-sm font-bold text-zinc-500 tracking-wider text-right">ACTION</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100">
                 {events.map((event: any) => (
                   <tr key={event.id} className="hover:bg-zinc-50 transition-colors">
                     <td className="px-8 py-6">
                        <p className="font-bold text-zinc-900">{event.title}</p>
                        <p className="text-sm text-zinc-400">{event.date}</p>
                        {event.sheetId && (
                          <a 
                            href={`https://docs.google.com/spreadsheets/d/${event.sheetId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-brand-600 font-bold uppercase hover:underline mt-1 block"
                          >
                            View Google Sheet
                          </a>
                        )}
                     </td>
                     <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold">{event.type}</span>
                     </td>
                     <td className="px-8 py-6 font-bold">{event.stats?.registrations || 0}</td>
                     <td className="px-8 py-6 font-bold text-brand-700">{event.stats?.attendance || 0}</td>
                     <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingEvent(event);
                              setEventImagePreview(event.image);
                              setShowAddEvent(true);
                            }}
                            className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-bold hover:bg-brand-100 transition-all flex items-center gap-1 border border-brand-100"
                            title="Edit Event"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button 
                            onClick={() => setDeleteConfirm({ id: event.id, type: 'event' })}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-1 border border-red-100"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-6">
            {achievements.map((a: any) => (
              <div key={a.id} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex justify-between items-center group">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 uppercase italic tracking-tighter mb-1">{a.title}</h3>
                  <p className="text-xs text-brand-600 font-bold uppercase tracking-widest mb-4">{a.date}</p>
                  <p className="text-sm text-zinc-500 font-medium max-w-xl">{a.description}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button 
                    onClick={() => {
                      setEditingAchievement(a);
                      setShowAchievementModal(true);
                    }}
                    className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all border border-brand-100"
                    title="Edit Achievement"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirm({ id: a.id, type: 'achievement' })}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100"
                    title="Delete Achievement"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((item: any) => (
              <div key={item.id} className="relative group rounded-[2.5rem] overflow-hidden border border-zinc-100 shadow-sm bg-white">
                <div className="aspect-square overflow-hidden relative">
                  <img src={item.src} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-grayscale duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-white text-[10px] font-black uppercase tracking-widest leading-relaxed line-clamp-4">{item.description}</p>
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  <div>
                    <h4 className="text-zinc-900 font-bold text-sm line-clamp-1">{item.title}</h4>
                    <p className="text-brand-600 text-[10px] font-black uppercase tracking-widest">{item.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingGallery(item);
                        setGalleryImagePreview(item.src);
                        setShowGalleryModal(true);
                      }}
                      className="flex-1 py-2 bg-zinc-50 text-zinc-600 rounded-xl text-xs font-bold hover:bg-brand-50 hover:text-brand-600 transition-all border border-zinc-100 flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ id: item.id, type: 'gallery' })}
                      className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {members.map((member: any) => (
               <div key={member.id} className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm group">
                  <div className="flex items-center gap-4 mb-6">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-16 h-16 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-zinc-900">{member.name}</h4>
                      <p className="text-xs text-brand-600 font-bold uppercase tracking-widest">{member.role}</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Tenure: {member.tenure}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingMember(member);
                        setMemberImagePreview(member.image);
                        setShowMemberModal(true);
                      }}
                      className="flex-1 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ id: member.id, type: 'member' })}
                      className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {member.linkedin && (
                      <a 
                        href={member.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                  </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'about' && aboutData && (
          <div className="space-y-12">
            <div className="bento-card p-10 bg-white">
              <h3 className="text-xl font-bold mb-6 italic uppercase tracking-tight">Hero Section</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Title</label>
                    <input 
                      value={aboutData.hero.title}
                      onChange={(e) => setAboutData({ ...aboutData, hero: { ...aboutData.hero, title: e.target.value } })}
                      className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Hero Image URL</label>
                    <input 
                      value={aboutData.hero.image}
                      onChange={(e) => setAboutData({ ...aboutData, hero: { ...aboutData.hero, image: e.target.value } })}
                      className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 font-mono text-xs" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Subtitle</label>
                  <textarea 
                    value={aboutData.hero.subtitle}
                    onChange={(e) => setAboutData({ ...aboutData, hero: { ...aboutData.hero, subtitle: e.target.value } })}
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 h-32" 
                  />
                </div>
              </div>
            </div>

            <div className="bento-card p-10 bg-white">
              <h3 className="text-xl font-bold mb-6 italic uppercase tracking-tight">Objectives</h3>
              <div className="space-y-8">
                {aboutData.objectives.map((obj: any, idx: number) => (
                  <div key={obj.id} className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-4">
                    <input 
                      value={obj.title}
                      onChange={(e) => {
                        const newObjectives = [...aboutData.objectives];
                        newObjectives[idx].title = e.target.value;
                        setAboutData({ ...aboutData, objectives: newObjectives });
                      }}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-zinc-100 font-bold uppercase text-xs tracking-widest"
                      placeholder="Objective Title"
                    />
                    <textarea 
                      value={obj.text}
                      onChange={(e) => {
                        const newObjectives = [...aboutData.objectives];
                        newObjectives[idx].text = e.target.value;
                        setAboutData({ ...aboutData, objectives: newObjectives });
                      }}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-zinc-100 h-20 text-sm"
                      placeholder="Objective Text"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bento-card p-10 bg-white">
              <h3 className="text-xl font-bold mb-6 italic uppercase tracking-tight text-brand-600">Pro-Tip</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Editing the Departments and Impacts listed here will instantly reflect across the public About page. 
                Ensure all URLs are accessible and images are high quality.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="max-w-xl mx-auto">
             {!isScanning ? (
               <div className="bento-card bg-brand-950 p-12 rounded-[3.5rem] border border-brand-900 text-center flex flex-col items-center shadow-2xl relative overflow-hidden">
                  <div className="absolute top-6 left-6">
                    <span className="text-[9px] font-black uppercase text-brand-400 tracking-[0.3em]">Scanner Active</span>
                  </div>
                  <div className="w-24 h-24 bg-white/5 text-brand-400 rounded-[2rem] flex items-center justify-center mb-8 border border-white/10">
                    <Scan className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-white italic tracking-tighter uppercase">Attendance Core</h3>
                  <p className="text-brand-100/60 mb-8 leading-relaxed text-sm font-bold uppercase tracking-widest">
                     Select an upcoming event to start marking attendance.
                   </p>

                   {scannableEvents.length > 0 ? (
                    <div className="w-full space-y-6">
                      <select 
                        value={selectedScanEventId}
                        onChange={(e) => setSelectedScanEventId(e.target.value)}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-4 text-white font-bold text-sm outline-none focus:border-brand-600 transition-all"
                      >
                        <option value="" className="bg-zinc-900">Select Upcoming Event</option>
                        {scannableEvents.map((e: any) => (
                          <option key={e.id} value={e.id} className="bg-zinc-900">
                            {e.title}
                          </option>
                        ))}
                      </select>

                      <button 
                        disabled={!selectedScanEventId}
                        onClick={() => setIsScanning(true)}
                        className="w-full py-5 bg-brand-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-600/20 disabled:opacity-50"
                      >
                        <Camera className="w-5 h-5" /> Open Scanner
                      </button>
                    </div>
                   ) : (
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-xs font-bold uppercase tracking-widest leading-loose">
                      No upcoming events available for scanning.<br/>
                      Marking attendance is restricted to events with "Upcoming" status.
                    </div>
                   )}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-600/10 blur-3xl"></div>
               </div>
             ) : (
               <div className="space-y-8">
                 <div className="bg-slate-900 rounded-[3.5rem] overflow-hidden border-4 border-indigo-600 shadow-2xl relative shadow-indigo-600/20">
                    <div id="reader" className="w-full"></div>
                    <button 
                      onClick={() => setIsScanning(false)}
                      className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all text-white border border-white/20"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                 </div>
                 <p className="text-center text-slate-500 font-black uppercase text-[10px] tracking-widest">Protocol: Direct Visual Verification</p>
               </div>
             )}

             {/* Scan Result Overlay */}
             <AnimatePresence>
               {scanResult && (
                 <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div 
                      className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setScanResult(null)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl"
                    >
                      {scanResult.success ? (
                        <>
                          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10" />
                          </div>
                          <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                            {scanResult.alreadyMarked ? "Already Marked" : "Success!"}
                          </h3>
                          <p className="text-lg font-bold text-brand-600 mb-4 uppercase italic tracking-tight">{scanResult.student?.studentName}</p>
                          <p className="text-zinc-500 text-sm mb-10">Attendance marked for {scanResult.student?.rollNo}</p>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10" />
                          </div>
                          <h3 className="text-2xl font-bold text-zinc-900 mb-2">Scan Failed</h3>
                          <p className="text-zinc-500 text-sm mb-10">{scanResult.error || 'Invalid or expired ticket.'}</p>
                        </>
                      )}
                      <button 
                        onClick={() => {
                          setScanResult(null);
                          setIsScanning(true); // Restart scanner
                        }}
                        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all"
                      >
                        Scan Next
                      </button>
                    </motion.div>
                 </div>
               )}
             </AnimatePresence>
          </div>
        )}
      </main>

      {/* Event Modal */}
      <AnimatePresence>
        {showAddEvent && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={closeEventModal} />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="relative bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl max-h-[90vh] overflow-y-auto"
             >
                <h2 className="text-3xl font-bold mb-8">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
                <form className="space-y-6" onSubmit={handleEventSubmit}>
                   <div className="flex flex-col items-center gap-4 mb-8">
                      <div className="w-full aspect-video rounded-[2.5rem] bg-zinc-50 border-4 border-zinc-100 overflow-hidden relative group">
                        {eventImagePreview ? (
                          <img src={eventImagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                            <Camera className="w-10 h-10" />
                            <span className="text-[10px] font-black uppercase tracking-widest">No Poster Selected</span>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Plus className="text-white w-10 h-10" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleEventFileChange} />
                        </label>
                      </div>
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Click to upload poster image</p>
                   </div>

                   <input 
                    name="title" 
                    defaultValue={editingEvent?.title}
                    required 
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 placeholder:text-zinc-300 font-bold" 
                    placeholder="Event Title" 
                   />
                   <input 
                    name="subtitle" 
                    defaultValue={editingEvent?.subtitle}
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 placeholder:text-zinc-300" 
                    placeholder="Event Subtitle (e.g. A Journey through Quantum Mechanics)" 
                   />
                   <div className="grid grid-cols-2 gap-4">
                      <select 
                        name="type" 
                        defaultValue={editingEvent?.type || 'Seminar'}
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100"
                      >
                        <option>Seminar</option>
                        <option>Fest</option>
                        <option>Workshop</option>
                        <option>Field Trip</option>
                      </select>
                      <input 
                        name="date" 
                        type="date" 
                        defaultValue={editingEvent?.date}
                        required 
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100" 
                      />
                   </div>
                   <input 
                    name="location" 
                    defaultValue={editingEvent?.location}
                    required 
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 placeholder:text-zinc-300" 
                    placeholder="Event Location (e.g. Auditorium)" 
                   />
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Google Sheet ID</label>
                     <input 
                       name="sheetId" 
                       defaultValue={editingEvent?.sheetId}
                       required
                       className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 placeholder:text-zinc-300 font-mono text-xs" 
                       placeholder="Enter Google Sheet ID (from URL)" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Or Poster Image URL</label>
                     <input 
                       name="image" 
                       value={eventImagePreview || ''}
                       onChange={(e) => setEventImagePreview(e.target.value)}
                       required
                       className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 placeholder:text-zinc-300 transition-all" 
                       placeholder="https://..." 
                     />
                   </div>
                   <textarea 
                    name="description" 
                    defaultValue={editingEvent?.description}
                    required 
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 h-32 placeholder:text-zinc-300" 
                    placeholder="Description"
                   ></textarea>
                   <button type="submit" className="w-full py-5 bg-brand-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all">
                    {editingEvent ? 'Update Event' : 'Launch Event'}
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
             <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => { setShowAchievementModal(false); setEditingAchievement(null); }} />
             <div className="relative bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl">
                <h2 className="text-3xl font-bold mb-8">{editingAchievement ? 'Edit Achievement' : 'Add Achievement'}</h2>
                <form className="space-y-6" onSubmit={handleAchievementSubmit}>
                   <input 
                    name="title" 
                    defaultValue={editingAchievement?.title}
                    required 
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 placeholder:text-zinc-300" 
                    placeholder="Achievement Title" 
                   />
                   <input 
                    name="date" 
                    type="date" 
                    defaultValue={editingAchievement?.date}
                    required 
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100" 
                   />
                   <textarea 
                    name="description" 
                    defaultValue={editingAchievement?.description}
                    required 
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 h-32 placeholder:text-zinc-300" 
                    placeholder="Description"
                   ></textarea>
                   <button type="submit" className="w-full py-5 bg-brand-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all">
                    {editingAchievement ? 'Update Achievement' : 'Save Achievement'}
                   </button>
                </form>
             </div>
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
                      <div className="w-full aspect-square max-w-[300px] rounded-[2.5rem] bg-zinc-50 border-4 border-zinc-100 overflow-hidden relative group mx-auto">
                        {galleryImagePreview ? (
                          <img src={galleryImagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                            <Camera className="w-10 h-10" />
                            <span className="text-[10px] font-black uppercase tracking-widest">No Image Selected</span>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Plus className="text-white w-10 h-10" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleGalleryFileChange} />
                        </label>
                      </div>
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-center">Click to upload photo from your device</p>
                   </div>

                   <input 
                    name="title" 
                    defaultValue={editingGallery?.title}
                    required 
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 placeholder:text-zinc-300 font-bold" 
                    placeholder="Image Title" 
                   />
                   <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      <input 
                        name="category" 
                        defaultValue={editingGallery?.category || 'Events'}
                        required
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100" 
                        placeholder="Category (e.g. Events, Academic)"
                      />
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
                   <button type="submit" className="w-full py-5 bg-brand-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all">
                    {editingGallery ? 'Update Item' : 'Add to Gallery'}
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
               className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center"
             >
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">Confirm Deletion</h3>
                <p className="text-sm text-zinc-500 mb-8 font-medium">Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</p>
                
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
                  {editingMember ? 'Edit Member' : 'Add New Member'}
                </h2>
                <form onSubmit={handleMemberSubmit} className="space-y-6">
                   <div className="flex flex-col items-center gap-4 mb-8">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-50 border-4 border-zinc-100 overflow-hidden relative group">
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
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Or Profile Image URL</label>
                     <input 
                       name="image" 
                       value={memberImagePreview || ''}
                       onChange={(e) => setMemberImagePreview(e.target.value)}
                       required
                       className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all" 
                       placeholder="https://..." 
                     />
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
                     className="w-full py-5 bg-zinc-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-brand-600 transition-all shadow-xl"
                   >
                     {editingMember ? 'Update Profile' : 'Add to Team'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
