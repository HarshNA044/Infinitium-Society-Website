import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Copy, Check, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    image: string;
    date?: string;
    location?: string;
    type?: string;
  } | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, event }) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const eventUrl = `https://infinitium-arsd.vercel.app/events/${event.id}`;

  const messageText = `*🔥 ${event.title}*

Join us for this exciting event organized by *INFINITIUM Society, ARSD College!*

📅 *Date:* ${event.date || 'To be announced'}
📍 *Venue:* ${event.location || 'ARSD College'}

📷 *Event Banner:* ${event.image}

🔗 *Register & View Details Here:*
${eventUrl}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Join us for ${event.title} organized by INFINITIUM Society ARSD College!`,
          url: eventUrl,
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-100 shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/50">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#5ce1e6] bg-[#041a1a] px-2.5 py-1 rounded-full">
                  Share Event
                </span>
                <h3 className="text-base font-black text-zinc-900 mt-2 uppercase tracking-tight truncate max-w-[280px]">
                  {event.title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Event Card Preview */}
              <div className="flex gap-4 p-3 bg-zinc-50 rounded-2xl border border-zinc-100 items-center">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-16 h-16 rounded-xl object-cover border border-zinc-200/50 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-extrabold text-brand-600 uppercase tracking-widest">{event.type || 'INFINITIUM'}</p>
                  <p className="text-xs font-black text-zinc-800 uppercase tracking-tight truncate mt-0.5">{event.title}</p>
                  <p className="text-[10px] font-bold text-zinc-400 mt-0.5 truncate">{event.date || 'TBA'} • {event.location || 'ARSD College'}</p>
                </div>
              </div>

              {/* Share Options */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                {/* WhatsApp button */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="flex items-center justify-between w-full p-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 text-emerald-800 rounded-2xl transition-all font-black uppercase text-xs tracking-widest active:scale-[0.98]"
                >
                  <span className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Share via WhatsApp
                  </span>
                  <span className="text-[9px] bg-emerald-800 text-white px-2 py-0.5 rounded-full font-black">
                    Go
                  </span>
                </a>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-between w-full p-4 bg-zinc-55 hover:bg-zinc-100 border border-zinc-200/60 text-zinc-700 rounded-2xl transition-all font-black uppercase text-xs tracking-widest active:scale-[0.98]"
                >
                  <span className="flex items-center gap-3">
                    {copied ? <Check className="w-4 h-4 text-brand-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                    {copied ? 'Copied Link!' : 'Copy Event Link'}
                  </span>
                  {copied ? (
                    <span className="text-[9px] bg-brand-600 text-white px-2.5 py-0.5 rounded-full font-black animate-bounce">
                      Done
                    </span>
                  ) : (
                    <span className="text-[9px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full font-black">
                      Copy
                    </span>
                  )}
                </button>

                {/* System share if available */}
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    onClick={() => {
                      handleSystemShare();
                      onClose();
                    }}
                    className="flex items-center justify-between w-full p-4 bg-brand-50 hover:bg-brand-100/80 border border-brand-100 text-brand-800 rounded-2xl transition-all font-black uppercase text-xs tracking-widest active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-3">
                      <Share2 className="w-4 h-4 text-brand-600" />
                      More Share Options
                    </span>
                    <span className="text-[9px] bg-brand-800 text-white px-2 py-0.5 rounded-full font-black">
                      Open
                    </span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
