import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ZoomIn } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function Gallery_Page() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchGallery = async () => {
      const path = 'gallery';
      try {
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    };
    fetchGallery();
  }, []);

  return (
    <div className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-24 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85] mb-8 uppercase text-left">
              Moments <br /> <span className="text-brand-600">Captured</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium max-w-xs text-sm leading-relaxed uppercase tracking-widest text-right">
            Visual glimpses into INFINITIUM's fests, field trips, and classroom seminars.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative"
            >
              <div className="relative overflow-hidden rounded-2xl bg-slate-100 aspect-square cursor-zoom-in border border-slate-100 shadow-sm group-hover:shadow-xl transition-all">
                <img 
                  src={item.src} 
                  className="w-full h-full object-cover brightness-90 group-hover:scale-110 transition-all duration-700" 
                  alt={item.title} 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 text-white flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                     <ZoomIn className="w-5 h-5 text-brand-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Enlarge</span>
                   </div>
                </div>
              </div>
              <div className="mt-6 px-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{item.title}</h3>
                  <div className="flex flex-col items-end gap-1">
                    {item.category && (
                      <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                        {item.category}
                      </span>
                    )}
                    {item.eventDate && (
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.eventDate}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
