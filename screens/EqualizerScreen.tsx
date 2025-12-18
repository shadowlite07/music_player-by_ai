import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { usePlayer } from '../contexts/PlayerContext';

interface EqualizerScreenProps {
    visible: boolean;
    onClose: () => void;
}

export default function EqualizerScreen({ visible, onClose }: EqualizerScreenProps) {
    const {
        equalizerBands,
        updateEqualizerBand,
        presets,
        applyPreset,
        audioSettings,
        updateAudioSettings
    } = usePlayer();

    // Replay Gain (Normalization) - simulated
    // Crossfade UI

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.contentContainer}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="chevron-down" size={30} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Audio Settings</Text>
                        <View style={{ width: 30 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Audio Quality Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Audio Quality</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>High Quality Pitch Correction</Text>
                                <Switch
                                    value={audioSettings.quality === 'high'}
                                    onValueChange={(val) => updateAudioSettings({ quality: val ? 'high' : 'low' })}
                                    trackColor={{ false: "#767577", true: "#BB86FC" }}
                                    thumbColor={audioSettings.quality === 'high' ? "#FFF" : "#f4f3f4"}
                                />
                            </View>
                            <Text style={styles.description}>
                                Improves audio quality when changing speed or pitch.
                            </Text>
                        </View>

                        {/* Crossfade Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Playback</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>Crossfade Songs</Text>
                                <Switch
                                    value={audioSettings.crossfade}
                                    onValueChange={(val) => updateAudioSettings({ crossfade: val })}
                                    trackColor={{ false: "#767577", true: "#BB86FC" }}
                                    thumbColor={audioSettings.crossfade ? "#FFF" : "#f4f3f4"}
                                />
                            </View>
                            {audioSettings.crossfade && (
                                <View style={styles.sliderContainer}>
                                    <Text style={styles.subLabel}>{audioSettings.crossfadeDuration / 1000}s Transition</Text>
                                    <Slider
                                        style={{ width: '100%', height: 40 }}
                                        minimumValue={1000}
                                        maximumValue={10000}
                                        step={500}
                                        value={audioSettings.crossfadeDuration}
                                        onSlidingComplete={(val) => updateAudioSettings({ crossfadeDuration: val })}
                                        minimumTrackTintColor="#BB86FC"
                                        maximumTrackTintColor="#555"
                                        thumbTintColor="#BB86FC"
                                    />
                                </View>
                            )}

                            <View style={[styles.row, { marginTop: 15 }]}>
                                <Text style={styles.label}>Normalize Volume (Replay Gain)</Text>
                                <Switch
                                    value={audioSettings.normalizeVolume}
                                    onValueChange={(val) => updateAudioSettings({ normalizeVolume: val })}
                                    trackColor={{ false: "#767577", true: "#BB86FC" }}
                                    thumbColor={audioSettings.normalizeVolume ? "#FFF" : "#f4f3f4"}
                                />
                            </View>
                        </View>

                        {/* Equalizer Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Equalizer (Simulation)</Text>

                            {/* Presets */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                                {presets.map(preset => (
                                    <TouchableOpacity
                                        key={preset.id}
                                        style={styles.presetChip}
                                        onPress={() => applyPreset(preset.id)}
                                    >
                                        <Text style={styles.presetText}>{preset.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.eqContainer}>
                                {equalizerBands.map((band, index) => (
                                    <View key={index} style={styles.bandContainer}>
                                        <View style={styles.verticalSlider}>
                                            <Slider
                                                style={{ width: 150, height: 40, transform: [{ rotate: '-90deg' }] }}
                                                minimumValue={-10}
                                                maximumValue={10}
                                                value={band.gain}
                                                onSlidingComplete={(val) => updateEqualizerBand(band.frequency, val)}
                                                minimumTrackTintColor="#BB86FC"
                                                maximumTrackTintColor="#555"
                                                thumbTintColor="#FFF"
                                            />
                                        </View>
                                        <Text style={styles.bandLabel}>{band.label}</Text>
                                        <Text style={styles.gainLabel}>{Math.round(band.gain)}dB</Text>
                                    </View>
                                ))}
                            </View>
                            {/* <Text style={styles.description}>
                                Note: Direct DSP Equalization requires native modules not available here. This UI saves preferences for future logic.
                            </Text> */}
                        </View>

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    contentContainer: {
        backgroundColor: '#1E1E1E',
        height: '85%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        marginBottom: 30,
        backgroundColor: '#2A2A2A',
        padding: 15,
        borderRadius: 12,
    },
    sectionTitle: {
        color: '#BB86FC',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        color: '#FFF',
        fontSize: 16,
    },
    subLabel: {
        color: '#AAA',
        fontSize: 14,
        marginBottom: 5,
    },
    description: {
        color: '#666',
        fontSize: 12,
        marginTop: 5,
        fontStyle: 'italic',
    },
    sliderContainer: {
        marginTop: 5,
    },
    presetScroll: {
        marginBottom: 20,
    },
    presetChip: {
        backgroundColor: '#333',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#444',
    },
    presetText: {
        color: '#FFF',
        fontSize: 14,
    },
    eqContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        height: 200,
        alignItems: 'flex-end',
    },
    bandContainer: {
        alignItems: 'center',
        width: 50,
    },
    verticalSlider: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    bandLabel: {
        color: '#AAA',
        fontSize: 12,
    },
    gainLabel: {
        color: '#BB86FC',
        fontSize: 10,
        marginTop: 2,
    }
});
