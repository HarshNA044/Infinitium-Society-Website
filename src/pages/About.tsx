import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Target, Users, Lightbulb, GraduationCap, 
  Search, Handshake, Microscope, MessageSquare,
  BookOpen, Edit3, Monitor, Calendar, Megaphone, DollarSign,
  TrendingUp, Award, UserPlus
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const SectionTitle = ({ children, subtitle }: { children: React.ReactNode, subtitle?: string }) => (
  <div className="mb-16">
    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2 italic">{children}</h2>
    {subtitle && <p className="text-sm font-bold text-brand-600 uppercase tracking-[0.3em] font-sans">{subtitle}</p>}
  </div>
);

const Card = ({ icon: Icon, title, text, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="p-8 bg-white border border-zinc-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-brand-100 transition-all group"
  >
    <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-black text-zinc-900 mb-3 tracking-tight uppercase italic">{title}</h3>
    <p className="text-sm text-zinc-500 leading-relaxed font-medium">{text}</p>
  </motion.div>
);

const DepartmentCard = ({ icon: Icon, title, aim, tasks, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="p-8 bg-brand-950 text-white rounded-[3rem] relative overflow-hidden border border-brand-900"
  >
    <div className="absolute top-0 right-0 p-8 opacity-5">
      <Icon className="w-32 h-32 text-brand-300" />
    </div>
    <div className="relative z-10">
      <div className="w-12 h-12 bg-brand-500/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-brand-500/20 text-brand-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-2xl font-black mb-4 tracking-tighter uppercase italic text-brand-300">{title} Department</h3>
      <p className="text-[10px] text-brand-400 font-black uppercase tracking-[0.2em] mb-6">Aim: {aim}</p>
      <ul className="space-y-3">
        {tasks.map((task: string, i: number) => (
          <li key={i} className="flex gap-3 text-sm text-brand-100/60 leading-snug font-medium">
            <span className="text-brand-500 font-bold">•</span> {task}
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-center p-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4 uppercase italic tracking-tight">Data coming soon!</h2>
          <p className="text-zinc-500 font-medium">The about page is currently being updated by our team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-brand-100">
              <Users className="w-3 h-3" /> About INFINITIUM
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85] italic uppercase mb-10">
              {data.hero.title.split(' & ').map((part: string, i: number) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  {part.includes('CURIOSITY') ? (
                    <>IGNITING <br /> <span className="text-brand-600">CURIOSITY</span></>
                  ) : part}
                </React.Fragment>
              ))}
              {/* Fallback to original text if split logic is too simple */}
              {data.hero.title === "IGNITING CURIOSITY & FOSTERING EXCELLENCE" ? (
                <>IGNITING <br /> <span className="text-brand-600">CURIOSITY</span> <br /> & FOSTERING <br /> EXCELLENCE</>
              ) : data.hero.title}
            </h1>
            <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
              {data.hero.subtitle}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square bg-slate-100 rounded-[4rem] overflow-hidden relative"
          >
            <img 
              src={data.hero.image} 
              className="w-full h-full object-cover grayscale brightness-75" 
              alt="Science Exploration"
            />
            <div className="absolute inset-0 bg-brand-600/20 mix-blend-multiply" />
          </motion.div>
        </div>

        {/* Objectives Section */}
        <section className="mb-32">
          <SectionTitle subtitle="Vision for students">Objectives of INFINITIUM</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.objectives.map((obj: any, i: number) => {
              const icons = [Search, Handshake, Microscope, MessageSquare];
              return (
                <Card 
                  key={obj.id}
                  icon={icons[i] || Search} 
                  title={obj.title} 
                  text={obj.text}
                  delay={0.1 * (i + 1)}
                />
              );
            })}
          </div>
        </section>

        {/* Impacts Section */}
        <section className="mb-32 p-12 md:p-20 bg-brand-950 rounded-[4rem] text-white overflow-hidden relative border border-brand-900">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <SectionTitle subtitle="Transforming Lives">Impacts on Students</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            <div className="grid grid-cols-1 gap-12">
               {data.impacts.map((imp: any, i: number) => {
                 const icons = [TrendingUp, Handshake, Award, UserPlus];
                 return (
                  <div key={imp.id} className="flex gap-6">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 text-brand-400">
                      {React.createElement(icons[i] || TrendingUp, { className: "w-6 h-6" })}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2 uppercase italic tracking-tight">{imp.title}</h4>
                      <p className="text-brand-100/60 text-sm leading-relaxed font-medium">{imp.text}</p>
                    </div>
                  </div>
                 );
               })}
            </div>
          </div>
        </section>

        {/* Departments Section */}
        <section className="mb-32">
          <SectionTitle subtitle="Our specialized wings">Departments</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.departments.map((dept: any, i: number) => {
              const icons = [BookOpen, Edit3, Monitor, Calendar, Megaphone, Handshake];
              return (
                <DepartmentCard 
                  key={dept.id}
                  icon={icons[i] || BookOpen} 
                  title={dept.title}
                  aim={dept.aim}
                  tasks={dept.tasks}
                  delay={0.1 * (i + 1)}
                />
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="p-12 md:p-24 bg-brand-50 border border-brand-100 rounded-[4rem] text-center overflow-hidden relative">
          <div className="absolute top-0 left-0 p-8">
             <span className="text-[10px] font-black uppercase text-brand-400 tracking-[0.4em]">Join the movement</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-8 italic uppercase text-slate-900 tracking-tighter">
            Unlock the wonders of <span className="text-brand-600">Physical Sciences</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed uppercase tracking-wide text-sm px-4">
            If you're a student at ARSD College with a thirst for knowledge and a passion for discovery, join INFINITIUM today! Together, let's shape a brighter future.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-10 py-5 bg-brand-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-950 transition-colors">
               Apply for Core Team
            </button>
            <Link to="/events" className="px-10 py-5 bg-white border-2 border-brand-200 text-brand-800 rounded-3xl flex items-center justify-center font-black uppercase text-xs tracking-widest hover:border-brand-600 transition-all">
               Explore Events
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

