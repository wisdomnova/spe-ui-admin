"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Clock, 
  Youtube, 
  Image as ImageIcon,
  MoreVertical,
  X,
  PlusCircle,
  Link as LinkIcon,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  Loader2
} from "lucide-react";
import MediaPickerModal from "@/components/cms/MediaPickerModal";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image_url: string | null;
  youtube_url?: string | null;
  status: "Upcoming" | "Draft" | "Completed";
  description: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    image_url: "",
    youtube_url: "",
    status: "Draft",
    description: ""
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) setEvents(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const handleMediaSelect = (file: any) => {
    setFormData({ ...formData, image_url: file.url });
    setShowMediaPicker(false);
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.date) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const newEvent = await res.json();
        setEvents([newEvent, ...events]);
        setShowCreateModal(false);
        setFormData({ title: "", date: "", time: "", location: "", image_url: "", youtube_url: "", status: "Draft", description: "" });
      }
    } catch {} finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) setEvents(events.filter(e => e.id !== id));
    } catch {}
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.location || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <h2 className="text-4xl font-black text-gray-950 tracking-tight">Events Hub</h2>
            <p className="text-gray-500 font-bold mt-2">Create, manage and broadcast chapter events.</p>
          </div>

          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center gap-3"
          >
            <PlusCircle size={18} />
            Create Event
          </button>
        </header>

        {/* Search bar */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm mb-12 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Search events by title or location..." 
              className="w-full bg-gray-50 border-none rounded-3xl pl-14 pr-6 py-4 font-bold text-sm focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6">
              <Calendar size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-950">No events found</h3>
            <p className="text-gray-400 font-medium mt-1">
              {searchQuery ? "Try adjusting your search." : "Create your first event to get started."}
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, i) => (
              <motion.div
                layout
                key={event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden flex flex-col sm:flex-row group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500"
              >
                <div className="sm:w-1/2 aspect-video sm:aspect-auto relative overflow-hidden bg-gray-100">
                  <img src={event.image_url || '/placeholder.png'} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-6 left-6">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${
                      event.status === "Upcoming" ? "bg-green-500 text-white" :
                      event.status === "Draft" ? "bg-orange-500 text-white" : "bg-gray-500 text-white"
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>

                <div className="p-8 sm:w-1/2 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-gray-950 leading-tight uppercase tracking-tight">{event.title}</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-gray-500 font-bold text-xs uppercase tracking-wider">
                        <Calendar size={14} className="text-blue-500" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-3 text-gray-500 font-bold text-xs uppercase tracking-wider">
                        <MapPin size={14} className="text-blue-500" />
                        {event.location}
                      </div>
                      {event.youtube_url && (
                        <div className="flex items-center gap-3 text-red-500 font-bold text-xs uppercase tracking-wider">
                          <Youtube size={14} />
                          YouTube Link Added
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-50">
                    <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                      Edit Event <ChevronRight size={14} />
                    </button>
                    <div className="flex gap-2">
                      <button className="p-3 text-gray-300 hover:text-blue-600 transition-colors bg-gray-50 rounded-xl"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(event.id)} className="p-3 text-gray-300 hover:text-red-600 transition-colors bg-gray-50 rounded-xl"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        )}
      </motion.div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-blue-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 sm:p-10 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10 transition-colors">
                <div>
                  <h2 className="text-2xl font-black text-gray-950">Draft New Event</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Set the stage for your next session</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-950 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-6 sm:p-10 overflow-y-auto space-y-8 scrollbar-hide">
                {/* Image Picker Trigger */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Header Image</label>
                  <div 
                    onClick={() => setShowMediaPicker(true)}
                    className="w-full h-48 rounded-[2rem] border-2 border-dashed border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white hover:border-blue-200 transition-all group"
                  >
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto text-gray-300 mb-2 group-hover:text-blue-500 transition-colors" size={32} />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pick from Library</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Event Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Innovation Summit" 
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300 outline-none"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">YouTube Link (Optional)</label>
                    <div className="relative">
                      <Youtube className="absolute left-6 top-1/2 -translate-y-1/2 text-red-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="https://..." 
                        className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-6 py-4 font-bold text-sm focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300 outline-none"
                        value={formData.youtube_url}
                        onChange={e => setFormData({...formData, youtube_url: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-blue-500/10 outline-none"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Conference Hall / Zoom" 
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300 outline-none"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Short Description</label>
                  <textarea 
                    rows={4} 
                    placeholder="Provide context for attendees..." 
                    className="w-full bg-gray-50 border-none rounded-[2rem] px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300 resize-none outline-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-10 border-t border-gray-50 bg-white sticky bottom-0">
                <button 
                  onClick={handleCreateEvent}
                  disabled={submitting}
                  className="w-full bg-gray-950 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:bg-gray-800 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Confirm & Broadcast Event'}
                  {!submitting && <Check size={16} />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MediaPickerModal 
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}

