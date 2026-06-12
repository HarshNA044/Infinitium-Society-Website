import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomIn, X, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function Gallery_Page() {
  const [items, setItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('uploadDesc'); // uploadDesc, uploadAsc, dateDesc, dateAsc
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch gallery items
      const galleryPath = 'gallery';
      try {
        const q = query(collection(db, galleryPath), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, galleryPath);
      }

      // 2. Fetch events to populate dropdown (ordered by date desc, so options are nice and chronological)
      const eventsPath = 'events';
      try {
        const q = query(collection(db, eventsPath), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsData);
      } catch (error) {
        console.error("Failed to load events for gallery sorting", error);
      }
    };
    fetchData();
  }, []);

  // Filter and sort items to display
  const getProcessedItems = () => {
    let processed = [...items];

    // Filter by selected event
    if (selectedEventId !== 'all') {
      if (selectedEventId === 'none') {
        // Show only items that are not associated with any event
        processed = processed.filter(item => !item.eventId);
      } else {
        // Show items matching the selected eventId or matching the selected event title
        const selectedEvent = events.find(e => e.id === selectedEventId);
        processed = processed.filter(item => {
          return item.eventId === selectedEventId || (selectedEvent && item.title === selectedEvent.title);
        });
      }
    }

    // Sort items
    processed.sort((a, b) => {
      const getTimestamp = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'object' && val.seconds) return val.seconds * 1000 + (val.nanoseconds ? val.nanoseconds / 1000000 : 0);
        return new Date(val).getTime();
      };

      const getEventDateVal = (item: any) => {
        if (item.eventDate) {
          return new Date(item.eventDate).getTime();
        }
        return getTimestamp(item.createdAt);
      };

      switch (sortOption) {
        case 'uploadDesc':
          return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
        case 'uploadAsc':
          return getTimestamp(a.createdAt) - getTimestamp(b.createdAt);
        case 'dateDesc': {
          const dateB = getEventDateVal(b);
          const dateA = getEventDateVal(a);
          if (dateB !== dateA) return dateB - dateA;
          return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
        }
        case 'dateAsc': {
          const dateA = getEventDateVal(a);
          const dateB = getEventDateVal(b);
          if (dateA !== dateB) return dateA - dateB;
          return getTimestamp(a.createdAt) - getTimestamp(b.createdAt);
        }
        default:
          return 0;
      }
    });

    return processed;
  };

  const displayedItems = getProcessedItems();

  return (
    <div className="pt-10 pb-24 px-4 bg-white" id="gallery-container">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center max-w-2xl mx-auto flex flex-col items-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-4 uppercase text-center">
            Moments <br /> <span className="text-brand-600">Captured</span>
          </h1>
        </header>

        {/* Controls Panel */}
        <div className="mb-10 bg-zinc-50 border border-zinc-100 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm" id="gallery-controls">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Filter by Event */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest whitespace-nowrap pl-1">Filter Event</span>
              <div className="relative w-full sm:w-72">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full text-[11px] font-black uppercase tracking-wider text-slate-900 bg-white border-2 border-zinc-200 px-4 py-3.5 pr-10 rounded-2xl outline-none focus:border-brand-500 cursor-pointer transition-all appearance-none"
                  id="gallery-filter-event"
                >
                  <option value="all">📷 All Events</option>
                  <option value="none">Miscellaneous / Other</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} {ev.date ? `(${ev.date})` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Sort Order */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest whitespace-nowrap pl-1">Sort By</span>
              <div className="relative w-full sm:w-64">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full text-[11px] font-black uppercase tracking-wider text-slate-900 bg-white border-2 border-zinc-200 px-4 py-3.5 pr-10 rounded-2xl outline-none focus:border-brand-500 cursor-pointer transition-all appearance-none"
                  id="gallery-sort-order"
                >
                  <option value="uploadDesc">Newest Uploaded First</option>
                  <option value="uploadAsc">Oldest Uploaded First</option>
                  <option value="dateDesc">Event Date (Newest First)</option>
                  <option value="dateAsc">Event Date (Oldest First)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {displayedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedItems.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative"
                id={`gallery-item-${item.id || idx}`}
              >
                <div 
                  onClick={() => setSelectedImage(item.src)}
                  className="relative overflow-hidden rounded-2xl bg-slate-100 aspect-square cursor-zoom-in border border-slate-100 shadow-sm group-hover:shadow-xl transition-all"
                >
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
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{item.title}</h3>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {item.category && (
                        <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Highly structured tag badges for Event Name and Event Date */}
                  {item.eventDate && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5" id={`gallery-tags-${item.id || idx}`}>
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        Date: {item.eventDate}
                      </span>
                      {item.category === 'Events' && (
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-cyan-600 bg-cyan-50 border border-cyan-100 px-2.5 py-1 rounded-md uppercase tracking-wider max-w-[150px] truncate" >
                          Event: {item.title}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200" id="gallery-empty">
            <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">No Photos Found</p>
            <p className="text-xs text-zinc-400 mt-2 font-semibold uppercase tracking-wider">Try choosing another event filter or category.</p>
          </div>
        )}
      </div>

      {/* Full-screen Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 select-none" id="gallery-lightbox">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl cursor-zoom-out"
              id="gallery-lightbox-overlay"
            />
            
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white z-50 hover:scale-105 active:scale-95"
              id="gallery-lightbox-close"
              
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center z-10"
              id="gallery-lightbox-content"
            >
              <img 
                src={selectedImage} 
                className="max-w-full max-h-[85vh] md:max-h-[90vh] object-contain rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] border border-white/5" 
                alt="Enlarged gallery visual" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
