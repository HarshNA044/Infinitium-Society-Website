import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Target, Users, Lightbulb, GraduationCap, 
  Search, Handshake, Microscope, MessageSquare,
  BookOpen, Edit3, Monitor, Calendar, Megaphone, DollarSign,
  TrendingUp, Award, UserPlus, Globe, Trophy,
  Shield, Heart, Zap, Sparkles, Cpu, FileText
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const SectionTitle = ({ children, subtitle }: { children: React.ReactNode, subtitle?: string }) => (
  <div className="mb-10 md:mb-16">
    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2 leading-[0.9]">{children}</h2>
    {subtitle && <p className="text-[10px] md:text-sm font-bold text-brand-600 uppercase tracking-[0.3em] font-sans">{subtitle}</p>}
  </div>
);

const Card = ({ icon: Icon, title, text, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="p-8 bg-white border border-zinc-100 rounded-xl shadow-sm hover:shadow-xl hover:border-brand-100 transition-all group"
  >
    <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-black text-zinc-900 mb-3 tracking-tight uppercase">{title}</h3>
    <p className="text-sm text-zinc-500 leading-relaxed font-medium">{text}</p>
  </motion.div>
);

const DepartmentCard = ({ icon: Icon, title, aim, tasks, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="p-8 bg-white text-slate-950 rounded-2xl relative overflow-hidden border border-slate-100 shadow-sm h-full flex flex-col"
  >
    <div className="absolute top-0 right-0 p-8 opacity-5">
      <Icon className="w-32 h-32 text-brand-600" />
    </div>
    <div className="relative z-10">
      <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-6 border border-brand-100 font-black">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-2xl font-black mb-4 tracking-tighter uppercase text-slate-900">{title} Department</h3>
      <p className="text-[10px] text-brand-600 font-black uppercase tracking-[0.2em] mb-6 border-b border-brand-100 pb-2 inline-block">Aim: {aim}</p>
      <ul className="space-y-3">
        {tasks.map((task: string, i: number) => (
          <li key={i} className="flex gap-3 text-sm text-slate-500 leading-snug font-medium">
            <span className="text-brand-600 font-bold">•</span> {task}
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

const MinorDepartmentCard = ({ icon: Icon, title, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="group relative p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300"
  >
    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all duration-300">
      <Icon className="w-6 h-6" />
    </div>
    
    <div className="flex flex-col">
      <h4 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h4>
    </div>
  </motion.div>
);

const STATIC_DEPARTMENTS = [
  { title: 'Academics', icon: GraduationCap },
  { title: 'Content', icon: FileText },
  { title: 'Digital', icon: Cpu },
  { title: 'Event', icon: Calendar },
  { title: 'Public Relations', icon: Users },
  { title: 'Sponsorship', icon: Handshake },
];

const ICON_MAP: any = {
  Search, Handshake, Microscope, MessageSquare, BookOpen, Edit3, Monitor, Calendar, Megaphone, DollarSign
};

export default function About_Page() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutData = async () => {
      setLoading(true);
      const path = 'about/current';
      try {
        const docRef = doc(db, 'about', 'current');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          console.warn('No about data found in Firestore');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };
    fetchAboutData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white text-center p-6 mt-20">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4 uppercase tracking-tight">Data coming soon!</h2>
          <p className="text-zinc-500 font-medium">The about page is currently being updated by our team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 md:py-24 px-6 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="max-w-5xl mb-20 md:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-6 md:mb-8 border border-brand-100 self-start">
              <Users className="w-3 h-3" /> About INFINITIUM
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85] uppercase mb-8 md:mb-12 text-left">
              {data.hero.title === "IGNITING CURIOSITY & FOSTERING EXCELLENCE" ? (
                <>IGNITING <br /> <span className="text-brand-600">CURIOSITY</span> <br /> & FOSTERING <br /> EXCELLENCE</>
              ) : data.hero.title}
            </h1>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="aspect-video md:aspect-[21/9] w-full bg-slate-100 rounded-2xl md:rounded-[2.5rem] overflow-hidden relative mb-8 md:mb-12 shadow-2xl shadow-brand-600/10"
            >
              <img 
                src={data.hero.image} 
                className="w-full h-full object-cover" 
                alt="Science Exploration"
              />
              <div className="absolute inset-0 bg-brand-600/10 mix-blend-multiply" />
            </motion.div>

            <p className="text-base md:text-xl text-slate-700 font-medium leading-relaxed max-w-4xl text-left md:text-justify">
              {data.hero.paragraph}
            </p>
          </motion.div>
        </div>

        {/* Scientific Domains Section */}
        <section className="mb-20 md:mb-32">
          <SectionTitle subtitle="Our core domains">Explore Our Scientific Domains</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            {[
              { title: 'Physics', text: 'Understanding the fundamental laws governing the universe.', icon: Microscope },
              { title: 'Chemistry', text: 'Exploring matter, materials, reactions, and modern applications.', icon: Search },
              { title: 'Computer Science', text: 'Bridging logic, computation, AI, and data-driven technologies.', icon: Monitor },
              { title: 'Electronics', text: 'Innovating with circuits, embedded systems, and smart technologies.', icon: Target },
              { title: 'Interdisciplinary Sciences', text: 'Connecting multiple scientific domains to solve real-world problems.', icon: Handshake }
            ].map((domain, i) => (
              <Card 
                key={i}
                icon={domain.icon} 
                title={domain.title} 
                text={domain.text}
                delay={0.1 * (i + 1)}
              />
            ))}
          </div>
        </section>

        {/* Objectives Section */}
        <section className="mb-20 md:mb-32">
          <SectionTitle subtitle="Vision for students">Objectives of INFINITIUM</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {data.objectives.map((obj: any, i: number) => {
              const icons = [Search, Lightbulb, Users, Handshake, Target, Globe, Trophy, Microscope, GraduationCap, Award];
              return (
                <Card 
                  key={obj.id}
                  icon={icons[i % icons.length]} 
                  title={obj.title} 
                  text={obj.text}
                  delay={0.1 * (i + 1)}
                />
              );
            })}
          </div>
        </section>

        {/* Impacts Section */}
        <section className="mb-20 md:mb-32 p-6 md:p-16 lg:p-24 bg-white rounded-3xl text-slate-950 overflow-hidden relative border border-slate-100 shadow-xl shadow-brand-950/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50 blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <SectionTitle subtitle="Transforming Lives">Impacts on Students</SectionTitle>
          <div className="relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
               {data.impacts.map((imp: any, i: number) => {
                 const icons = [Users, Calendar, Award, UserPlus, TrendingUp];
                 return (
                  <motion.div 
                    key={imp.id} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex flex-col items-start gap-4 p-6 bg-zinc-50/50 rounded-2xl border border-zinc-100 hover:border-brand-200 hover:bg-white hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-white border border-brand-100 rounded-xl flex items-center justify-center shrink-0 text-brand-600 shadow-sm">
                      {React.createElement(icons[i % icons.length], { className: "w-6 h-6" })}
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-black mb-2 uppercase tracking-tighter text-slate-900 leading-tight">{imp.title}</h4>
                      <p className="text-brand-600 text-[10px] md:text-xs font-black uppercase tracking-widest mb-3">{imp.text.split(' ')[0]} Impact</p>
                      <p className="text-slate-500 text-sm leading-relaxed font-medium">{imp.text}</p>
                    </div>
                  </motion.div>
                 );
               })}
            </div>
          </div>
        </section>

        {/* Departments Section */}
        <section className="mb-20 md:mb-32">
          <SectionTitle subtitle="Our specialized wings">Departments</SectionTitle>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {data.departments.map((dept: any, i: number) => {
              const icons = [BookOpen, Edit3, Monitor, Calendar, Megaphone, Handshake, Shield, Heart, Zap];
              return (
                <DepartmentCard 
                  key={dept.id}
                  icon={icons[i % icons.length] || BookOpen} 
                  title={dept.title}
                  aim={dept.aim}
                  tasks={dept.tasks}
                  delay={0.1 * (i + 1)}
                />
              );
            })}
          </div>

          <div className="bg-zinc-50/50 p-6 md:p-12 rounded-3xl border border-zinc-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
            <div className="mb-8">
              <h4 className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-[0.3em]">Other Departments</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {STATIC_DEPARTMENTS.map((dept, i) => (
                <MinorDepartmentCard key={i} {...dept} delay={0.1 * (i + 1)} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="p-8 md:p-24 bg-brand-50 border border-brand-100 rounded-3xl text-center overflow-hidden relative">
          <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 w-full flex justify-center">
             <span className="text-[9px] md:text-[10px] font-black uppercase text-brand-400 tracking-[0.4em]">Join the movement</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 md:mb-8 uppercase text-slate-900 tracking-tighter leading-[0.9] pt-8 md:pt-0">
              Unlock the wonders of <br className="hidden md:block" /> <span className="text-brand-600">Multidisciplinary Sciences</span>
            </h2>
            <p className="text-slate-600 max-w-3xl mx-auto mb-8 md:mb-12 font-medium leading-relaxed uppercase tracking-wide text-xs md:text-sm px-2 md:px-4">
              If you're a student at ARSD College with a curiosity for science, thirst for knowledge and a passion for discovery, join INFINITIUM! Together, let's shape a brighter future by B.Sc. (Prog.) students.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button className="w-full sm:w-auto px-10 py-5 bg-brand-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-950 transition-all hover:-translate-y-1">
                 Apply for Core Team
              </button>
              <Link to="/events" className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-brand-200 text-brand-800 rounded-xl flex items-center justify-center font-black uppercase text-xs tracking-widest hover:border-brand-600 transition-all hover:-translate-y-1">
                 Explore Events
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

