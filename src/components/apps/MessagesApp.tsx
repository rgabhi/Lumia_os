import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MoreVertical, Phone } from 'lucide-react';
import { Chat, Contact, Message, Intent } from '../../types';
import { INITIAL_CHATS, INITIAL_CONTACTS } from '../../data';

interface MessagesAppProps {
  onClose: () => void;
  accentClass: string;
  chats: Chat[];
  onSendMessage: (contactId: string, text: string) => void;
  activeIntent?: Intent | null;
  onClearActiveIntent?: () => void;
  onSendIntent?: (intent: Omit<Intent, 'id' | 'timestamp'>) => void;
}

export default function MessagesApp({ 
  onClose, 
  accentClass, 
  chats, 
  onSendMessage,
  activeIntent,
  onClearActiveIntent,
  onSendIntent
}: MessagesAppProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contacts = INITIAL_CONTACTS;

  // Handle incoming intent
  useEffect(() => {
    if (activeIntent) {
      if (activeIntent.action === 'android.intent.action.SENDTO') {
        const url = activeIntent.data || '';
        const phoneOrContact = url.replace('sms:', '');
        
        const matchedChat = chats.find(c => {
          const contact = contacts.find(con => con.id === c.contactId);
          return c.contactId === phoneOrContact || contact?.phone === phoneOrContact;
        });

        if (matchedChat) {
          setSelectedChatId(matchedChat.contactId);
        } else if (phoneOrContact) {
          const contact = contacts.find(c => c.phone === phoneOrContact || c.name.toLowerCase().includes(phoneOrContact.toLowerCase()));
          if (contact) {
            setSelectedChatId(contact.id);
          } else {
            setSelectedChatId(chats[0]?.contactId || null);
          }
        }

        if (activeIntent.extras?.text) {
          setInputText(activeIntent.extras.text);
        }
      } else if (activeIntent.action === 'android.intent.action.SEND') {
        if (activeIntent.extras?.text) {
          setInputText(activeIntent.extras.text);
          if (!selectedChatId) {
            setSelectedChatId(chats[0]?.contactId || null);
          }
        }
      }
      onClearActiveIntent?.();
    }
  }, [activeIntent, onClearActiveIntent, chats]);

  useEffect(() => {
    if (selectedChatId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedChatId, chats]);

  const handleSend = () => {
    if (!inputText.trim() || !selectedChatId) return;
    onSendMessage(selectedChatId, inputText.trim());
    setInputText('');
  };

  const getContactInfo = (id: string): Contact => {
    return contacts.find(c => c.id === id) || {
      id,
      name: 'Unknown',
      phone: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      status: 'Offline'
    };
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] text-white p-6 select-none font-sans relative overflow-hidden">
      {!selectedChatId ? (
        /* CHATS LIST VIEW */
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-8 mt-1">
            <div>
              <h1 className="font-light text-2xl tracking-tight uppercase text-white">Messages</h1>
              <p className="text-[10px] text-white/40 tracking-wider">SMS & MESSENGER</p>
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-1.5 border border-white/10 bg-white/5 rounded-none hover:border-white/35 hover:bg-white/10 text-[10px] font-sans flex items-center gap-1 active:scale-95 transition-all text-white/80"
            >
              Back
            </button>
          </div>

          {/* List of Conversations */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {chats.map((chat) => {
              const contact = getContactInfo(chat.contactId);
              const lastMsg = chat.messages[chat.messages.length - 1];
              return (
                <div 
                  key={chat.contactId}
                  onClick={() => setSelectedChatId(chat.contactId)}
                  className="p-4 border border-white/10 bg-white/5 hover:bg-white/10 rounded-none flex items-center justify-between cursor-pointer group transition-all duration-150 relative"
                >
                  {chat.unreadCount > 0 && (
                    <div className="absolute top-0 left-0 h-full w-1 bg-pink-600" />
                  )}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img 
                      src={contact.avatar} 
                      alt={contact.name} 
                      className="w-11 h-11 object-cover border border-white/10 rounded-none referrerPolicy='no-referrer'"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-white group-hover:text-pink-400 transition-colors truncate">{contact.name}</p>
                      <p className="text-xs text-white/50 truncate mt-0.5">{lastMsg ? lastMsg.text : 'No messages yet'}</p>
                    </div>
                  </div>

                  <div className="text-right ml-4 shrink-0">
                    <p className="text-[9px] text-white/30 font-sans">{lastMsg ? lastMsg.timestamp : ''}</p>
                    {chat.unreadCount > 0 && (
                      <span className="inline-block mt-1 bg-pink-600 text-white font-bold text-[9px] font-sans px-2 py-0.5 rounded-none">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* CONVERSATION ACTIVE DETAIL VIEW */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <button 
                onClick={() => setSelectedChatId(null)}
                className="p-2 border border-white/10 bg-white/5 rounded-none hover:border-white/30 hover:bg-white/10 transition-all mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <img 
                src={getContactInfo(selectedChatId).avatar} 
                alt={getContactInfo(selectedChatId).name} 
                className="w-10 h-10 object-cover border border-white/10 rounded-none referrerPolicy='no-referrer'"
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate text-white">{getContactInfo(selectedChatId).name}</p>
                <p className="text-[9px] text-pink-400 uppercase tracking-widest font-sans font-bold">
                  {getContactInfo(selectedChatId).status}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => {
                  onSendIntent?.({
                    action: 'android.intent.action.DIAL',
                    data: `tel:${getContactInfo(selectedChatId!).phone}`,
                    extras: { recipient: getContactInfo(selectedChatId!).name, immediate: true }
                  });
                }}
                className="p-2 border border-white/10 bg-white/5 hover:border-pink-500 hover:bg-pink-950/20 text-white/60 hover:text-pink-400 rounded-none transition-all"
                title="Call Contact"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-none transition-all text-white/40 hover:text-white">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Grid */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 flex flex-col no-scrollbar">
            {chats.find(c => c.contactId === selectedChatId)?.messages.map((msg) => {
              const isUser = msg.senderId === 'user';
              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col max-w-[80%] ${
                    isUser ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div className={`p-3 text-xs leading-relaxed ${
                    isUser 
                      ? 'bg-pink-600 text-white rounded-none border border-pink-700' 
                      : 'bg-white/5 border border-white/10 text-white/95 rounded-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-white/30 font-sans mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Send message..."
              className="flex-1 bg-white/5 border border-white/10 focus:border-white/20 focus:bg-white/10 focus:outline-none p-3.5 text-xs rounded-none text-white font-sans placeholder-white/30"
            />
            <button
              onClick={handleSend}
              className="p-3.5 bg-pink-600 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center text-white rounded-none"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
