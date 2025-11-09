import { useState, useEffect, useRef, useCallback } from 'react';

interface AudioSettings {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
}

const DEFAULT_SETTINGS: AudioSettings = {
  sfxEnabled: true,
  musicEnabled: true,
  sfxVolume: 0.5,
  musicVolume: 0.3,
};

export const useAudio = () => {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    const stored = localStorage.getItem('audioSettings');
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('audioSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    // Initialize audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!settings.sfxEnabled || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.value = settings.sfxVolume;

    oscillator.start(ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    oscillator.stop(ctx.currentTime + duration);
  }, [settings.sfxEnabled, settings.sfxVolume]);

  const playCardDraw = useCallback(() => {
    playTone(400, 0.1, 'triangle');
    setTimeout(() => playTone(500, 0.05, 'triangle'), 50);
  }, [playTone]);

  const playCardPlay = useCallback(() => {
    playTone(600, 0.15, 'sine');
    setTimeout(() => playTone(700, 0.1, 'sine'), 80);
  }, [playTone]);

  const playWin = useCallback(() => {
    const notes = [523, 587, 659, 698, 784, 880];
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.3, 'sine'), i * 100);
    });
  }, [playTone]);

  const playBackgroundMusic = useCallback(() => {
    if (!settings.musicEnabled) {
      if (musicRef.current) {
        musicRef.current.pause();
      }
      return;
    }

    if (!musicRef.current) {
      musicRef.current = new Audio('/background-music.mp3');
      musicRef.current.loop = true;
      musicRef.current.volume = settings.musicVolume;
    }

    musicRef.current.volume = settings.musicVolume;
    musicRef.current.play().catch(err => console.log('Audio play failed:', err));
    
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
      }
    };
  }, [settings.musicEnabled, settings.musicVolume]);

  const toggleSfx = useCallback(() => {
    setSettings(prev => ({ ...prev, sfxEnabled: !prev.sfxEnabled }));
  }, []);

  const toggleMusic = useCallback(() => {
    setSettings(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  }, []);

  const setSfxVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, sfxVolume: volume }));
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, musicVolume: volume }));
  }, []);

  return {
    settings,
    playCardDraw,
    playCardPlay,
    playWin,
    playBackgroundMusic,
    toggleSfx,
    toggleMusic,
    setSfxVolume,
    setMusicVolume,
  };
};
