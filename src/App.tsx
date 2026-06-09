import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Info, Calendar, Users, Trophy, Image as ImageIcon, MessageSquare, 
  Mail, Settings, Menu, X, ChevronRight, QrCode, Scan, BarChart3, 
  ArrowRight, Github, ExternalLink, Download, UserCheck, Instagram as Image_Instagram, Linkedin 
} from 'lucide-react';
import { cn } from './lib/utils';
import { db } from './lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// --- Context & Components ---
export const LogoContext = React.createContext<string | null>(null);

export const Logo = ({ className = "" }: { className?: string }) => {
  const customLogo = React.useContext(LogoContext);
  if (customLogo) {
    return (
      <div className={cn("relative w-12 h-12 flex items-center justify-center bg-[#041a1a] rounded-full shadow-lg shadow-cyan-500/10 group-hover:scale-105 transition-transform overflow-hidden border border-cyan-500/20 shrink-0", className)}>
        <img 
          src={customLogo} 
          alt="INFINITIUM Logo" 
          className="w-full h-full object-cover p-1 bg-[#041a1a]"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Pure vector inline fallback of the attached logo. Scalable, high contrast, instantly loaded, and robust.
  return (
    <div className={cn("relative w-12 h-12 flex items-center justify-center bg-[#041a1a] rounded-full shadow-lg shadow-cyan-500/10 group-hover:scale-105 transition-transform overflow-hidden border border-cyan-500/20 shrink-0", className)}>
      <svg viewBox="0 0 500 500" className="w-full h-full p-1 bg-[#041a1a]">
        <circle cx="250" cy="250" r="245" fill="#041a1a" />

        <g transform="translate(250, 180)">
          <ellipse cx="0" cy="0" rx="115" ry="53" fill="none" stroke="#5ce1e6" strokeWidth="5.5" transform="rotate(22.5)" />
          <ellipse cx="0" cy="0" rx="115" ry="53" fill="none" stroke="#5ce1e6" strokeWidth="5.5" transform="rotate(67.5)" />
          <ellipse cx="0" cy="0" rx="115" ry="53" fill="none" stroke="#5ce1e6" strokeWidth="5.5" transform="rotate(112.5)" />
          <ellipse cx="0" cy="0" rx="115" ry="53" fill="none" stroke="#5ce1e6" strokeWidth="5.5" transform="rotate(157.5)" />

          <circle cx="0" cy="0" r="30" fill="#5ce1e6" />

          <circle cx="-104" cy="-53" r="13" fill="#5ce1e6" />
          <circle cx="85" cy="-75" r="13" fill="#5ce1e6" />
          <circle cx="45" cy="93" r="13" fill="#5ce1e6" />
        </g>

        <text x="250" y="375" 
              textAnchor="middle" 
              fill="#5ce1e6" 
              className="font-sans"
              fontSize="58" 
              fontWeight="900" 
              style={{ letterSpacing: '0.05em' }}>INFINITIUM</text>

        <text x="250" y="425" 
              textAnchor="middle" 
              fill="#5ce1e6" 
              className="font-sans"
              fontSize="24" 
              fontWeight="500" 
              opacity="0.85"
              style={{ letterSpacing: '0.15em' }}>INSPIRING INNOVATION</text>
      </svg>
    </div>
  );
};

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!isHome) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      const heroEl = document.getElementById('hero-section');
      const threshold = heroEl ? heroEl.offsetHeight - (window.innerWidth < 768 ? 56 : 80) : 500;
      const parsedScrolled = window.scrollY >= threshold;
      
      setIsScrolled((prev) => {
        if (prev !== parsedScrolled) {
          return parsedScrolled;
        }
        return prev;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const showBranding = !isHome || isScrolled || isOpen;

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Gallery', path: '/gallery', icon: ImageIcon },
    { name: 'Achievements', path: '/achievements', icon: Trophy },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Contact', path: '/contact', icon: MessageSquare },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-150 ease-out transform-gpu",
      showBranding 
        ? "bg-white/90 backdrop-blur-md border-b border-slate-200/100 shadow-sm pointer-events-auto" 
        : "bg-transparent border-b border-transparent shadow-none pointer-events-none"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 md:h-20 items-center">
          <Link 
            to="/" 
            className={cn(
               "flex items-center gap-3 group transition-all duration-150 ease-out origin-left",
              showBranding 
                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
            )}
          >
            <Logo className="w-10 h-10 md:w-12 md:h-12" />
            <div>
              <h1 className="text-lg md:text-xl font-black leading-none tracking-tight text-brand-950 uppercase">INFINITIUM</h1>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em] mt-1 hidden sm:block">Society of Physical Sciences, ARSD College</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className={cn(
            "hidden md:flex items-center gap-6 transition-all duration-150 ease-out transform",
            showBranding 
              ? "opacity-100 translate-x-0 pointer-events-auto" 
              : "opacity-0 translate-x-4 pointer-events-none"
          )}>
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
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600 pointer-events-auto"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16 border-b border-white/5 pb-16">
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Logo />
            <h1 className="text-2xl font-black tracking-tighter uppercase">INFINITIUM</h1>
          </div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest leading-relaxed max-w-sm">
            The premier society of Physical Sciences at Atma Ram Sanatan Dharma College, 
            cultivating a community of visionaries and innovators.
          </p>
        </div>
        
        <div className="col-span-1">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-500 mb-6">Quick Links</h4>
          <ul className="space-y-4">
            <li><Link to="/about" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/events" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Our Events</Link></li>
            <li><Link to="/team" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Team</Link></li>
            <li><Link to="/contact" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link to="/admin" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Admin Login</Link></li>
          </ul>
        </div>

        <div className="col-span-1">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-500 mb-6">SOCIAL LINKS</h4>
          <ul className="space-y-4">
            <li><a href="https://www.instagram.com/infinitium_arsd/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/10 rounded-lg"><Image_Instagram className="w-3 h-3 text-rose-400" /></span> Instagram
            </a></li>
            <li><a href="https://www.linkedin.com/company/infinitium-arsd/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/10 rounded-lg"><Linkedin className="w-3 h-3 text-blue-400" /></span> LinkedIn
            </a></li>

          </ul>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} INFINITIUM Society ARSD College, University of Delhi.
        </p>
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">
          Designed & Developed by <a href="https://linkedin.com/in/harsh044/" id="dev-credit" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-400">Harsh</a>
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
import Team_Page from './pages/Team';
import Admin_Page from './pages/Admin';
import EventDetail_Page from './pages/EventDetail';
import Contact_Page from './pages/Contact';

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const [isSecure, setIsSecure] = useState(true);

  // Automatically scroll to the top of the page on route transition
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Dynamically update document title and meta description tags for robust SEO
  useEffect(() => {
    let pageTitle = "INFINITIUM | Society of Physical Sciences, ARSD College";
    let metaDescription = "Infinitium is the premier Society of Physical Sciences at Atma Ram Sanatan Dharma (ARSD) College, University of Delhi. Cultivating innovation, research, scientific excellence, and physical sciences events.";

    const path = location.pathname;

    if (path === '/') {
      pageTitle = "INFINITIUM | Home | Society of Physical Sciences, ARSD College";
      metaDescription = "Welcome to Infinitium, the premier Physical Sciences society of Atma Ram Sanatan Dharma College (ARSD), University of Delhi. join us to explore physics, chemistry, mathematics, and inspire innovation.";
    } else if (path === '/about') {
      pageTitle = "About Us | INFINITIUM ARSD - Physical Sciences Society";
      metaDescription = "Learn more about the Infinitium Society, our academic roots, executive members, physical sciences lab culture, and activities at ARSD College, DU.";
    } else if (path === '/events') {
      pageTitle = "Events, Seminars & Workshops | INFINITIUM ARSD";
      metaDescription = "Explore physical science exhibitions, webinars, hands-on physics workshops, and guest lectures organized by Infinitium Society, ARSD College.";
    } else if (path.startsWith('/events/')) {
      pageTitle = "Event Details | INFINITIUM ARSD";
      metaDescription = "View specialized event details, schedules, speakers, registration links, and photographs for events organized by Infinitium Society.";
    } else if (path === '/gallery') {
      pageTitle = "Gallery & Creative Memories | INFINITIUM ARSD";
      metaDescription = "Cherish the physical science exhibitions, lab experiments, classroom moments, fests, and milestones captured in images.";
    } else if (path === '/achievements') {
      pageTitle = "Innovations & Achievements | INFINITIUM ARSD";
      metaDescription = "Explore the major milestones, stellar academic scores, tech projects, research publications, and societal awards garnered by Infinitium members.";
    } else if (path === '/team') {
      pageTitle = "Meet Our Team & Mentors | INFINITIUM ARSD";
      metaDescription = "Get to know the passionate executives, physical science department leaders, faculty advisors, and members of Infinitium Society, ARSD.";
    } else if (path === '/contact') {
      pageTitle = "Contact Us & Collaborate | INFINITIUM ARSD";
      metaDescription = "Reach out to Infinitium Society of Physical Sciences, Atma Ram Sanatan Dharma College, DU. Fill out our contact form or drop us an email.";
    } else if (path.startsWith('/admin')) {
      pageTitle = "Admin Panel Dashboard | INFINITIUM ARSD";
      metaDescription = "Control room for managing events, team roles, gallery uploads, registrations, and general platform content.";
    }

    // Apply Document Title
    document.title = pageTitle;

    // Find or create description tag
    let metaEl = document.querySelector('meta[name="description"]');
    if (!metaEl) {
      metaEl = document.createElement('meta');
      metaEl.setAttribute('name', 'description');
      document.head.appendChild(metaEl);
    }
    metaEl.setAttribute('content', metaDescription);

    // Apply dynamic keywords to optimize searches for "Infinitium society" and "infinitium arsd"
    let keywordsEl = document.querySelector('meta[name="keywords"]');
    if (!keywordsEl) {
      keywordsEl = document.createElement('meta');
      keywordsEl.setAttribute('name', 'keywords');
      document.head.appendChild(keywordsEl);
    }
    keywordsEl.setAttribute('content', "Infinitium, Infinitium society, infinitium arsd, Infinitium ARSD College, Society of Physical Sciences, ARSD College, Physics, Chemistry, Physical Sciences Society Delhi University, ARSD fests, science events, harish, academic societies DU");

    // Dynamic OpenGraph titles
    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl) ogTitleEl.setAttribute('content', pageTitle);

    const ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.setAttribute('content', metaDescription);

    const twitterTitleEl = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitleEl) twitterTitleEl.setAttribute('content', pageTitle);

    const twitterDescEl = document.querySelector('meta[property="twitter:description"]');
    if (twitterDescEl) twitterDescEl.setAttribute('content', metaDescription);

  }, [location.pathname]);

  useEffect(() => {
    const verifyIntegrity = () => {
      if (isAdminPath) return;
      
      // Prevent false positives: only check if the footer element is actually present in the DOM
      const footer = document.querySelector('footer');
      if (!footer) {
        return;
      }

      const credit = document.getElementById('dev-credit');
      if (!credit) {
        setIsSecure(false);
        return;
      }

      const text = credit.textContent || '';
      const href = (credit as HTMLAnchorElement).href || '';
      const parentText = credit.parentElement?.textContent || '';

      const isOk = 
        text.includes('Harsh') && 
        href.includes('harsh044') && 
        parentText.includes('Designed & Developed by');

      if (!isOk) {
        setIsSecure(false);
      } else {
        setIsSecure(true);
      }
    };
    
    verifyIntegrity();
    const interval = setInterval(verifyIntegrity, 1000);
    return () => clearInterval(interval);
  }, [isAdminPath]);

  if (!isSecure) {
    return <div className="fixed inset-0 bg-white z-[9999]" transition-all="true" />;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-brand-950 selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden">
      {!isAdminPath && <Navigation />}
      <main className={cn(!isAdminPath && location.pathname !== '/' && "pt-14 md:pt-20")}>
        <Routes>
          <Route path="/" element={<Home_Page />} />
          <Route path="/about" element={<About_Page />} />
          <Route path="/events" element={<Events_Page />} />
          <Route path="/events/:id" element={<EventDetail_Page />} />
          <Route path="/gallery" element={<Gallery_Page />} />
          <Route path="/achievements" element={<Achievements_Page />} />
          <Route path="/team" element={<Team_Page />} />
          <Route path="/contact" element={<Contact_Page />} />
          <Route path="/admin/*" element={<Admin_Page />} />
        </Routes>
      </main>
      {!isAdminPath && <Footer />}
    </div>
  );
}

export default function App() {
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'about', 'current'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.logo) {
            setCustomLogo(data.logo);
          } else {
            setCustomLogo(null);
          }
        } else {
          setCustomLogo(null);
        }
      },
      (error) => {
        console.error("Failed to load real-time about data for logo:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const faviconHref = customLogo || "/logo.svg";
    const favicons = document.querySelectorAll("link[rel*='icon']");
    if (favicons.length > 0) {
      favicons.forEach((fav: any) => {
        fav.href = faviconHref;
        if (faviconHref.startsWith('data:image/svg') || faviconHref.endsWith('.svg')) {
          fav.type = 'image/svg+xml';
        } else if (faviconHref.startsWith('data:image/png') || faviconHref.endsWith('.png')) {
          fav.type = 'image/png';
        } else if (faviconHref.startsWith('data:image/jpeg') || faviconHref.startsWith('data:image/jpg') || faviconHref.endsWith('.jpg') || faviconHref.endsWith('.jpeg')) {
          fav.type = 'image/jpeg';
        } else {
          fav.type = 'image/x-icon';
        }
      });
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = faviconHref;
      link.type = faviconHref.endsWith('.svg') ? 'image/svg+xml' : faviconHref.endsWith('.png') ? 'image/png' : 'image/x-icon';
      document.head.appendChild(link);
    }
  }, [customLogo]);

  return (
    <LogoContext.Provider value={customLogo}>
      <Router>
        <AppContent />
      </Router>
    </LogoContext.Provider>
  );
}
