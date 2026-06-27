import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2 } from 'lucide-react';
import { Song, Intent } from '../../types';
import { SYSTEM_PLAYLIST } from '../../data';

interface SpotifyAppProps {
  onClose: () => void;
  accentClass: string;
  accentHex: string;
  activeSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onPauseSong: () => void;
  onTogglePlay: () => void;
  playbackProgress: number;
  onProgressChange: (val: number) => void;
  activeIntent?: Intent | null;
  onClearActiveIntent?: () => void;
}

export default function SpotifyApp({
  onClose,
  accentClass,
  accentHex,
  activeSong,
  isPlaying,
  onPlaySong,
  onPauseSong,
  onTogglePlay,
  playbackProgress,
  onProgressChange,
  activeIntent,
  onClearActiveIntent
}: SpotifyAppProps) {
  const songs = SYSTEM_PLAYLIST;

  // Handle incoming intents
  useEffect(() => {
    if (activeIntent) {
      if (activeIntent.action === 'android.intent.action.PLAY_MUSIC') {
        const extraSongName = activeIntent.extras?.songName;
        if (extraSongName) {
          const matched = songs.find(s => s.title.toLowerCase().includes(extraSongName.toLowerCase()));
          if (matched) {
            onPlaySong(matched);
          } else {
            onPlaySong(songs[0]);
          }
        } else {
          // If no songName extra, just play first song or toggle
          if (!isPlaying) {
            onPlaySong(activeSong || songs[0]);
          }
        }
      }
      onClearActiveIntent?.();
    }
  }, [activeIntent, onClearActiveIntent, isPlaying, activeSong, onPlaySong]);

  const handleNext = () => {
    const currentIndex = songs.findIndex(s => s.id === (activeSong?.id || songs[0].id));
    const nextIndex = (currentIndex + 1) % songs.length;
    onPlaySong(songs[nextIndex]);
  };

  const handlePrev = () => {
    const currentIndex = songs.findIndex(s => s.id === (activeSong?.id || songs[0].id));
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    onPlaySong(songs[prevIndex]);
  };

  const currentSong = activeSong || songs[0];

  return (
    <div className="h-full flex flex-col bg-black text-white p-6 select-none font-sans">
      {/* App Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1DB954] flex items-center justify-center rounded-none">
            <Music className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight uppercase">Spotify Live</h1>
            <p className="text-xs text-gray-400 font-mono">RETRO SYNTH ENGINE</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-3 py-1 border border-white hover:bg-white hover:text-black transition-colors text-xs font-mono"
        >
          BACK
        </button>
      </div>

      {/* Main Player Display */}
      <div className="flex-1 flex flex-col justify-center items-center py-4">
        {/* Album Art Representation */}
        <div className="w-56 h-56 bg-zinc-900 border-2 border-zinc-700 flex flex-col items-center justify-center p-6 relative group overflow-hidden mb-8">
          <div className={`absolute inset-0 opacity-10 transition-opacity ${isPlaying ? 'animate-pulse' : ''}`} style={{ backgroundColor: accentHex }} />
          <Music className={`w-24 h-24 text-zinc-500 transition-transform duration-1000 ${isPlaying ? 'scale-110 rotate-12' : ''}`} />
          {isPlaying && (
            <div className="absolute bottom-4 flex gap-1 items-end h-8">
              <span className="w-1 bg-[#1DB954] animate-[bounce_0.8s_infinite_0.1s] h-6"></span>
              <span className="w-1 bg-[#1DB954] animate-[bounce_0.6s_infinite_0.3s] h-4"></span>
              <span className="w-1 bg-[#1DB954] animate-[bounce_0.7s_infinite_0s] h-8"></span>
              <span className="w-1 bg-[#1DB954] animate-[bounce_0.5s_infinite_0.5s] h-3"></span>
            </div>
          )}
        </div>

        {/* Track Metadata */}
        <div className="text-center w-full max-w-sm mb-6">
          <h2 className="text-2xl font-bold tracking-tight truncate">{currentSong.title}</h2>
          <p className="text-sm text-gray-400 mt-1 uppercase font-mono">{currentSong.artist}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-sm mb-8">
          <input
            type="range"
            min="0"
            max="100"
            value={playbackProgress}
            onChange={(e) => onProgressChange(Number(e.target.value))}
            className="w-full accent-[#1DB954] cursor-pointer bg-zinc-800 h-1 outline-none"
          />
          <div className="flex justify-between text-xs text-gray-500 font-mono mt-2">
            <span>0:{String(Math.floor((playbackProgress / 100) * currentSong.duration)).padStart(2, '0')}</span>
            <span>0:{String(currentSong.duration).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-8 justify-center">
          <button 
            onClick={handlePrev}
            className="w-12 h-12 flex items-center justify-center border border-zinc-700 hover:border-white transition-colors"
          >
            <SkipBack className="w-6 h-6 text-white" />
          </button>
          
          <button 
            onClick={onTogglePlay}
            className={`w-16 h-16 flex items-center justify-center transition-all ${
              isPlaying ? 'bg-[#1DB954] text-black hover:scale-105' : 'bg-white text-black hover:scale-105'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-black text-black" />
            ) : (
              <Play className="w-8 h-8 fill-black text-black ml-1" />
            )}
          </button>

          <button 
            onClick={handleNext}
            className="w-12 h-12 flex items-center justify-center border border-zinc-700 hover:border-white transition-colors"
          >
            <SkipForward className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Playlist List */}
      <div className="border-t border-zinc-800 pt-6">
        <h3 className="text-xs font-mono text-gray-400 tracking-wider uppercase mb-4">Device Playlist</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {songs.map((song) => {
            const isThis = song.id === currentSong.id;
            return (
              <div 
                key={song.id}
                onClick={() => onPlaySong(song)}
                className={`p-3 flex items-center justify-between cursor-pointer border ${
                  isThis ? 'border-[#1DB954] bg-[#1DB954]/10' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 flex items-center justify-center ${isThis ? 'bg-[#1DB954] text-black' : 'bg-zinc-900 text-gray-400'}`}>
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium text-sm truncate ${isThis ? 'text-[#1DB954]' : 'text-white'}`}>{song.title}</p>
                    <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-mono">0:{song.duration}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
