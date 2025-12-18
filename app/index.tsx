import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Dimensions, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FlashList as OriginalFlashList } from '@shopify/flash-list';
const FlashList = OriginalFlashList as any;
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { usePlayer } from '../contexts/PlayerContext';
import { Track } from '../constants/types';
import PlayerScreen from '../screens/PlayerScreen';

export default function LibraryScreen() {
    const {
        loadLibrary,
        allTracks,
        playTrack,
        currentTrack,
        isPlaying,
        togglePlayback,
        playlists,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        moveTrackInPlaylist,
        removeTrackFromPlaylist,
        playFromQueue,
        setQueue,
        addToPlaylist
    } = usePlayer();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'songs' | 'playlists'>('songs');
    const [playerVisible, setPlayerVisible] = useState(false);

    // Playlist State
    const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
    const [trackToAdd, setTrackToAdd] = useState<Track | null>(null);

    useEffect(() => {
        loadLibrary();
    }, []);

    const filteredTracks = React.useMemo(() => {
        if (!searchQuery) return allTracks;
        const query = searchQuery.toLowerCase();
        return allTracks.filter(t =>
            t.filename.toLowerCase().includes(query) ||
            (t.title && t.title.toLowerCase().includes(query))
        );
    }, [allTracks, searchQuery]);

    const handleCreatePlaylist = () => {
        if (newPlaylistName.trim()) {
            createPlaylist(newPlaylistName.trim());
            setNewPlaylistName('');
            setIsCreatingPlaylist(false);
        }
    };

    const openPlaylist = (playlist: any) => {
        setSelectedPlaylist(playlist);
    };

    const playPlaylist = (playlist: any) => {
        if (playlist.tracks.length > 0) {
            setQueue(playlist.tracks);
            // Auto play first
            // We need to wait for queue to update? Context updates are immediate in state but effect?
            // playFromQueue(0);
            // Actually setQueue runs separately.
            // Better: setQueue and play index 0.
            // Context doesn't expose a method to do both atomic, but standard React state update batching might handle it.
            // Or user has to press play.
        }
    };

    const SongItem = React.memo(({ item, onPress, onLongPress }: { item: Track, onPress: () => void, onLongPress: () => void }) => (
        <TouchableOpacity
            style={styles.songContainer}
            onPress={onPress}
            onLongPress={onLongPress}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="musical-note" size={24} color="#666" />
            </View>
            <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>{item.title || item.filename}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{item.artist || 'Unknown Artist'}</Text>
            </View>
            <View>
                <Text style={styles.durationText}>{Math.floor(item.duration / 60)}:{Math.floor(item.duration % 60).toString().padStart(2, '0')}</Text>
            </View>
        </TouchableOpacity>
    ));

    const renderItem = React.useCallback(({ item }: { item: Track }) => (
        <SongItem
            item={item}
            onPress={() => playTrack(item)}
            onLongPress={() => setTrackToAdd(item)}
        />
    ), [playTrack, setTrackToAdd]);

    const renderPlaylist = React.useCallback(({ item }: { item: any }) => (
        <TouchableOpacity style={styles.songContainer} onPress={() => openPlaylist(item)}>
            <View style={styles.iconContainer}>
                <Ionicons name="list" size={24} color="#BB86FC" />
            </View>
            <View style={styles.songDetails}>
                <Text style={styles.songTitle}>{item.name}</Text>
                <Text style={styles.songArtist}>{item.tracks.length} songs</Text>
            </View>
            <TouchableOpacity onPress={() => deletePlaylist(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#666" />
            </TouchableOpacity>
        </TouchableOpacity>
    ), [deletePlaylist]);

    if (selectedPlaylist) {
        // Find the most recent version of this playlist from context
        const currentPlaylist = playlists.find(p => p.id === selectedPlaylist.id) || selectedPlaylist;

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => setSelectedPlaylist(null)}>
                        <Ionicons name="arrow-back" size={28} color="#FFF" />
                    </TouchableOpacity>

                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                        <TextInput
                            style={styles.headerTitle}
                            value={currentPlaylist.name}
                            onChangeText={(text) => renamePlaylist(currentPlaylist.id, text)}
                            placeholderTextColor="#888"
                        />
                    </View>

                    <TouchableOpacity onPress={() => playPlaylist(currentPlaylist)}>
                        <Ionicons name="play-circle" size={32} color="#BB86FC" />
                    </TouchableOpacity>
                </View>

                <DraggableFlatList
                    data={currentPlaylist.tracks}
                    keyExtractor={(item) => item.id}
                    onDragEnd={({ data, from, to }) => {
                        moveTrackInPlaylist(currentPlaylist.id, from, to);
                    }}
                    renderItem={({ item, drag, isActive }: RenderItemParams<Track>) => (
                        <TouchableOpacity
                            style={[
                                styles.songContainer,
                                isActive && { backgroundColor: '#333' }
                            ]}
                            onPress={() => playTrack(item)}
                            onLongPress={drag}
                            delayLongPress={200}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name="musical-note" size={24} color="#666" />
                            </View>
                            <View style={styles.songDetails}>
                                <Text style={styles.songTitle} numberOfLines={1}>{item.title || item.filename}</Text>
                                <Text style={styles.songArtist} numberOfLines={1}>{item.artist || 'Unknown Artist'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeTrackFromPlaylist(currentPlaylist.id, item.id)}>
                                <Ionicons name="close" size={20} color="#666" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}><Text style={styles.emptyText}>No songs in this playlist. Long press songs in Library to add.</Text></View>
                    }
                />

                {/* Mini Player */}
                {currentTrack && (
                    <TouchableOpacity style={styles.miniPlayer} onPress={() => setPlayerVisible(true)}>
                        <View style={styles.miniPlayerInfo}>
                            <Text style={styles.miniPlayerTitle} numberOfLines={1}>{currentTrack.title || currentTrack.filename}</Text>
                            <Text style={styles.miniPlayerArtist} numberOfLines={1}>{currentTrack.artist || 'Unknown'}</Text>
                        </View>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); togglePlayback(); }}>
                            <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#FFF" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
                <PlayerScreen visible={playerVisible} onClose={() => setPlayerVisible(false)} />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Search & Header */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Library</Text>
                {activeTab === 'playlists' ? (
                    <TouchableOpacity onPress={() => setIsCreatingPlaylist(!isCreatingPlaylist)}>
                        <Ionicons name="add" size={32} color="#BB86FC" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={loadLibrary}>
                        <Ionicons name="scan-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>

            {isCreatingPlaylist && (
                <View style={styles.createPlaylistContainer}>
                    <TextInput
                        style={styles.createInput}
                        placeholder="Playlist Name"
                        placeholderTextColor="#666"
                        value={newPlaylistName}
                        onChangeText={setNewPlaylistName}
                        autoFocus
                    />
                    <TouchableOpacity onPress={handleCreatePlaylist} style={styles.createButton}>
                        <Text style={styles.createButtonText}>Create</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Add to Playlist Modal */}
            <Modal visible={!!trackToAdd} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add to Playlist</Text>
                        <FlatList
                            data={playlists}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        if (trackToAdd) {
                                            addToPlaylist(item.id, trackToAdd);
                                            setTrackToAdd(null);
                                        }
                                    }}
                                >
                                    <Ionicons name="list" size={24} color="#FFF" style={{ marginRight: 10 }} />
                                    <Text style={styles.modalItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center' }}>No playlists</Text>}
                        />
                        <TouchableOpacity onPress={() => setTrackToAdd(null)} style={styles.modalCloseButton}>
                            <Text style={styles.modalCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search songs, artists..."
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'songs' && styles.activeTab]}
                    onPress={() => setActiveTab('songs')}
                >
                    <Text style={[styles.tabText, activeTab === 'songs' && styles.activeTabText]}>Songs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'playlists' && styles.activeTab]}
                    onPress={() => setActiveTab('playlists')}
                >
                    <Text style={[styles.tabText, activeTab === 'playlists' && styles.activeTabText]}>Playlists</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            {activeTab === 'songs' ? (
                <FlashList
                    data={filteredTracks}
                    keyExtractor={(item: any) => item.id}
                    renderItem={renderItem}
                    estimatedItemSize={65}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No music found.</Text>
                        </View>
                    }
                />
            ) : (
                <FlashList
                    data={playlists}
                    keyExtractor={(item: any) => item.id}
                    renderItem={renderPlaylist}
                    estimatedItemSize={65}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No playlists yet.</Text>
                        </View>
                    }
                />
            )}

            {/* Mini Player */}
            {currentTrack && (
                <TouchableOpacity style={styles.miniPlayer} onPress={() => setPlayerVisible(true)}>
                    <View style={styles.miniPlayerInfo}>
                        <Text style={styles.miniPlayerTitle} numberOfLines={1}>{currentTrack.title || currentTrack.filename}</Text>
                        <Text style={styles.miniPlayerArtist} numberOfLines={1}>{currentTrack.artist || 'Unknown'}</Text>
                    </View>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); togglePlayback(); }}>
                        <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#FFF" />
                    </TouchableOpacity>
                </TouchableOpacity>
            )}

            <PlayerScreen visible={playerVisible} onClose={() => setPlayerVisible(false)} />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        marginHorizontal: 20,
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 40,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    tab: {
        marginRight: 20,
        paddingBottom: 8,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#BB86FC',
    },
    tabText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FFF',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    songContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    songDetails: {
        flex: 1,
        marginRight: 10,
    },
    songTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    songArtist: {
        color: '#888',
        fontSize: 14,
    },
    durationText: {
        color: '#666',
        fontSize: 12,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
    miniPlayer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
        backgroundColor: '#1E1E1E',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    miniPlayerInfo: {
        flex: 1,
    },
    miniPlayerTitle: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    miniPlayerArtist: {
        color: '#AAA',
        fontSize: 12,
    },
    createPlaylistContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    createInput: {
        flex: 1,
        backgroundColor: '#222',
        color: '#FFF',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 10,
    },
    createButton: {
        backgroundColor: '#BB86FC',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 20,
        maxHeight: '60%',
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalItemText: {
        color: '#FFF',
        fontSize: 16,
    },
    modalCloseButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    modalCloseText: {
        color: '#BB86FC',
    },
});
