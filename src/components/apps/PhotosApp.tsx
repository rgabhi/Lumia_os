import React, { useState } from 'react';
import { Image, Check, Smartphone, Trash2 } from 'lucide-react';
import { Photo, Intent } from '../../types';

interface PhotosAppProps {
  onClose: () => void;
  accentClass: string;
  photos: Photo[];
  onSetWallpaper: (url: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  activeIntent?: Intent | null;
  onClearActiveIntent?: () => void;
  onSendIntent?: (intent: Omit<Intent, 'id' | 'timestamp'>) => void;
}

export default function PhotosApp({ 
  onClose, 
  accentClass, 
  photos, 
  onSetWallpaper, 
  onDeletePhoto,
  activeIntent,
  onClearActiveIntent,
  onSendIntent
}: PhotosAppProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSetWallpaper = (url: string) => {
    onSetWallpaper(url);
    setStatusMsg('LOCK SCREEN WALLPAPER SET!');
    setTimeout(() => {
      setStatusMsg('');
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col bg-black text-white p-6 select-none font-sans relative overflow-hidden">
      {/* App Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-light text-3xl tracking-tight uppercase">PHOTOS</h1>
          <p className="text-xs text-gray-400 font-mono tracking-wider">CAMERA ROLL & WALLPAPERS</p>
        </div>
        <button 
          onClick={() => {
            if (selectedPhoto) {
              setSelectedPhoto(null);
            } else {
              onClose();
            }
          }}
          className="px-3 py-1 border border-white hover:bg-white hover:text-black transition-colors text-xs font-mono"
        >
          {selectedPhoto ? 'BACK TO GALLERY' : 'BACK'}
        </button>
      </div>

      {selectedPhoto ? (
        /* FULL SCREEN PHOTO VIEWER */
        <div className="flex-1 flex flex-col justify-between animate-[fadeIn_0.3s_ease-out]">
          {/* Photo Render */}
          <div className="flex-1 border border-zinc-900 bg-zinc-950 flex items-center justify-center p-2 relative overflow-hidden">
            <img 
              src={selectedPhoto.url} 
              alt="Full size view" 
              className="max-h-full max-w-full object-contain border border-zinc-800"
            />
            
            {statusMsg && (
              <div className="absolute top-4 inset-x-4 bg-green-600 text-white font-mono font-bold text-xs py-2 text-center tracking-widest animate-pulse uppercase">
                {statusMsg}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button
              onClick={() => handleSetWallpaper(selectedPhoto.url)}
              className="py-3 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold tracking-widest uppercase border border-zinc-850 hover:border-zinc-600 flex flex-col sm:flex-row items-center justify-center gap-1.5"
              title="Set as wallpaper"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Wallpaper</span>
            </button>

            <button
              onClick={() => {
                onSendIntent?.({
                  action: 'android.intent.action.SEND',
                  type: 'image/jpeg',
                  extras: {
                    url: selectedPhoto.url,
                    subject: 'Awesome Image from Lumia!',
                    text: `Hey, look at this cool photo I found on my Lumia device: ${selectedPhoto.url}`
                  }
                });
              }}
              className="py-3 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold tracking-widest uppercase border border-zinc-850 hover:border-zinc-600 flex flex-col sm:flex-row items-center justify-center gap-1.5"
              title="Share photo via Outlook"
            >
              <Image className="w-4 h-4 text-pink-400" />
              <span>Share</span>
            </button>
            
            <button
              onClick={() => {
                if (onDeletePhoto && selectedPhoto.isUserCaptured) {
                  if (confirm('Permanently delete this photo from your Camera Roll?')) {
                    onDeletePhoto(selectedPhoto.id);
                    setSelectedPhoto(null);
                  }
                } else {
                  alert('Default wallpapers cannot be deleted from the system library.');
                }
              }}
              className={`py-3 text-xs font-mono font-bold tracking-widest uppercase border flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                selectedPhoto.isUserCaptured 
                  ? 'bg-red-950/20 text-red-400 border-red-900/40 hover:bg-red-900/20' 
                  : 'bg-zinc-950 text-gray-600 border-zinc-900 cursor-not-allowed'
              }`}
              title="Delete photo"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      ) : (
        /* GALLERY GRID VIEW */
        <div className="flex-1 flex flex-col min-h-0 animate-[fadeIn_0.2s_ease-out]">
          {photos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 font-mono py-12">
              <Image className="w-12 h-12 mb-4" />
              CAMERA ROLL EMPTY
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-square relative overflow-hidden border border-zinc-900 hover:border-zinc-500 group active:scale-95 transition-all"
                  >
                    <img 
                      src={photo.url} 
                      alt="Gallery item" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 referrerPolicy='no-referrer'"
                    />
                    {photo.isUserCaptured && (
                      <span className="absolute top-2 right-2 bg-cyan-600 text-[8px] text-white font-mono font-bold px-1 uppercase tracking-wider">
                        Camera
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-[9px] text-gray-400 font-mono text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.date}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
