import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, Calendar, Users, Trophy, ChevronRight, Zap, Star, 
  Plus, QrCode as QrIcon, Lightbulb, Book, MessageSquare, Globe2,
  Cpu, TestTube2, Monitor
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center gap-4 mb-4">
    <div className="h-px bg-brand-800 w-12 hidden md:block"></div>
    <span className="text-[10px] font-black uppercase text-brand-300 tracking-[0.5em]">{title}</span>
    <div className="h-px bg-brand-800 w-12 hidden md:block"></div>
  </div>
);

export default function Home_Page() {
  const [events, setEvents] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const eventsQuery = query(collection(db, 'events'), orderBy('date', 'desc'));
        const eventsSnap = await getDocs(eventsQuery);
        const eventsList = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventsList);

        const achQuery = query(collection(db, 'achievements'), orderBy('createdAt', 'desc'), limit(1));
        const achSnap = await getDocs(achQuery);
        setAchievements(achSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const galleryQuery = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(4));
        const gallerySnap = await getDocs(galleryQuery);
        setGalleryImages(gallerySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error loading home data", error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const latestAchievement = achievements[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:auto-rows-[minmax(80px,_auto)]">
        
        {/* Main Hero / Featured Event (Span 12x4) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-12 md:row-span-4 bg-white/90 backdrop-blur-xl rounded-2xl p-8 md:p-12 relative overflow-hidden text-slate-950 flex flex-col justify-end shadow-xl shadow-brand-500/5 group border border-white/50 transform-gpu"
        >
          {/* Decorative Background Elements - Optimized for performance */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Subtle Static Blobs instead of animated ones */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/5 blur-[80px] rounded-full" />
            <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-rose-200/5 blur-[80px] rounded-full" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(94,234,212,0.03)_0%,transparent_70%)]" />
            
            {/* Very slow, subtle icon floats - Optimized for performance */}
            <motion.div 
              animate={{ 
                y: [0, -5, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 right-10 sm:right-20 lg:right-40 text-amber-900/10 transform-gpu"
            >
              <Cpu className="w-24 h-24 md:w-32 md:h-32" />
            </motion.div>

            <motion.div 
              animate={{ 
                y: [0, 5, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-40 left-10 md:bottom-20 md:left-40 text-rose-900/10 transform-gpu"
            >
              <TestTube2 className="w-16 h-16 md:w-24 md:h-24" />
            </motion.div>

            <motion.div 
              animate={{ 
                rotate: [0, 360]
              }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 -right-10 md:-right-20 lg:-right-10 text-blue-900/10 transform-gpu"
            >
              <Monitor className="w-32 h-32 md:w-48 md:h-48" />
            </motion.div>

            <motion.div 
              animate={{ 
                x: [0, 10, 0],
                y: [0, -10, 0],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-1/2 right-1/2 md:bottom-1/4 md:right-1/4 text-violet-900/10 transform-gpu"
            >
              <Globe2 className="w-24 h-24 md:w-36 md:h-36" />
            </motion.div>
          </div>

          <div className="relative z-10">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
              <Zap className="w-64 h-64 text-brand-600" />
            </div>
            
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter uppercase italic">
              INFINITIUM <br /> <span className="text-brand-600">INSPIRING</span> <br /> INNOVATION
            </h2>

            <div className="flex flex-wrap gap-6 md:gap-8 items-center mt-4 pt-8 border-t border-slate-900/5">
              <div className="flex flex-col max-w-lg">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Legacy of ARSD College</span>
                <p className="text-xs md:text-sm font-medium text-slate-500 leading-relaxed uppercase tracking-tight">
                  INFINITIUM stands as the premier scientific hub of Atma Ram Sanatan Dharma College, 
                  unifying curiosity and academic rigor to shape the next generation of pioneers.
                </p>
              </div>
              <Link 
                to="/about"
                className="w-full md:w-auto md:ml-auto bg-brand-600 text-white px-10 py-5 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-brand-950 transition-all shadow-xl shadow-brand-600/20 active:scale-95 text-center"
              >
                Our Story
              </Link>
            </div>
          </div>
        </motion.div>


        {/* Quick Registration (Span 12x1) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-12 md:row-span-1 bg-amber-400 rounded-2xl border border-amber-500 p-6 flex items-center justify-between hover:scale-[1.01] transition-transform cursor-pointer"
          onClick={() => window.scrollTo({ top: document.getElementById('events-section')?.offsetTop || 0, behavior: 'smooth' })}
        >
          <div className="flex flex-col">
            <h4 className="font-black text-amber-950 uppercase text-lg tracking-tighter leading-none">Quick Register</h4>
            <p className="text-[9px] text-amber-900 font-bold uppercase leading-none opacity-70 mt-1">Join upcoming events instantly and be part of the innovation</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-amber-400 bg-amber-200 flex items-center justify-center text-[10px] font-black text-amber-800">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
             </div>
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-lg shadow-amber-950/10">
               <Plus className="w-6 h-6" />
             </div>
          </div>
        </motion.div>

        {/* Ongoing & Recent Section (Span 12) */}
        <div id="events-section" className="md:col-span-12 py-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Ongoing & Recent</h3>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">The latest from INFINITIUM society</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {events.slice(0, 6).map((event: any) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group bg-white border border-zinc-100 rounded-2xl hover:shadow-2xl hover:shadow-brand-600/5 transition-all flex flex-col overflow-hidden"
              >
                <div className="aspect-[21/9] w-full relative overflow-hidden bg-slate-100">
                  <img 
                    src={event.image} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt={event.title}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[8px] font-black uppercase text-slate-900 tracking-widest border border-white/20">
                    {event.date}
                  </div>
                </div>
                <div className="p-8 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-4 py-1.5 bg-brand-50 text-brand-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-100">
                        {event.type}
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-zinc-900 mb-3 tracking-tighter leading-tight group-hover:text-brand-600 transition-colors uppercase italic">
                      {event.title}
                    </h4>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-8 line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                  <Link 
                    to={`/events/${event.id}`}
                    className="w-full py-4 border-2 border-zinc-100 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all shadow-sm"
                  >
                    Explore Event
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center">
            <Link 
              to="/events" 
              className="group flex items-center gap-3 px-12 py-5 bg-brand-950 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-brand-600 transition-all shadow-2xl shadow-brand-950/20 border border-brand-900 active:scale-95"
            >
              View All Events <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Gallery Preview (Span 6x4) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-6 md:row-span-4 bento-card"
        >
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-6 flex items-center justify-between">
            Gallery Preview 
            <Link to="/gallery" className="text-brand-600 hover:underline transition-colors uppercase italic font-black">View All</Link>
          </h3>
          <div className="grid grid-cols-2 gap-3 flex-1">
            {galleryImages.length > 0 ? (
              <>
                {galleryImages.slice(0, 3).map((img, idx) => (
                  <div key={img.id || idx} className="bg-slate-200 rounded-2xl h-full overflow-hidden">
                    <img src={img.src} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={img.title || `Preview ${idx + 1}`} />
                  </div>
                ))}
                <div className="bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl">
                  {galleryImages.length > 3 ? `+${galleryImages.length - 3}` : '+0'}
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-200 rounded-2xl h-full overflow-hidden animate-pulse"></div>
                <div className="bg-slate-200 rounded-2xl h-full overflow-hidden animate-pulse"></div>
                <div className="bg-slate-200 rounded-2xl h-full overflow-hidden animate-pulse"></div>
                <div className="bg-slate-100 rounded-2xl animate-pulse"></div>
              </>
            )}
          </div>
        </motion.div>

        {/* Featured Achievements (Span 6x4) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="md:col-span-6 md:row-span-4 bg-white rounded-2xl p-8 text-slate-950 flex flex-col justify-between relative overflow-hidden border border-slate-100 shadow-sm"
        >
          <div className="absolute top-6 left-6">
             <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Our Legacy</span>
          </div>
          <div className="mt-8 text-center sm:text-left">
            <Trophy className="w-16 h-16 text-brand-600 mb-6 mx-auto sm:mx-0" />
            <h4 className="text-2xl font-black mb-2 italic tracking-tighter uppercase">{latestAchievement?.title || "Recent Win"}</h4>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed uppercase font-bold tracking-widest">
              {latestAchievement?.description || "Empowering the next generation of scientific leaders."}
            </p>
          </div>
          <Link 
            to="/achievements"
            className="w-full bg-brand-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-950 transition-all active:scale-95 text-center"
          >
            Explore Success
          </Link>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-50 blur-3xl"></div>
        </motion.div>

      </div>

      <div className="mt-16 bg-white rounded-xl p-12 md:p-24 text-slate-950 relative overflow-hidden border border-slate-100 shadow-xl shadow-brand-950/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50 blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <SectionHeader title="Recruitment Process" />
          <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase mb-10 leading-none">
            Become a part of <span className="text-brand-600">The Future</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left">
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-xl">
              <div className="w-10 h-10 bg-brand-600 text-white rounded-lg flex items-center justify-center mb-4 font-black">1</div>
              <h4 className="text-xl font-bold mb-2 uppercase tracking-tight italic">Google Forms</h4>
              <p className="text-sm text-slate-500 font-medium">Apply via our online form. Simple questions to know more about your passion and skills.</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-xl">
              <div className="w-10 h-10 bg-brand-600 text-white rounded-lg flex items-center justify-center mb-4 font-black">2</div>
              <h4 className="text-xl font-bold mb-2 uppercase tracking-tight italic">Interview Round</h4>
              <p className="text-sm text-slate-500 font-medium">A personal interaction with our core team to understand your vision and fit within INFINITIUM.</p>
            </div>
          </div>
          <button className="px-12 py-5 bg-brand-600 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-brand-950 transition-all shadow-2xl shadow-brand-600/20">
            Join INFINITIUM Today
          </button>
        </div>
      </div>
    </div>
  );
}
