

export interface Track {
    id: string;
    uri: string;
    filename: string;
    duration: number;
    artist?: string;
    albumId?: string;
    title?: string;
    artwork?: string;
}

export interface Playlist {
    id: string;
    name: string;
    tracks: Track[];
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface EqualizerBand {
    frequency: number;
    label: string;
    gain: number; // -10 to 10 dB
}

export interface Preset {
    id: string;
    name: string;
    gains: number[];
}

export interface AudioSettings {
    crossfade: boolean;
    crossfadeDuration: number; // in milliseconds
    normalizeVolume: boolean; // Replay gain simulation
    quality: 'low' | 'high';
}
