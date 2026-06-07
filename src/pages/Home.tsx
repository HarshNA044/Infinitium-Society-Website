import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, Calendar, Users, Trophy, Zap, Star, 
  Plus, QrCode as QrIcon, Lightbulb, Book, MessageSquare, Globe2,
  Cpu, TestTube2, Monitor, MapPin, Share2, UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { cn } from '../lib/utils';

const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
}) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        "pointer-events-none absolute h-full w-full overflow-hidden [perspective:200px]",
        `opacity-[var(--opacity)]`,
      )}
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#fcfcfc] to-transparent to-90%" />
    </div>
  )
}

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center gap-4 mb-4">
    <div className="h-px bg-brand-800 w-12 hidden md:block"></div>
    <span className="text-[10px] font-black uppercase text-brand-300 tracking-[0.5em]">{title}</span>
    <div className="h-px bg-brand-800 w-12 hidden md:block"></div>
  </div>
);

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Events', path: '/events' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Achievements', path: '/achievements' },
  { name: 'Team', path: '/team' },
];

export default function Home_Page() {
  const [events, setEvents] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (!timeStr.includes(':')) return timeStr;
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const formattedMinutes = minutes.padStart(2, '0');
    return `${displayH}:${formattedMinutes} ${ampm}`;
  };

  const isUpcoming = (dateStr: string) => {
    try {
      const eventDate = new Date(dateStr);
      const now = new Date();
      eventDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      return eventDate >= now;
    } catch (e) {
      return false;
    }
  };

  const handleShare = async (e: React.MouseEvent, event: any) => {
    e.preventDefault();
    e.stopPropagation();
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
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Error sharing:', err);
    }
  };

  useEffect(() => {
    if (galleryImages.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % galleryImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [galleryImages.length]);

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
    <div className="w-full">
      {/* Main Hero / Featured Event (100% width) with RetroGrid & Premium Aesthetics */}
      <motion.div 
        id="hero-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full relative overflow-hidden text-slate-950 flex flex-col justify-start border-b border-slate-100 transform-gpu pb-16 md:pb-24"
      >
        <RetroGrid opacity={0.35} lightLineColor="#e2e8f0" />
        
        {/* Centered Hero Navigation Links for Desktop/Tablet */}
        <div className="hidden md:flex items-center justify-center gap-8 py-8 w-full relative z-20 select-none border-b border-slate-100/50 backdrop-blur-sm bg-white/10">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-brand-600 transition-colors duration-300"
            >
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="relative z-10 px-6 sm:px-8 md:px-12 flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 pt-16 md:pt-24 pb-8">
          <div className="space-y-3">
            {/* Main Typographic Heading */}
            <h2 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight bg-clip-text text-transparent bg-[linear-gradient(180deg,#090d16,_#2d3748)] uppercase select-none leading-none">
              INFINITIUM
            </h2>
            
            {/* Tagline showing Inspiring Innovation, text size smaller than INFINITIUM */}
            <span className="block text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-600 into-brand-500 to-teal-500 uppercase tracking-widest select-none font-sans leading-none">
              INSPIRING INNOVATION
            </span>
          </div>

          {/* Description Paragraph */}
          <p className="max-w-2xl mx-auto text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed tracking-normal">
            INFINITIUM stands as the premier scientific hub of Physical Sciences at ARSD College, bringing together students from Chemistry, Computer Science, Electronics, and Applied Sciences to foster innovation, research, creativity, and scientific thinking.
          </p>

          {/* Action Call with Conic Laser Spinning Border */}
          <div className="items-center justify-center gap-x-3 mt-4">
            <span className="relative inline-block overflow-hidden rounded-full p-[1.5px]">
              <span className="absolute inset-[-1000%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ccfbf1_0%,#0d9488_50%,#ccfbf1_100%)]" />
              <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white text-xs font-semibold backdrop-blur-3xl">
                <Link
                  to="/about"
                  className="inline-flex rounded-full text-center group items-center w-full justify-center bg-gradient-to-tr from-zinc-300/10 via-brand-50/25 to-transparent text-slate-900 border-input border-[1px] hover:bg-gradient-to-tr hover:from-zinc-300/20 hover:via-brand-50/50 hover:to-transparent duration-300 py-3.5 px-10 uppercase font-black tracking-widest text-[11px]"
                >
                  Our Story
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 duration-300 transition-transform" />
                </Link>
              </div>
            </span>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:auto-rows-[minmax(80px,_auto)]">


        {/* Quick Registration (Span 12x1) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-12 md:row-span-1"
        >
          <Link 
            to="/contact"
            className="bg-amber-400 rounded-2xl border border-amber-500 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:scale-[1.01] transition-transform cursor-pointer block hover:shadow-lg hover:shadow-amber-500/10"
          >
            <div className="flex flex-col">
              <h4 className="font-black text-amber-950 uppercase text-lg tracking-tighter leading-none">Quick Register</h4>
              <p className="text-xs sm:text-sm text-amber-900 font-bold uppercase leading-tight mt-2 max-w-xl">
                Become a proud member of a science focussed community for your growth.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-950">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-lg shadow-amber-950/10">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Ongoing & Recent Section (Span 12) */}
        <div id="events-section" className="md:col-span-12 py-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">Ongoing & Recent</h3>
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
                className="group bg-white border border-zinc-100 rounded-2xl shadow-md shadow-slate-200/50 hover:shadow-2xl hover:shadow-brand-600/5 transition-all flex flex-col overflow-hidden relative"
              >
                <div className="aspect-[21/9] w-full relative overflow-hidden bg-slate-100">
                  {isUpcoming(event.date) && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-3 py-1 bg-brand-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg border border-brand-400 animate-wave">
                        Upcoming
                      </span>
                    </div>
                  )}
                  <img 
                    src={event.image} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt={event.title}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-8 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-4 py-1.5 bg-brand-50 text-brand-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-100">
                        {event.type}
                      </span>
                      <button 
                        onClick={(e) => handleShare(e, event)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all active:scale-90 border border-slate-100"
                        title="Share Event"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="text-xl font-black text-zinc-900 mb-3 tracking-tighter leading-tight group-hover:text-brand-600 transition-colors uppercase">
                      {event.title}
                    </h4>
                    <div className="flex flex-col gap-1 mb-6">
                      <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        <Calendar className="w-3 h-3 text-brand-600" />
                        {event.date} {event.startTime && `@ ${formatTime(event.startTime)}`}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        <MapPin className="w-3 h-3 text-brand-600" />
                        {event.location}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-8 line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                  <Link 
                    to={`/events/${event.id}`}
                    className="w-full py-4 bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-600 bg-[length:200%_auto] hover:bg-right text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-brand-600/30 active:scale-95 transition-all duration-500 border border-white/20 shadow-lg shadow-brand-600/10"
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

        {/* Gallery Slideshow (Span 8x4) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="md:col-span-8 md:row-span-4 bg-zinc-950 rounded-2xl relative overflow-hidden group shadow-2xl shadow-brand-500/10 border border-white/5"
        >
          <div className="absolute inset-0 z-0">
            {galleryImages.length > 0 ? (
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="w-full h-full"
              >
                <img 
                  src={galleryImages[currentSlide].src} 
                  className="w-full h-full object-cover opacity-60" 
                  referrerPolicy="no-referrer" 
                  alt={galleryImages[currentSlide].title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
              </motion.div>
            ) : (
              <div className="w-full h-full bg-zinc-900 animate-pulse"></div>
            )}
          </div>

          <div className="relative z-10 p-8 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase text-brand-400 tracking-[0.4em] bg-brand-950/50 backdrop-blur-md px-3 py-1 rounded-full border border-brand-500/20">
                Gallery Reel
              </span>
              <Link to="/gallery" className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              {galleryImages[currentSlide] && (
                <motion.div
                  key={`text-${currentSlide}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                    {galleryImages[currentSlide].title}
                  </h4>
                  <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> {galleryImages[currentSlide].eventDate || 'Recent Moment'}
                  </p>
                </motion.div>
              )}
              
              <div className="flex gap-1.5 mt-6">
                {galleryImages.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-8 bg-brand-500' : 'w-2 bg-white/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Featured Achievements (Span 4x4) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="md:col-span-4 md:row-span-4 bg-white rounded-2xl p-8 text-slate-950 flex flex-col justify-between items-center text-center relative overflow-hidden border border-slate-100 shadow-sm"
        >
          <div className="absolute top-6 left-1/2 -translate-x-1/2">
             <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Our Legacy</span>
          </div>
          <div className="mt-10 flex flex-col items-center">
            <Trophy className="w-16 h-16 text-brand-600 mb-6 mx-auto" />
            <h4 className="text-2xl font-black mb-2 tracking-tighter uppercase">{latestAchievement?.title || "Recent Win"}</h4>
            {(!latestAchievement?.description || latestAchievement?.description.trim().toLowerCase() !== latestAchievement?.title?.trim().toLowerCase()) && (
              <p className="text-xs text-slate-400 mb-8 leading-relaxed uppercase font-bold tracking-widest max-w-xs mx-auto">
                {latestAchievement?.description || "Empowering the next generation of scientific leaders."}
              </p>
            )}
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

      <div className="mt-16 bg-white rounded-2xl p-8 sm:p-12 md:p-20 text-zinc-950 relative overflow-hidden border border-brand-400 shadow-2xl shadow-brand-500/10">
        {/* Deep Rising Gradient Effect */}
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-brand-200/40 via-brand-50/20 to-transparent z-0 pointer-events-none" />
        <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-brand-500/10 blur-[120px] rounded-full z-0" />
        <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-brand-400/10 blur-[120px] rounded-full z-0" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <SectionHeader title="Recruitment Process" />
          <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-6 leading-[0.9]">
            Become a part of <br /> <span className="text-brand-600">The Future</span>
          </h3>
          <p className="text-slate-500 text-xs md:text-sm font-medium max-w-2xl mx-auto mb-10 md:mb-16 uppercase tracking-widest leading-relaxed">
            Perfect for your next milestone, join the frequency and enjoy the result.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-24 mb-12 md:mb-20 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="flex items-center gap-5 mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-xl shadow-lg shadow-brand-600/20 group-hover:scale-110 transition-transform">
                  1
                </div>
                <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-zinc-900 group-hover:text-brand-600 transition-colors">Google Forms</h4>
              </div>
              <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                Connect your passion directly. Apply via our structured online portal where your skills meet our vision.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="flex items-center gap-5 mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-xl shadow-lg shadow-brand-600/20 group-hover:scale-110 transition-transform">
                  2
                </div>
                <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-zinc-900 group-hover:text-brand-600 transition-colors">Interview Round</h4>
              </div>
              <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                A high-bandwidth interaction with our core team. We go beyond papers to find the pioneer within you.
              </p>
            </motion.div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 md:px-12 py-4 md:py-5 bg-brand-600 text-white rounded-xl font-black uppercase text-xs md:text-sm tracking-[0.2em] hover:bg-brand-950 transition-all shadow-xl shadow-brand-600/20"
          >
            Join INFINITIUM Today
          </motion.button>
        </div>
      </div>
    </div>
    </div>
  );
}
