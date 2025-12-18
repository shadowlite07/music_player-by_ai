import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track } from '../constants/types';

const KEYS = {
    QUEUE: 'music_player_queue',
    LAST_TRACK_INDEX: 'music_player_last_index',
    LAST_POSITION: 'music_player_last_position',
    PLAYLISTS: 'music_player_playlists',
    LIBRARY: 'music_player_library',
};

export const StorageService = {
    saveQueue: async (queue: Track[]) => {
        try {
            await AsyncStorage.setItem(KEYS.QUEUE, JSON.stringify(queue));
        } catch (e) {
            console.error('Failed to save queue', e);
        }
    },

    getQueue: async (): Promise<Track[]> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.QUEUE);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('Failed to get queue', e);
            return [];
        }
    },

    savePlaylists: async (playlists: any[]) => {
        try {
            await AsyncStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(playlists));
        } catch (e) {
            console.error("Failed to save playlists", e);
        }
    },

    getPlaylists: async (): Promise<any[]> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.PLAYLISTS);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            return [];
        }
    },

    saveLastState: async (index: number, position: number) => {
        try {
            await AsyncStorage.multiSet([
                [KEYS.LAST_TRACK_INDEX, index.toString()],
                [KEYS.LAST_POSITION, position.toString()],
            ]);
        } catch (e) {
            console.error('Failed to save state', e);
        }
    },

    getLastState: async (): Promise<{ index: number; position: number }> => {
        try {
            const result = await AsyncStorage.multiGet([KEYS.LAST_TRACK_INDEX, KEYS.LAST_POSITION]);
            const index = result[0][1] ? parseInt(result[0][1]) : 0;
            const position = result[1][1] ? parseInt(result[1][1]) : 0;
            return { index, position };
        } catch (e) {
            console.error('Failed to get state', e);
            return { index: 0, position: 0 };
        }
    },

    saveLibrary: async (library: Track[]) => {
        try {
            await AsyncStorage.setItem(KEYS.LIBRARY, JSON.stringify(library));
        } catch (e) {
            console.error('Failed to save library', e);
        }
    },

    getLibrary: async (): Promise<Track[]> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.LIBRARY);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('Failed to get library', e);
            return [];
        }
    },
};
