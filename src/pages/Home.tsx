import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, Calendar, Users, Trophy, ChevronRight, Zap, Star, 
  Plus, QrCode as QrIcon, Lightbulb, Book, MessageSquare, Globe2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

const StatCard = ({ label, value, icon: Icon, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
  >
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-3xl font-bold tracking-tight text-zinc-900">{value}</span>
    </div>
    <span className="text-zinc-500 font-medium">{label}</span>
  </motion.div>
);

export default function Home_Page() {
  const { request } = useApi();
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRegistrations: 0, totalAttendance: 0, eventsCount: 0 });
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    request('/api/events').then(data => {
      const sorted = [...data].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(sorted);
    });
    request('/api/stats').then(setStats);
    request('/api/achievements').then(setAchievements);
  }, []);

  const featuredEvent = events[0];
  const latestAchievement = achievements[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:auto-rows-[minmax(80px,_auto)]">
        
        {/* Main Hero / Featured Event (Span 8x4) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-8 md:row-span-4 bg-brand-950 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden text-white flex flex-col justify-end shadow-2xl shadow-brand-500/20 group border border-brand-900"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <Zap className="w-64 h-64 text-brand-300" />
          </div>
          <span className="bg-brand-500/20 text-[10px] font-black uppercase tracking-[0.3em] py-1.5 px-4 rounded-full self-start mb-8 backdrop-blur-md border border-brand-500/30">Society of Physical Sciences</span>
          <h2 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter uppercase italic">
            INFINITIUM <br /> <span className="text-brand-300">INSPIRING</span> <br /> INNOVATION
          </h2>
          <div className="flex flex-wrap gap-8 items-center mt-4">
            <div className="flex flex-col max-w-lg">
              <span className="text-[10px] text-brand-300/70 uppercase font-bold tracking-widest mb-1">Legacy of ARSD College</span>
              <p className="text-sm font-medium text-brand-100/90 leading-relaxed uppercase tracking-tight">
                INFINITIUM stands as the premier scientific hub of Atma Ram Sanatan Dharma College, 
                unifying curiosity and academic rigor to shape the next generation of pioneers.
              </p>
            </div>
            <Link 
              to="/about"
              className="md:ml-auto bg-brand-500 text-brand-950 px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-white transition-all shadow-2xl shadow-brand-950/20 active:scale-95"
            >
              Our Story
            </Link>
          </div>
        </motion.div>

        {/* Quick Stats (Span 4x3) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-4 md:row-span-3 bento-card justify-between"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-tighter">Society Stats</h3>
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl"><ArrowRight className="w-5 h-5 -rotate-45" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tighter">{stats.totalRegistrations}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Registrations</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tighter">{stats.eventsCount}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Events Held</div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-brand-600 w-3/4"></div>
            <div className="h-full bg-brand-300 w-1/4"></div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Member Growth: 85% Positive</p>
        </motion.div>

        {/* Quick Registration (Span 4x1) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-4 md:row-span-1 bg-amber-400 rounded-[2rem] border border-amber-500 p-6 flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer"
          onClick={() => window.scrollTo({ top: document.getElementById('events-section')?.offsetTop || 0, behavior: 'smooth' })}
        >
          <div className="flex flex-col">
            <h4 className="font-black text-amber-950 uppercase text-lg tracking-tighter leading-none">Quick Register</h4>
            <p className="text-[9px] text-amber-900 font-bold uppercase leading-none opacity-70 mt-1">Join upcoming events instantly</p>
          </div>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-lg shadow-amber-950/10">
            <Plus className="w-6 h-6" />
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
            {events.slice(0, 3).map((event: any) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group bg-white border border-zinc-100 rounded-[2.5rem] hover:shadow-2xl hover:shadow-brand-600/5 transition-all flex flex-col overflow-hidden"
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
                    className="w-full py-4 border-2 border-zinc-100 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all shadow-sm"
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
              className="group flex items-center gap-3 px-12 py-5 bg-brand-950 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-brand-600 transition-all shadow-2xl shadow-brand-950/20 border border-brand-900 active:scale-95"
            >
              View All Events <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Gallery Preview (Span 3x4) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-3 md:row-span-4 bento-card"
        >
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-6 flex items-center justify-between">
            Gallery Preview 
            <Link to="/gallery" className="text-brand-600 hover:underline transition-colors uppercase italic font-black">View All</Link>
          </h3>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="bg-slate-200 rounded-2xl h-full overflow-hidden">
              <img src="https://images.unsplash.com/photo-1540575861501-7ce0e1d1aa99?q=80&w=400" className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Preview 1" />
            </div>
            <div className="bg-slate-200 rounded-2xl h-full overflow-hidden">
              <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400" className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Preview 2" />
            </div>
            <div className="bg-slate-200 rounded-2xl h-full overflow-hidden">
              <img src="https://images.unsplash.com/photo-1523580494863-6f30312248f5?q=80&w=400" className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Preview 3" />
            </div>
            <div className="bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl">+12</div>
          </div>
        </motion.div>

        {/* Attendee Insights (Span 5x4) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-5 md:row-span-4 bento-card shadow-brand-600/5 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold uppercase text-slate-900 tracking-tighter">Student Demographics</h3>
            <div className="text-[10px] font-bold text-brand-600 uppercase bg-brand-50 px-2 py-1 rounded tracking-widest">Live Feed</div>
          </div>
          <div className="flex-1 flex flex-col gap-6">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Physical Sciences</span>
                <span className="text-slate-900">85%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Computer Science</span>
                <span className="text-slate-900">60%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-300 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Applied Physics</span>
                <span className="text-slate-900">40%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-200 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div className="mt-auto p-5 bg-slate-50 rounded-[2rem] flex items-center gap-4 border border-slate-100">
              <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-600">
                 <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">98% Retention</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Member loyalty score</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Featured Achievements (Span 4x4) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="md:col-span-4 md:row-span-4 bg-brand-950 rounded-[2.5rem] p-8 text-white flex flex-col justify-between relative overflow-hidden border border-brand-900"
        >
          <div className="absolute top-6 left-6">
             <span className="text-[9px] font-black uppercase text-brand-400 tracking-[0.3em]">Our Legacy</span>
          </div>
          <div className="mt-8 text-center sm:text-left">
            <Trophy className="w-16 h-16 text-brand-400 mb-6 mx-auto sm:mx-0 drop-shadow-[0_0_15px_rgba(94,234,212,0.4)]" />
            <h4 className="text-2xl font-black mb-2 italic tracking-tighter uppercase">{latestAchievement?.title || "Recent Win"}</h4>
            <p className="text-xs text-brand-200/60 mb-8 leading-relaxed uppercase font-bold tracking-widest">
              {latestAchievement?.description || "Empowering the next generation of scientific leaders."}
            </p>
          </div>
          <Link 
            to="/achievements"
            className="w-full bg-brand-500 text-brand-950 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-500/30 hover:bg-white transition-all active:scale-95 text-center"
          >
            Explore Success
          </Link>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-500/10 blur-3xl"></div>
        </motion.div>

      </div>

      <div className="mt-16 bg-brand-950 rounded-[3.5rem] p-12 md:p-24 text-white relative overflow-hidden border border-brand-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <SectionHeader title="Recruitment Process" />
          <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase mb-10 leading-none">
            Become a part of <span className="text-brand-400">The Future</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left">
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
              <div className="w-10 h-10 bg-brand-500 text-brand-950 rounded-xl flex items-center justify-center mb-4 font-black">1</div>
              <h4 className="text-xl font-bold mb-2 uppercase tracking-tight italic">Google Forms</h4>
              <p className="text-sm text-brand-200/60 font-medium">Apply via our online form. Simple questions to know more about your passion and skills.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
              <div className="w-10 h-10 bg-brand-500 text-brand-950 rounded-xl flex items-center justify-center mb-4 font-black">2</div>
              <h4 className="text-xl font-bold mb-2 uppercase tracking-tight italic">Interview Round</h4>
              <p className="text-sm text-brand-200/60 font-medium">A personal interaction with our core team to understand your vision and fit within INFINITIUM.</p>
            </div>
          </div>
          <button className="px-12 py-5 bg-brand-500 text-brand-950 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-white transition-all shadow-2xl shadow-brand-500/20">
            Join INFINITIUM Today
          </button>
        </div>
      </div>
    </div>
  );
}

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center gap-4 mb-4">
    <div className="h-px bg-brand-800 w-12 hidden md:block"></div>
    <span className="text-[10px] font-black uppercase text-brand-300 tracking-[0.5em]">{title}</span>
    <div className="h-px bg-brand-800 w-12 hidden md:block"></div>
  </div>
);
