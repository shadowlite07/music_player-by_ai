import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, Image } from 'react-native';
import { FlashList as OriginalFlashList } from '@shopify/flash-list';
const FlashList = OriginalFlashList as any;
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer, usePlayback } from '../contexts/PlayerContext';
import { Track } from '../constants/types';
import EqualizerScreen from './EqualizerScreen';

const { width, height } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function PlayerScreen({ visible, onClose }: Props) {
    const { currentTrack, isPlaying, seekTo, togglePlayback, nextTrack, previousTrack, queue, playFromQueue, removeFromQueue, clearQueue, volume, setVolume, isMuted, toggleMute } = usePlayer();
    const { position, duration } = usePlayback();
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);
    const [showQueue, setShowQueue] = useState(false);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);

    if (!currentTrack) return null;

    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const getDisplayTime = () => {
        if (isSeeking) return formatTime(seekValue);
        return formatTime(position);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <EqualizerScreen visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="chevron-down" size={32} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{showQueue ? 'Queue' : 'Now Playing'}</Text>
                    <TouchableOpacity onPress={() => setShowQueue(!showQueue)} style={styles.queueButton}>
                        <Ionicons name={showQueue ? "musical-notes" : "list"} size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {showQueue ? (
                    <View style={styles.queueContainer}>
                        <View style={styles.queueHeader}>
                            <TouchableOpacity onPress={clearQueue}>
                                <Text style={styles.clearText}>Clear Queue</Text>
                            </TouchableOpacity>
                        </View>
                        <FlashList
                            data={queue}
                            keyExtractor={(item: any, index: number) => item.id + index}
                            estimatedItemSize={61}
                            renderItem={({ item, index }: { item: any, index: number }) => (
                                <View style={[styles.queueItem, currentTrack.id === item.id && styles.activeQueueItem]}>
                                    <TouchableOpacity style={styles.queueInfo} onPress={() => playFromQueue(index)}>
                                        <Text style={[styles.queueTitle, currentTrack.id === item.id && styles.activeQueueText]} numberOfLines={1}>
                                            {item.title || item.filename}
                                        </Text>
                                        <Text style={styles.queueArtist} numberOfLines={1}>{item.artist || 'Unknown'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => removeFromQueue(index)}>
                                        <Ionicons name="close" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>
                ) : (
                    <>
                        <View style={styles.artworkContainer}>
                            <View style={styles.artworkPlaceholder}>
                                <Ionicons name="musical-note" size={80} color="#333" />
                            </View>
                        </View>

                        <View style={styles.infoContainer}>
                            <Text style={styles.title} numberOfLines={1}>{currentTrack.filename.replace(/\.[^/.]+$/, "")}</Text>
                            <Text style={styles.artist}>{currentTrack.artist || 'Unknown Artist'}</Text>
                        </View>
                    </>
                )}

                <View style={styles.controlsContainer}>
                    {/* Add Settings Button Row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 10 }}>
                        <TouchableOpacity onPress={() => setIsSettingsVisible(true)}>
                            <Ionicons name="settings-outline" size={24} color="#AAA" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.progressContainer}>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={duration}
                            value={isSeeking ? seekValue : position}
                            onValueChange={(val) => {
                                setIsSeeking(true);
                                setSeekValue(val);
                            }}
                            onSlidingComplete={async (val) => {
                                await seekTo(val);
                                setIsSeeking(false);
                            }}
                            minimumTrackTintColor="#BB86FC"
                            maximumTrackTintColor="#555"
                            thumbTintColor="#BB86FC"
                        />
                        <View style={styles.timeRow}>
                            <Text style={styles.timeText}>{getDisplayTime()}</Text>
                            <Text style={styles.timeText}>{formatTime(duration)}</Text>
                        </View>
                    </View>

                    <View style={styles.controlsMain}>
                        <TouchableOpacity onPress={previousTrack}>
                            <Ionicons name="play-skip-back" size={40} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
                            <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#000" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={nextTrack}>
                            <Ionicons name="play-skip-forward" size={40} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Volume Control */}
                    <View style={styles.volumeContainer}>
                        <TouchableOpacity onPress={toggleMute}>
                            <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Slider
                            style={styles.volumeSlider}
                            minimumValue={0}
                            maximumValue={1}
                            value={isMuted ? 0 : volume}
                            onValueChange={(val) => setVolume(val)}
                            minimumTrackTintColor="#BB86FC"
                            maximumTrackTintColor="#555"
                            thumbTintColor="#BB86FC"
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        paddingVertical: 40,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    closeButton: {
        padding: 10,
    },
    headerTitle: {
        color: '#888',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    artworkContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1,
        width: '100%',
        marginBottom: 30,
    },
    artworkPlaceholder: {
        width: '80%',
        height: '80%',
        backgroundColor: '#222',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 20,
    },
    infoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    artist: {
        color: '#AAA',
        fontSize: 18,
    },
    progressContainer: {
        width: '100%',
        marginBottom: 40,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    timeText: {
        color: '#888',
        fontSize: 12,
    },
    controlsMain: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginBottom: 40,
    },
    playButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#BB86FC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    queueButton: {
        padding: 10,
    },
    queueContainer: {
        flex: 1,
        marginBottom: 20,
    },
    queueHeader: {
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    clearText: {
        color: '#BB86FC',
        fontSize: 14,
    },
    queueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    activeQueueItem: {
        backgroundColor: '#1E1E1E',
    },
    queueInfo: {
        flex: 1,
    },
    queueTitle: {
        color: '#FFF',
        fontSize: 16,
        marginBottom: 2,
    },
    activeQueueText: {
        color: '#BB86FC',
        fontWeight: 'bold',
    },
    queueArtist: {
        color: '#888',
        fontSize: 12,
    },
    controlsContainer: {
        width: '100%',
    },
    volumeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    volumeSlider: {
        flex: 1,
        marginLeft: 10,
        height: 40,
    },
});
