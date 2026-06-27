import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, CheckCircle } from 'lucide-react';
import { CalendarEvent } from '../../types';

interface CalendarAppProps {
  onClose: () => void;
  accentClass: string;
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
}

export default function CalendarApp({ onClose, accentClass, events, onAddEvent }: CalendarAppProps) {
  const [selectedDate, setSelectedDate] = useState('2026-06-27');
  const [activeTab, setActiveTab] = useState<'view' | 'add'>('view');

  // Add event Form
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('12:00');
  const [location, setLocation] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Generate days in June 2026 (Starts on Monday June 1st, 2026)
  const juneDays = Array.from({ length: 30 }, (_, i) => i + 1);

  const handleDaySelect = (dayNum: number) => {
    const formatted = `2026-06-${dayNum.toString().padStart(2, '0')}`;
    setSelectedDate(formatted);
  };

  const getDayEvents = (dateStr: string) => {
    return events.filter(e => e.date === dateStr);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time.trim()) return;
    onAddEvent({
      title: title.trim(),
      date: selectedDate,
      time,
      location: location.trim() || undefined
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setTitle('');
      setTime('12:00');
      setLocation('');
      setActiveTab('view');
    }, 1200);
  };

  return (
    <div className="h-full flex flex-col bg-black text-white p-6 select-none font-sans relative overflow-hidden">
      {/* App Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-light text-3xl tracking-tight uppercase">CALENDAR</h1>
          <p className="text-xs text-gray-400 font-mono tracking-wider">JUNE 2026</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'view' && (
            <button 
              onClick={() => setActiveTab('add')}
              className="px-3 py-1 border border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-black transition-colors text-xs font-mono flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD EVENT
            </button>
          )}
          <button 
            onClick={() => {
              if (activeTab === 'add') {
                setActiveTab('view');
              } else {
                onClose();
              }
            }}
            className="px-3 py-1 border border-white hover:bg-white hover:text-black transition-colors text-xs font-mono"
          >
            {activeTab === 'add' ? 'CANCEL' : 'BACK'}
          </button>
        </div>
      </div>

      {activeTab === 'view' ? (
        <div className="flex-1 flex flex-col justify-between min-h-0 animate-[fadeIn_0.2s_ease-out]">
          {/* Calendar Grid Section */}
          <div className="mb-6">
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold font-mono text-gray-500 mb-2 uppercase tracking-widest">
              <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
            </div>
            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {juneDays.map((dayNum) => {
                const formattedDate = `2026-06-${dayNum.toString().padStart(2, '0')}`;
                const isSelected = formattedDate === selectedDate;
                const dayEvents = getDayEvents(formattedDate);
                const isToday = dayNum === 27; // June 27 is current time in metadata

                return (
                  <button
                    key={dayNum}
                    onClick={() => handleDaySelect(dayNum)}
                    className={`aspect-square flex flex-col items-center justify-center border relative transition-all active:scale-90 ${
                      isSelected 
                        ? 'bg-lime-400 text-black border-lime-400 font-bold' 
                        : isToday 
                        ? 'border-lime-500 text-lime-400 font-bold bg-lime-950/20' 
                        : 'border-zinc-900 hover:border-zinc-700 hover:bg-zinc-950 text-white'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {dayEvents.length > 0 && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-black' : 'bg-lime-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Events Section */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-zinc-900 pt-4">
            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
              Events for June {selectedDate.split('-')[2]}, 2026
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {getDayEvents(selectedDate).length === 0 ? (
                <p className="text-xs text-gray-500 italic text-center py-6 font-mono">No events scheduled.</p>
              ) : (
                getDayEvents(selectedDate).map((event) => (
                  <div key={event.id} className="p-3 border border-zinc-850 bg-zinc-950 flex flex-col gap-1 hover:border-zinc-700">
                    <h4 className="font-semibold text-sm text-lime-400">{event.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{event.time}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ADD EVENT VIEW */
        <div className="flex-1 flex flex-col justify-between animate-[fadeIn_0.2s_ease-out]">
          {isSaved ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <CheckCircle className="w-16 h-16 text-lime-400 mb-4 animate-bounce" />
              <h3 className="text-xl font-bold tracking-tight uppercase">Event Scheduled</h3>
              <p className="text-xs text-gray-400 font-mono mt-1">Updating live tiles...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveEvent} className="flex-1 flex flex-col justify-between min-h-0">
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Date</span>
                  <div className="p-3 border border-zinc-850 bg-zinc-950 text-sm font-mono text-gray-300">
                    June {selectedDate.split('-')[2]}, 2026
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Event Title</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Sync Call, Dinner Party"
                    className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-lime-400 focus:outline-none p-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Time</label>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={e => setTime(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-lime-400 focus:outline-none p-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Location (Optional)</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Meeting Room 4B"
                    className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-lime-400 focus:outline-none p-3 text-sm text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-lime-400 text-black font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                SAVE CALENDAR EVENT
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
