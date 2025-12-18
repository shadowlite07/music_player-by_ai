
import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { useAudioPlayer, AudioPlayer, AudioSource, createAudioPlayer } from 'expo-audio';
import * as MediaLibrary from 'expo-media-library';
import { StorageService } from '../services/storage';
import { Track, Playlist, RepeatMode, AudioSettings, EqualizerBand, Preset } from '../constants/types';

interface PlayerContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    queue: Track[];
    playlists: Playlist[];
    playTrack: (track: Track) => Promise<void>;
    playFromQueue: (index: number, startPosition?: number) => Promise<void>;
    togglePlayback: () => Promise<void>;
    seekTo: (position: number) => Promise<void>;
    nextTrack: () => Promise<void>;
    previousTrack: () => Promise<void>;
    addToQueue: (tracks: Track[]) => void;
    clearQueue: () => void;
    setQueue: (tracks: Track[]) => void;
    removeFromQueue: (index: number) => void;
    reorderQueue: (from: number, to: number) => void;
    loadLibrary: () => Promise<void>;
    allTracks: Track[];
    createPlaylist: (name: string) => Promise<void>;
    deletePlaylist: (id: string) => Promise<void>;
    renamePlaylist: (id: string, newName: string) => Promise<void>;
    removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
    moveTrackInPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => Promise<void>;
    addToPlaylist: (playlistId: string, track: Track) => Promise<void>;
    volume: number;
    isMuted: boolean;
    setVolume: (vol: number) => Promise<void>;
    toggleMute: () => Promise<void>;
    audioSettings: AudioSettings;
    updateAudioSettings: (settings: Partial<AudioSettings>) => void;
    equalizerBands: EqualizerBand[];
    updateEqualizerBand: (frequency: number, gain: number) => void;
    presets: Preset[];
    applyPreset: (presetId: string) => void;
}

interface PlaybackProgressType {
    position: number;
    duration: number;
}

const PlayerContext = createContext<PlayerContextType | null>(null);
const PlaybackContext = createContext<PlaybackProgressType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [queue, setQueueState] = useState<Track[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [allTracks, setAllTracks] = useState<Track[]>([]);

    const [audioSettings, setAudioSettings] = useState<AudioSettings>({
        crossfade: false,
        crossfadeDuration: 3000,
        normalizeVolume: false,
        quality: 'high',
    });

    const [equalizerBands, setEqualizerBands] = useState<EqualizerBand[]>([
        { frequency: 60, label: '60Hz', gain: 0 },
        { frequency: 230, label: '230Hz', gain: 0 },
        { frequency: 910, label: '910Hz', gain: 0 },
        { frequency: 3600, label: '3.6kHz', gain: 0 },
        { frequency: 14000, label: '14kHz', gain: 0 },
    ]);

    const presets: Preset[] = [
        { id: 'flat', name: 'Flat', gains: [0, 0, 0, 0, 0] },
        { id: 'bass', name: 'Bass Boost', gains: [6, 4, 0, 0, -2] },
        { id: 'treble', name: 'Treble Boost', gains: [-2, 0, 2, 4, 6] },
        { id: 'rock', name: 'Rock', gains: [4, 2, -2, 3, 5] },
        { id: 'vocal', name: 'Vocal', gains: [-2, 2, 5, 3, -1] },
    ];

    const [volume, setVolumeState] = useState(1.0);
    const [isMuted, setIsMuted] = useState(false);

    const soundRef = useRef<AudioPlayer | null>(null);
    const isLoadingRef = useRef(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        restoreState();
        return () => {
            if (soundRef.current) {
                soundRef.current.pause();
                soundRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (isInitialized && queue.length > 0) StorageService.saveQueue(queue);
        if (isInitialized && currentIndex !== null) StorageService.saveLastState(currentIndex, position);
    }, [queue, currentIndex, isInitialized]);

    useEffect(() => {
        if (isInitialized) StorageService.savePlaylists(playlists);
    }, [playlists, isInitialized]);

    async function restoreState() {
        try {
            const savedQueue = await StorageService.getQueue();
            const savedPlaylists = await StorageService.getPlaylists();
            const savedLibrary = await StorageService.getLibrary();
            const { index, position: savedPos } = await StorageService.getLastState();

            if (savedLibrary.length > 0) setAllTracks(savedLibrary);
            if (savedQueue.length > 0) {
                setQueueState(savedQueue);
                if (index >= 0 && index < savedQueue.length) {
                    setCurrentIndex(index);
                    setPosition(savedPos);
                }
            }
            if (savedPlaylists.length > 0) setPlaylists(savedPlaylists);
        } catch (e) {
            console.error("Failed to restore state", e);
        } finally {
            setIsInitialized(true);
        }
    }

    async function loadLibrary() {
        try {
            const permission = await MediaLibrary.requestPermissionsAsync();
            if (!permission.granted) return;

            let media = await MediaLibrary.getAssetsAsync({
                mediaType: 'audio',
                first: 1000,
                sortBy: ['creationTime'],
            });

            const tracks: Track[] = media.assets.map(asset => ({
                id: asset.id,
                uri: asset.uri,
                filename: asset.filename,
                duration: asset.duration,
                title: asset.filename.replace(/\.[^/.]+$/, ""),
            }));

            setAllTracks(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(tracks)) {
                    StorageService.saveLibrary(tracks);
                    return tracks;
                }
                return prev;
            });
        } catch (e) {
            console.error("Library Load Error:", e);
        }
    }

    async function unloadSound() {
        if (soundRef.current) {
            soundRef.current.pause();
            soundRef.current = null;
        }
    }

    async function playFromQueue(index: number, startPosition: number = 0) {
        if (index < 0 || index >= queue.length) return;
        if (isLoadingRef.current) return;

        try {
            isLoadingRef.current = true;
            setCurrentIndex(index);
            setIsPlaying(true);

            const oldSound = soundRef.current;
            const isCrossing = audioSettings.crossfade && oldSound && isPlaying;

            if (!isCrossing) await unloadSound();

            const track = queue[index];
            let targetVolume = isMuted ? 0 : volume;
            if (audioSettings.normalizeVolume) targetVolume *= 0.8;

            const initialVolume = isCrossing ? 0 : targetVolume;
            const newPlayer = createAudioPlayer(track.uri);
            newPlayer.volume = initialVolume;
            newPlayer.muted = isMuted;

            if (startPosition > 0) newPlayer.seekTo(startPosition / 1000);
            newPlayer.play();
            soundRef.current = newPlayer;

            if (newPlayer.duration) setDuration(newPlayer.duration * 1000);

            const statusPoller = setInterval(() => {
                if (!soundRef.current || soundRef.current !== newPlayer) {
                    clearInterval(statusPoller);
                    return;
                }
                const currentTimeMs = newPlayer.currentTime * 1000;
                setPosition(currentTimeMs);
                setIsPlaying(newPlayer.playing);
                if (newPlayer.duration) setDuration(newPlayer.duration * 1000);

                if (Math.abs(currentTimeMs - (newPlayer.duration * 1000)) < 500 && newPlayer.duration > 0 && !newPlayer.playing) {
                    clearInterval(statusPoller);
                    nextTrack();
                }
            }, 500);

            if (isCrossing && oldSound) {
                const stepTime = 100;
                const fadeDuration = audioSettings.crossfadeDuration;
                const steps = Math.floor(fadeDuration / stepTime);
                const volStep = targetVolume / steps;
                let currentStep = 0;

                const fade = async () => {
                    currentStep++;
                    const fadeOutVol = Math.max(0, targetVolume - (volStep * currentStep));
                    const fadeInVol = Math.min(targetVolume, 0 + (volStep * currentStep));

                    try {
                        if (currentStep <= steps) {
                            oldSound.volume = fadeOutVol;
                            newPlayer.volume = fadeInVol;
                            setTimeout(fade, stepTime);
                        } else {
                            oldSound.pause();
                            if (!isMuted) newPlayer.volume = targetVolume;
                        }
                    } catch (error) {
                        try { oldSound.pause(); } catch (e) { }
                    }
                };
                fade();
            }
        } catch (e) {
            console.error("Error playing sound", e);
        } finally {
            isLoadingRef.current = false;
        }
    }

    const togglePlayback = async () => {
        if (soundRef.current) {
            const isNowPlaying = soundRef.current.playing;
            setIsPlaying(!isNowPlaying);
            if (isNowPlaying) soundRef.current.pause();
            else soundRef.current.play();
        } else if (queue.length > 0 && currentIndex !== null) {
            playFromQueue(currentIndex, position);
        } else if (queue.length > 0) {
            playFromQueue(0);
        }
    };

    const seekTo = async (millis: number) => {
        if (soundRef.current) {
            soundRef.current.seekTo(millis / 1000);
            setPosition(millis);
        }
    };

    const setVolume = async (vol: number) => {
        setVolumeState(vol);
        if (isMuted) setIsMuted(false);
        if (soundRef.current) soundRef.current.volume = vol;
    };

    const toggleMute = async () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        if (soundRef.current) soundRef.current.muted = newMuted;
    };

    const nextTrack = async () => {
        if (currentIndex !== null && currentIndex < queue.length - 1) {
            await playFromQueue(currentIndex + 1);
        }
    };

    const previousTrack = async () => {
        if (currentIndex !== null && currentIndex > 0) {
            await playFromQueue(currentIndex - 1);
        } else {
            seekTo(0);
        }
    };

    const addToQueue = (tracks: Track[]) => setQueueState(prev => [...prev, ...tracks]);
    const setQueue = (tracks: Track[]) => setQueueState(tracks);
    const removeFromQueue = (index: number) => setQueueState(prev => prev.filter((_, i) => i !== index));
    const clearQueue = () => { setQueueState([]); unloadSound(); setCurrentIndex(null); };

    const reorderQueue = (from: number, to: number) => {
        setQueueState(prev => {
            const newQueue = [...prev];
            const [moved] = newQueue.splice(from, 1);
            newQueue.splice(to, 0, moved);
            if (currentIndex === from) setCurrentIndex(to);
            return newQueue;
        });
    };

    const playTrack = async (track: Track) => {
        const index = allTracks.findIndex(t => t.id === track.id);
        if (index !== -1) {
            setQueueState([...allTracks]);
            await playFromQueue(index);
        } else {
            setQueueState([track]);
            await playFromQueue(0);
        }
    };

    const createPlaylist = async (name: string) => {
        const newPlaylist: Playlist = { id: Date.now().toString(), name, tracks: [] };
        setPlaylists(prev => [...prev, newPlaylist]);
    };

    const renamePlaylist = async (id: string, newName: string) => {
        setPlaylists(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    };

    const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
        setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) } : p));
    };

    const moveTrackInPlaylist = async (playlistId: string, fromIndex: number, toIndex: number) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId) {
                const newTracks = [...p.tracks];
                const [moved] = newTracks.splice(fromIndex, 1);
                newTracks.splice(toIndex, 0, moved);
                return { ...p, tracks: newTracks };
            }
            return p;
        }));
    };

    const deletePlaylist = async (id: string) => setPlaylists(prev => prev.filter(p => p.id !== id));
    const addToPlaylist = async (playlistId: string, track: Track) => {
        setPlaylists(prev => prev.map(p => (p.id === playlistId && !p.tracks.some(t => t.id === track.id)) ? { ...p, tracks: [...p.tracks, track] } : p));
    };

    const updateAudioSettings = (settings: Partial<AudioSettings>) => setAudioSettings(prev => ({ ...prev, ...settings }));
    const updateEqualizerBand = (frequency: number, gain: number) => setEqualizerBands(prev => prev.map(b => b.frequency === frequency ? { ...b, gain } : b));
    const applyPreset = (presetId: string) => {
        const preset = presets.find(p => p.id === presetId);
        if (preset) setEqualizerBands(prev => prev.map((b, i) => ({ ...b, gain: preset.gains[i] || 0 })));
    };

    const mainValue = useMemo(() => ({
        currentTrack: currentIndex !== null ? queue[currentIndex] : null,
        isPlaying,
        queue,
        playlists,
        playTrack,
        playFromQueue,
        togglePlayback,
        seekTo,
        nextTrack,
        previousTrack,
        addToQueue,
        clearQueue,
        setQueue,
        removeFromQueue,
        reorderQueue,
        loadLibrary,
        allTracks,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        removeTrackFromPlaylist,
        moveTrackInPlaylist,
        addToPlaylist,
        volume,
        isMuted,
        setVolume,
        toggleMute,
        audioSettings,
        updateAudioSettings,
        equalizerBands,
        updateEqualizerBand,
        presets,
        applyPreset
    }), [currentIndex, isPlaying, queue, playlists, allTracks, volume, isMuted, audioSettings, equalizerBands]);

    const playbackValue = useMemo(() => ({ position, duration }), [position, duration]);

    return (
        <PlayerContext.Provider value={mainValue}>
            <PlaybackContext.Provider value={playbackValue}>
                {children}
            </PlaybackContext.Provider>
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) throw new Error("usePlayer must be used within PlayerProvider");
    return context;
};

export const usePlayback = () => {
    const context = useContext(PlaybackContext);
    if (!context) throw new Error("usePlayback must be used within PlaybackProvider");
    return context;
};
