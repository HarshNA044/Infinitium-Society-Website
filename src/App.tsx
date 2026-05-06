import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Info, Calendar, Users, Trophy, Image as ImageIcon, MessageSquare, 
  Mail, Settings, Menu, X, ChevronRight, QrCode, Scan, BarChart3, 
  ArrowRight, Github, ExternalLink, Download, UserCheck, Instagram as Image_Instagram, Linkedin 
} from 'lucide-react';
import { cn } from './lib/utils';

// --- Components ---
export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={cn("relative w-12 h-12 flex items-center justify-center bg-[#0d1b1b] rounded-full shadow-lg shadow-cyan-500/10 group-hover:scale-105 transition-transform overflow-hidden border border-cyan-500/20 shrink-0", className)}>
    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
      {/* Background Circle */}
      <circle cx="50" cy="50" r="48" fill="#0d1b1b" />
      
      {/* Atom Symbol (Cyan) */}
      <g transform="translate(50, 42) scale(0.85)">
        <ellipse cx="0" cy="0" rx="36" ry="13" fill="none" stroke="#22d3ee" strokeWidth="2" transform="rotate(0)" />
        <ellipse cx="0" cy="0" rx="36" ry="13" fill="none" stroke="#22d3ee" strokeWidth="2" transform="rotate(60)" />
        <ellipse cx="0" cy="0" rx="36" ry="13" fill="none" stroke="#22d3ee" strokeWidth="2" transform="rotate(120)" />
        <circle cx="0" cy="0" r="8" fill="#22d3ee" />
        {/* Electrons */}
        <circle cx="36" cy="0" r="3.5" fill="#22d3ee" />
        <circle cx="-18" cy="31.2" r="3.5" fill="#22d3ee" />
        <circle cx="-18" cy="-31.2" r="3.5" fill="#22d3ee" />
      </g>

      {/* Text Branding */}
      <text x="50" y="73" textAnchor="middle" fontSize="12" fontWeight="900" fill="#22d3ee" className="font-sans italic" style={{ letterSpacing: '-0.02em' }}>INFINITIUM</text>
      <text x="50" y="83" textAnchor="middle" fontSize="5" fontWeight="700" fill="#22d3ee" className="font-sans uppercase" style={{ letterSpacing: '0.15em', opacity: 0.9 }}>Inspiring Innovation</text>
    </svg>
  </div>
);

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Gallery', path: '/gallery', icon: ImageIcon },
    { name: 'Achievements', path: '/achievements', icon: Trophy },
    { name: 'Members', path: '/members', icon: Users },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo />
            <div>
              <h1 className="text-xl font-black leading-none tracking-tight text-brand-950 uppercase italic">INFINITIUM</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 hidden sm:block">Society of Physical Sciences, ARSD</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "text-sm font-semibold transition-all hover:text-brand-600",
                  location.pathname === item.path 
                    ? "text-brand-600 border-b-2 border-brand-600" 
                    : "text-slate-600"
                )}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/admin"
              className="ml-4 px-4 py-2 bg-brand-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-brand-900 transition-all flex items-center gap-2"
            >
              Admin Login
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider",
                    location.pathname === item.path 
                      ? "bg-brand-50 text-brand-600" 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                   {item.name}
                </Link>
              ))}
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-white bg-brand-950 mt-4"
              >
                Admin Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="mt-24 bg-slate-950 text-white pt-20 pb-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 border-b border-white/5 pb-16">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Logo />
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">INFINITIUM</h1>
          </div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest leading-relaxed max-w-sm">
            The premier society of Physical Sciences at Atma Ram Sanatan Dharma College, 
            cultivating a community of visionaries and innovators.
          </p>
        </div>
        
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-500 mb-6">Quick Links</h4>
          <ul className="space-y-4">
            <li><Link to="/about" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/events" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Our Events</Link></li>
            <li><Link to="/members" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Members</Link></li>
            <li><Link to="/achievements" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Success</Link></li>
            <li><Link to="/feedback" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Feedback</Link></li>
            <li><Link to="/admin" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Admin Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-500 mb-6">Connect</h4>
          <ul className="space-y-4">
            <li><a href="https://www.instagram.com/infinitium_arsd/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors"><Image_Instagram className="w-3 h-3 text-rose-400" /></span> Instagram
            </a></li>
            <li><a href="https://www.linkedin.com/company/infinitium-arsd/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors"><Linkedin className="w-3 h-3 text-blue-400" /></span> LinkedIn
            </a></li>
            <li><Link to="/contact" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors flex items-center gap-2">
              <span className="p-1.5 bg-brand-500/10 rounded-lg group-hover:bg-brand-500/20 transition-colors"><Mail className="w-3 h-3 text-brand-400" /></span> Contact Us
            </Link></li>
            <li><a href="mailto:teaminfinitium.arsd@gmail.com" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors flex items-center gap-2">
              <span className="p-1.5 bg-zinc-500/10 rounded-lg group-hover:bg-zinc-500/20 transition-colors"><Mail className="w-3 h-3 text-zinc-400" /></span> Email
            </a></li>
          </ul>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
          © 2026 INFINITIUM Society ARSD College, University of Delhi.
        </p>
      </div>
    </div>
  </footer>
);

// --- Import Pages (Stubbing for now to compile) ---
import Home_Page from './pages/Home';
import About_Page from './pages/About';
import Events_Page from './pages/Events';
import Gallery_Page from './pages/Gallery';
import Achievements_Page from './pages/Achievements';
import Members_Page from './pages/Members';
import Contact_Page from './pages/Contact';
import Feedback_Page from './pages/Feedback';
import Admin_Page from './pages/Admin';
import EventDetail_Page from './pages/EventDetail';

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white font-sans text-brand-950 selection:bg-brand-100 selection:text-brand-900">
      {!isAdminPath && <Navigation />}
      <main className={cn(!isAdminPath && "pt-20")}>
        <Routes>
          <Route path="/" element={<Home_Page />} />
          <Route path="/about" element={<About_Page />} />
          <Route path="/events" element={<Events_Page />} />
          <Route path="/events/:id" element={<EventDetail_Page />} />
          <Route path="/gallery" element={<Gallery_Page />} />
          <Route path="/achievements" element={<Achievements_Page />} />
          <Route path="/members" element={<Members_Page />} />
          <Route path="/contact" element={<Contact_Page />} />
          <Route path="/feedback" element={<Feedback_Page />} />
          <Route path="/admin/*" element={<Admin_Page />} />
        </Routes>
      </main>
      {!isAdminPath && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
