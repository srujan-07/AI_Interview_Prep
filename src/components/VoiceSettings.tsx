import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Mic, Settings, Play, Upload } from 'lucide-react';
import { MurfVoice, VoiceSettings as VoiceSettingsType } from '../types';
import { MurfService } from '../services/murfApi';

interface VoiceSettingsProps {
  settings: VoiceSettingsType;
  onSettingsChange: (settings: VoiceSettingsType) => void;
  onClose: () => void;
}

export function VoiceSettings({ settings, onSettingsChange, onClose }: VoiceSettingsProps) {
  const [voices, setVoices] = useState<MurfVoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clonedVoiceFile, setClonedVoiceFile] = useState<File | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const availableVoices = await MurfService.getVoices();
      setVoices(availableVoices);
    } catch (error) {
      console.error('Failed to load voices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: keyof VoiceSettingsType, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
  };

  const playVoicePreview = async (voiceId: string) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      const previewText = "Hello! This is how I will sound during your interview. I'm here to help you practice and improve your interview skills.";
      const audioUrl = await MurfService.generateSpeech(previewText, {
        ...settings,
        voiceId,
      });
      
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      await audio.play();
    } catch (error) {
      console.error('Failed to play preview:', error);
      setIsPlaying(false);
    }
  };

  const handleVoiceClone = async () => {
    if (!clonedVoiceFile) return;
    
    setIsCloning(true);
    try {
      const clonedVoiceId = await MurfService.cloneVoice(clonedVoiceFile, 'Custom Interview Voice');
      handleSettingChange('voiceId', clonedVoiceId);
      
      // Add the cloned voice to the list
      const newVoice: MurfVoice = {
        id: clonedVoiceId,
        name: 'Custom Voice',
        gender: 'male', // Default, could be detected
        accent: 'Custom',
        language: 'English',
      };
      setVoices(prev => [...prev, newVoice]);
      setClonedVoiceFile(null);
    } catch (error) {
      console.error('Failed to clone voice:', error);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Voice Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Voice Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Interviewer Voice</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {voices.map((voice) => (
                  <div
                    key={voice.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      settings.voiceId === voice.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSettingChange('voiceId', voice.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{voice.name}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playVoicePreview(voice.id);
                        }}
                        disabled={isPlaying}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>{voice.gender} • {voice.accent}</div>
                      <div>{voice.language}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voice Cloning */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clone Your Voice</h3>
            <p className="text-gray-600 mb-4">
              Upload an audio sample to create a custom voice for the interviewer. This can help you practice with a familiar voice.
            </p>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Choose Audio File</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setClonedVoiceFile(e.target.files?.[0] || null)}
                />
              </label>
              
              {clonedVoiceFile && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{clonedVoiceFile.name}</span>
                  <button
                    onClick={handleVoiceClone}
                    disabled={isCloning}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isCloning ? 'Cloning...' : 'Clone Voice'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Voice Controls */}
          <div className="border-t border-gray-200 pt-8 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Voice Controls</h3>
            
            {/* Speed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speech Speed: {settings.speed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.speed}
                onChange={(e) => handleSettingChange('speed', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Pitch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pitch: {settings.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.pitch}
                onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>Normal</span>
                <span>High</span>
              </div>
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume: {Math.round(settings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={settings.volume}
                onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Quiet</span>
                <span>Normal</span>
                <span>Loud</span>
              </div>
            </div>
          </div>

          {/* Test Voice */}
          <div className="border-t border-gray-200 pt-8">
            <button
              onClick={() => playVoicePreview(settings.voiceId)}
              disabled={isPlaying}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Volume2 className="w-5 h-5" />
              <span>{isPlaying ? 'Playing...' : 'Test Voice Settings'}</span>
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}