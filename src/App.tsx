import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Info, Calendar, Users, Trophy, Image as ImageIcon, MessageSquare, 
  Mail, Settings, Menu, X, ChevronRight, QrCode, Scan, BarChart3, 
  ArrowRight, Github, ExternalLink, Download, UserCheck
} from 'lucide-react';
import { cn } from './lib/utils';

// --- Components ---
const Logo = () => (
  <div className="relative w-12 h-12 flex items-center justify-center bg-brand-950 rounded-full shadow-lg shadow-brand-500/20 group-hover:rotate-12 transition-transform overflow-hidden border border-brand-900">
    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
      {/* Atom Icon */}
      <g transform="translate(50, 35) scale(0.6)">
        <ellipse cx="0" cy="0" rx="30" ry="12" fill="none" stroke="#5eead4" strokeWidth="2" transform="rotate(0)" />
        <ellipse cx="0" cy="0" rx="30" ry="12" fill="none" stroke="#5eead4" strokeWidth="2" transform="rotate(60)" />
        <ellipse cx="0" cy="0" rx="30" ry="12" fill="none" stroke="#5eead4" strokeWidth="2" transform="rotate(120)" />
        <circle cx="0" cy="0" r="6" fill="#5eead4" />
        {/* Electrons */}
        <circle cx="28" cy="0" r="3" fill="#5eead4" />
        <circle cx="-14" cy="24" r="3" fill="#5eead4" />
        <circle cx="-14" cy="-24" r="3" fill="#5eead4" />
      </g>
      
      {/* Text */}
      <text x="50" y="72" textAnchor="middle" fontSize="12" fontWeight="900" fill="#5eead4" letterSpacing="0.05em" style={{ fontStyle: 'italic' }}>INFINITIUM</text>
      <text x="50" y="85" textAnchor="middle" fontSize="5" fontWeight="700" fill="white" letterSpacing="0.1em">INSPIRING INNOVATION</text>
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
              className="ml-4 px-4 py-2 bg-brand-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-900 transition-all flex items-center gap-2"
            >
              Admin Portal
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
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider",
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
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-brand-950 mt-4"
              >
                Admin Portal
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="mt-12 bg-white border-t border-slate-200 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
        <p>© 2026 INFINITIUM Society • ARSD College, University of Delhi</p>
        <div className="flex gap-6">
          <Link to="/about" className="hover:text-brand-600 transition-colors">About</Link>
          <Link to="/achievements" className="hover:text-brand-600 transition-colors">Achievements</Link>
          <Link to="/feedback" className="hover:text-brand-600 transition-colors">Feedback</Link>
          <Link to="/contact" className="text-brand-600">Contact Us</Link>
        </div>
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

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white font-sans text-brand-950 selection:bg-brand-100 selection:text-brand-900">
        <Navigation />
        <main className="pt-16">
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
        <Footer />
      </div>
    </Router>
  );
}
