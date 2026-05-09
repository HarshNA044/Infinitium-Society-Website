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

  const tenures = Array.from(new Set(allMembers.map((m: any) => m.tenure))).sort().reverse() as string[];
  const filteredMembers = allMembers.filter((m: any) => m.tenure === tenure);

  return (
    <div className="py-24 px-4 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
             <div className="sticky top-32 space-y-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-brand-100">
                    <Users className="w-3 h-3" /> Core Team
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-[0.85] uppercase mb-6 text-left">
                    The Minds Behind <br /> <span className="text-brand-600">INFINITIUM</span>
                  </h1>
                  <p className="text-slate-500 font-medium text-xs leading-relaxed uppercase tracking-widest">
                    Dedicated student leaders building the future of ARSD College.
                  </p>
                </div>

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
                   <p className="mt-4 text-[9px] text-slate-400 font-bold leading-relaxed px-1">
                      Explore the legacy of INFINITIUM through its past and present core members.
                   </p>
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

             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {filteredMembers.map((member: any, idx: number) => (
                 <motion.div
                   key={member.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   className="group"
                 >
                   <div className="relative overflow-hidden rounded-xl bg-zinc-50 aspect-square mb-4 border border-zinc-100 shadow-sm transition-all hover:shadow-xl hover:shadow-brand-600/10">
                     <img 
                       src={member.image} 
                       alt={member.name} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" 
                       referrerPolicy="no-referrer"
                     />
                     
                     <div className="absolute top-3 right-3 z-20">
                       {member.linkedin && (
                         <a 
                           href={member.linkedin} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="w-8 h-8 bg-white/90 backdrop-blur-md text-brand-600 rounded-lg flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all border border-white/50 shadow-lg"
                         >
                           <Linkedin className="w-4 h-4" />
                         </a>
                       )}
                     </div>
                   </div>
                   <div className="px-1 text-center">
                     <h3 className="text-sm font-black text-slate-900 group-hover:text-brand-600 transition-all uppercase tracking-tighter leading-tight truncate">
                       {member.name}
                     </h3>
                     <p className="text-[8px] text-brand-600 font-black uppercase tracking-[0.2em] mt-1 bg-brand-50 inline-block px-2 py-0.5 rounded-full">
                       {member.role}
                     </p>
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
