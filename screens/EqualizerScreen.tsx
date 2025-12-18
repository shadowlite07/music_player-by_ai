import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { usePlayer } from '../contexts/PlayerContext';
import { useTheme } from '../contexts/ThemeContext';

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
    const { colors } = useTheme();

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
                <View style={[styles.contentContainer, { backgroundColor: colors.surface }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="chevron-down" size={30} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: colors.text }]}>Audio Settings</Text>
                        <View style={{ width: 30 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Audio Quality Section */}
                        <View style={[styles.section, { backgroundColor: colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: colors.accent }]}>Audio Quality</Text>
                            <View style={styles.row}>
                                <Text style={[styles.label, { color: colors.text }]}>High Quality Pitch Correction</Text>
                                <Switch
                                    value={audioSettings.quality === 'high'}
                                    onValueChange={(val) => updateAudioSettings({ quality: val ? 'high' : 'low' })}
                                    trackColor={{ false: "#767577", true: colors.accent }}
                                    thumbColor="#FFF"
                                />
                            </View>
                            <Text style={[styles.description, { color: colors.textSecondary }]}>
                                Improves audio quality when changing speed or pitch.
                            </Text>
                        </View>

                        {/* Playback Section */}
                        <View style={[styles.section, { backgroundColor: colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: colors.accent }]}>Playback</Text>
                            <View style={styles.row}>
                                <Text style={[styles.label, { color: colors.text }]}>Crossfade Songs</Text>
                                <Switch
                                    value={audioSettings.crossfade}
                                    onValueChange={(val) => updateAudioSettings({ crossfade: val })}
                                    trackColor={{ false: "#767577", true: colors.accent }}
                                    thumbColor="#FFF"
                                />
                            </View>
                            {audioSettings.crossfade && (
                                <View style={styles.sliderContainer}>
                                    <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{audioSettings.crossfadeDuration / 1000}s Transition</Text>
                                    <Slider
                                        style={{ width: '100%', height: 40 }}
                                        minimumValue={1000}
                                        maximumValue={10000}
                                        step={500}
                                        value={audioSettings.crossfadeDuration}
                                        onSlidingComplete={(val) => updateAudioSettings({ crossfadeDuration: val })}
                                        minimumTrackTintColor={colors.accent}
                                        maximumTrackTintColor={colors.border}
                                        thumbTintColor={colors.accent}
                                    />
                                </View>
                            )}

                            <View style={[styles.row, { marginTop: 15 }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Normalize Volume (Replay Gain)</Text>
                                <Switch
                                    value={audioSettings.normalizeVolume}
                                    onValueChange={(val) => updateAudioSettings({ normalizeVolume: val })}
                                    trackColor={{ false: "#767577", true: colors.accent }}
                                    thumbColor="#FFF"
                                />
                            </View>
                        </View>

                        {/* Equalizer Section */}
                        <View style={[styles.section, { backgroundColor: colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: colors.accent }]}>Equalizer (Simulation)</Text>

                            {/* Presets */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                                {presets.map(preset => (
                                    <TouchableOpacity
                                        key={preset.id}
                                        style={[styles.presetChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                        onPress={() => applyPreset(preset.id)}
                                    >
                                        <Text style={[styles.presetText, { color: colors.text }]}>{preset.name}</Text>
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
                                                minimumTrackTintColor={colors.accent}
                                                maximumTrackTintColor={colors.border}
                                                thumbTintColor="#FFF"
                                            />
                                        </View>
                                        <Text style={[styles.bandLabel, { color: colors.textSecondary }]}>{band.label}</Text>
                                        <Text style={[styles.gainLabel, { color: colors.accent }]}>{Math.round(band.gain)}dB</Text>
                                    </View>
                                ))}
                            </View>
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        marginBottom: 30,
        padding: 15,
        borderRadius: 12,
    },
    sectionTitle: {
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
        fontSize: 16,
    },
    subLabel: {
        fontSize: 14,
        marginBottom: 5,
    },
    description: {
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
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
    },
    presetText: {
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
        fontSize: 12,
    },
    gainLabel: {
        fontSize: 10,
        marginTop: 2,
    }
});
