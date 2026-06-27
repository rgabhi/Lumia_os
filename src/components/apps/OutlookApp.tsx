import React, { useState } from 'react';
import { Mail, MailOpen, Send, ChevronRight, ArrowLeft, Trash2, Edit3, CheckCircle } from 'lucide-react';
import { Email } from '../../types';

interface OutlookAppProps {
  onClose: () => void;
  accentClass: string;
  emails: Email[];
  onMarkRead: (emailId: string) => void;
  onComposeEmail: (sender: string, subject: string, body: string) => void;
}

export default function OutlookApp({ onClose, accentClass, emails, onMarkRead, onComposeEmail }: OutlookAppProps) {
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  // Compose forms
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleReadEmail = (email: Email) => {
    setSelectedEmail(email);
    onMarkRead(email.id);
  };

  const handleSendCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    onComposeEmail(to, subject, body);
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setTo('');
      setSubject('');
      setBody('');
      setActiveTab('inbox');
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-black text-white p-6 select-none font-sans relative overflow-hidden">
      {/* App Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-light text-3xl tracking-tight uppercase">OUTLOOK</h1>
          <p className="text-xs text-gray-400 font-mono tracking-wider">OFFICE MAIL CLIENT</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'inbox' && !selectedEmail && (
            <button 
              onClick={() => setActiveTab('compose')}
              className="px-3 py-1 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors text-xs font-mono flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              COMPOSE
            </button>
          )}
          <button 
            onClick={() => {
              if (selectedEmail) {
                setSelectedEmail(null);
              } else if (activeTab === 'compose') {
                setActiveTab('inbox');
              } else {
                onClose();
              }
            }}
            className="px-3 py-1 border border-white hover:bg-white hover:text-black transition-colors text-xs font-mono"
          >
            {selectedEmail || activeTab === 'compose' ? 'BACK TO INBOX' : 'BACK'}
          </button>
        </div>
      </div>

      {selectedEmail ? (
        /* EMAIL READER VIEW */
        <div className="flex-1 flex flex-col min-h-0 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-4">
            <div className="w-10 h-10 bg-[#00abec] text-white flex items-center justify-center font-bold text-sm">
              {selectedEmail.sender[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm">{selectedEmail.sender}</p>
              <p className="text-xs text-gray-400 font-mono">Sent {selectedEmail.timestamp}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <h2 className="text-xl font-semibold tracking-tight leading-snug">{selectedEmail.subject}</h2>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{selectedEmail.body}</p>
          </div>
        </div>
      ) : activeTab === 'compose' ? (
        /* EMAIL COMPOSE FORM */
        <div className="flex-1 flex flex-col justify-between animate-[fadeIn_0.2s_ease-out]">
          {isSent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
              <h3 className="text-xl font-bold tracking-tight uppercase">Email Dispatched!</h3>
              <p className="text-xs text-gray-400 font-mono mt-1">Syncing with Outlook servers...</p>
            </div>
          ) : (
            <form onSubmit={handleSendCompose} className="flex-1 flex flex-col justify-between min-h-0">
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">To (Recipient Name/Address)</label>
                  <input 
                    type="text" 
                    value={to} 
                    onChange={e => setTo(e.target.value)}
                    required
                    placeholder="e.g. Sarah Connor, Alex Rivera"
                    className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-cyan-400 focus:outline-none p-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Subject</label>
                  <input 
                    type="text" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)}
                    required
                    placeholder="Subject of the email"
                    className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-cyan-400 focus:outline-none p-3 text-sm text-white"
                  />
                </div>
                <div className="flex-1 flex flex-col min-h-[150px]">
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Body</label>
                  <textarea 
                    value={body} 
                    onChange={e => setBody(e.target.value)}
                    required
                    placeholder="Type your message here..."
                    className="w-full flex-1 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-cyan-400 focus:outline-none p-3 text-sm text-white resize-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 mt-4 bg-[#00abec] hover:bg-cyan-500 text-white font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
              >
                <Send className="w-5 h-5" />
                SEND EMAIL
              </button>
            </form>
          )}
        </div>
      ) : (
        /* EMAIL INBOX LIST */
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {emails.length === 0 ? (
            <div className="text-center py-12 opacity-40 font-mono">
              <Mail className="w-12 h-12 mx-auto mb-4" />
              NO EMAILS FOUND
            </div>
          ) : (
            emails.map((email) => (
              <div 
                key={email.id}
                onClick={() => handleReadEmail(email)}
                className={`p-4 border bg-zinc-950 relative hover:border-zinc-700 cursor-pointer transition-all ${
                  email.read ? 'border-zinc-900 opacity-70' : 'border-[#00abec] font-semibold shadow-inner'
                }`}
              >
                {!email.read && (
                  <div className="absolute top-0 left-0 h-full w-1.5 bg-[#00abec]" />
                )}
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-2">
                    {email.read ? (
                      <MailOpen className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Mail className="w-4 h-4 text-cyan-400" />
                    )}
                    <span className="text-sm tracking-tight">{email.sender}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">{email.timestamp}</span>
                </div>
                <h3 className="text-sm font-semibold truncate mb-1">{email.subject}</h3>
                <p className="text-xs text-gray-400 truncate leading-snug">{email.body}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
