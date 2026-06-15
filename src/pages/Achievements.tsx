import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, Award, Medal } from 'lucide-react';
import { getDocsCached } from '../lib/cachedFirestore';

export default function Achievements_Page() {
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const data = await getDocsCached('achievements', 'createdAt', 'desc');
        setAchievements(data);
      } catch (error) {
        console.error("Failed to load achievements", error);
      }
    };
    fetchAchievements();
  }, []);

  return (
    <div className="pt-10 pb-24 px-4 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-brand-100">
            <Trophy className="w-3 h-3" /> Hall of Fame
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-4 uppercase text-center">
            Our Success <br /> <span className="text-brand-600">Stories</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((item: any, idx: number) => (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bento-card group hover:shadow-2xl hover:shadow-brand-600/5 transition-all flex flex-col items-center text-center p-8 relative"
            >
              <span className="absolute top-4 right-4 text-[10px] bento-tag bg-slate-100 text-slate-500 font-black px-2 py-1 rounded">{item.date}</span>
              <div className="w-12 h-12 bg-brand-50 text-brand-500 rounded-xl flex items-center justify-center border border-brand-100 group-hover:scale-110 transition-transform mb-4 mt-2">
                <Trophy className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors uppercase tracking-tighter mb-2">{item.title}</h3>
              {item.description && item.description.trim().toLowerCase() !== item.title?.trim().toLowerCase() && (
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
