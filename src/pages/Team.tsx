import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Linkedin, Twitter, Github, Mail, Users } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function Team_Page() {
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [tenure, setTenure] = useState('2024-25');

  useEffect(() => {
    const fetchTeam = async () => {
      const path = 'members';
      try {
        const q = query(collection(db, path), orderBy('tenure', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        
        setAllMembers(data);
        if (data.length > 0) {
          const availableTenures = Array.from(new Set(data.map((m: any) => m.tenure))).sort().reverse() as string[];
          if (availableTenures.length > 0) {
            setTenure(availableTenures[0]);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    };
    fetchTeam();
  }, []);

  const getAbbreviatedCourse = (course: string) => {
    if (!course) return '';
    switch (course.trim()) {
      case 'B.Sc. Physical Science with Computer Science':
        return 'B.Sc. Phy. Sci. CS';
      case 'B.Sc. Physical Science with Chemistry':
        return 'B.Sc. Phy. Sci. Chemistry';
      case 'B.Sc. Physical Science with Electronics':
        return 'B.Sc. Phy. Sci. Electronics';
      case 'B.Sc. Applied Physical Science with Industrial Chemistry':
        return 'B.Sc. Applied Phy. Sci. IC';
      default:
        return course;
    }
  };

  const tenures = Array.from(new Set(allMembers.map((m: any) => m.tenure))).sort().reverse() as string[];
  const filteredMembers = allMembers.filter((m: any) => m.tenure === tenure);

  return (
    <div className="pt-10 pb-24 px-4 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-brand-100">
            <Users className="w-3 h-3" /> Core Team
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4 uppercase text-center">
            The Minds Behind <br /> <span className="text-brand-600">INFINITIUM</span>
          </h1>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
             <div className="sticky top-32 space-y-6">
                <div className="p-8 bg-zinc-50 rounded-xl border border-zinc-100 shadow-sm transition-all hover:shadow-xl hover:shadow-brand-600/5">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 pl-1">Select Tenure</h3>
                   <div className="relative">
                      <select 
                        value={tenure}
                        onChange={(e) => setTenure(e.target.value)}
                        className="w-full bg-white border-2 border-zinc-100 rounded-xl px-6 py-4 text-sm font-black text-slate-900 appearance-none focus:border-brand-600 outline-none transition-all cursor-pointer shadow-sm"
                      >
                        {tenures.map((t, idx) => (
                          <option key={t} value={t}>
                            {idx === 0 ? `Current (${t})` : `Tenure ${t}`}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                         <Users className="w-4 h-4" />
                      </div>
                   </div>

                </div>
             </div>
          </aside>

          {/* Members Grid */}
          <div className="flex-1">
             <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                   {tenure === tenures[0] ? 'Current Tenure' : `Tenure ${tenure}`}
                </h2>
                <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
                   {filteredMembers.length} Team Members
                </span>
             </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMembers.map((member: any, idx: number) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group flex flex-col bg-white rounded-xl border border-zinc-200/60 p-3 transition-all duration-300 shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.22)] hover:border-brand-500/20 relative overflow-hidden"
                  >
                    {/* Decorative gradient semi-circle corner patterns with increased opacity */}
                    {/* Top-left corners */}
                    <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-brand-500/32 via-brand-500/12 to-transparent rounded-br-full pointer-events-none group-hover:scale-115 transition-all duration-500 origin-top-left z-0" />
                    <div className="absolute -top-6 -left-6 w-14 h-14 rounded-full bg-brand-500/20 blur-[5px] pointer-events-none group-hover:scale-125 transition-all duration-500 z-0" />
                    
                    {/* Bottom-right corners */}
                    <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-brand-600/28 via-brand-500/10 to-transparent rounded-tl-full pointer-events-none group-hover:scale-115 transition-all duration-500 origin-bottom-right z-0" />
                    <div className="absolute -bottom-6 -right-6 w-14 h-14 rounded-full bg-brand-600/18 blur-[5px] pointer-events-none group-hover:scale-125 transition-all duration-500 z-0" />
                    
                    {/* Soft ambient inner card background overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.02] to-brand-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

                    <div className="relative overflow-hidden rounded-lg bg-zinc-100 aspect-square mb-2.5 z-10">
                      <img 
                        src={member.image} 
                        alt={member.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      {member.linkedin && (
                        <a 
                          href={member.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-2 w-6 h-6 bg-white/95 backdrop-blur-sm text-brand-600 rounded flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all shadow-md z-10"
                          
                        >
                          <Linkedin className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    
                    <div className="flex flex-col flex-grow text-center z-10">
                      <h3 className="text-xs font-black text-slate-900 group-hover:text-brand-600 transition-colors uppercase tracking-tight leading-snug line-clamp-2">
                        {member.name}
                      </h3>
                      
                      <div className="mt-1 mb-1.5">
                        <span className="text-[8px] text-brand-600 font-extrabold uppercase tracking-[0.15em] bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full inline-block">
                          {member.role}
                        </span>
                      </div>

                      <div className="mt-auto space-y-0.5">
                        {member.year ? (
                          <p className="text-[9px] text-slate-600 font-bold tracking-wider uppercase">
                            {member.year}
                          </p>
                        ) : (
                          <p className="text-[9px] text-zinc-300 font-bold tracking-wider uppercase select-none">
                            —
                          </p>
                        )}
                        {member.course ? (
                          <p className="text-[9px] text-zinc-400 font-semibold tracking-wide truncate uppercase">
                            {getAbbreviatedCourse(member.course)}
                          </p>
                        ) : (
                          <p className="text-[9px] text-zinc-300 font-semibold tracking-wide uppercase select-none">
                            —
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredMembers.length === 0 && (
               <div className="py-20 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-100 text-center flex flex-col items-center">
                  <Users className="w-12 h-12 text-zinc-200 mb-4" />
                  <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No team members found for this tenure.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
