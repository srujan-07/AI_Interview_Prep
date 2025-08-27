import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Clock,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { InterviewSession } from '../types';
import { VoiceVisualizer } from './VoiceVisualizer';

interface InterviewInterfaceProps {
  session: InterviewSession;
  onComplete: (session: InterviewSession) => void;
  onExit: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  pauseInterview: () => void;
  resumeInterview: () => void;
  endInterview: () => void;
}

export function InterviewInterface({ session, onComplete, onExit, isListening, isSpeaking, currentTranscript, error, startListening, stopListening, pauseInterview, resumeInterview, endInterview }: InterviewInterfaceProps) {

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (session.status === 'active') {
        setTimeElapsed(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.status]);

  useEffect(() => {
    if (session.status === 'completed') {
      onComplete(session);
    }
  }, [session.status, onComplete]);

  const currentQuestion = session.questions[session.currentQuestionIndex];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-100 via-white to-indigo-200">
      {/* Minimal Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="font-mono text-lg font-semibold text-gray-900">
                  {formatTime(timeElapsed)}
                </span>
              </div>
              <button
                onClick={onExit}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Exit Interview
              </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Interview Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Question */}
            <motion.div
              key={currentQuestion?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur bg-white/60 rounded-2xl shadow-lg p-8 border border-white/40"
            >
              

              {/* Hidden question text for audio-only experience */}
              <div className="sr-only">
                {currentQuestion?.question}
              </div>

              {/* Voice Visualizer */}
              <div className="flex justify-center mb-6">
                <VoiceVisualizer 
                  isActive={isListening || isSpeaking} 
                  type={isSpeaking ? 'speaking' : 'listening'} 
                />
              </div>

              {/* Status Indicator */}
              <div className="text-center mb-6">
                <AnimatePresence mode="wait">
                  {isSpeaking && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center justify-center space-x-2 text-blue-600"
                    >
                      <Volume2 className="w-5 h-5" />
                      <span className="font-medium">AI Interviewer is speaking...</span>
                    </motion.div>
                  )}
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center justify-center space-x-2 text-green-600"
                    >
                      <Mic className="w-5 h-5" />
                      <span className="font-medium">Listening to your response...</span>
                    </motion.div>
                  )}
                  {!isListening && !isSpeaking && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center justify-center space-x-2 text-gray-500"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">Ready for your response</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                {!isListening && !isSpeaking && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startListening}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg"
                  >
                    <Mic className="w-5 h-5" />
                    <span>Start Speaking</span>
                  </motion.button>
                )}

                {isListening && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopListening}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-lg"
                  >
                    <MicOff className="w-5 h-5" />
                    <span>Stop Speaking</span>
                  </motion.button>
                )}

                {session.status === 'active' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={pauseInterview}
                    className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 text-white rounded-xl font-medium hover:bg-yellow-700 transition-colors shadow-lg"
                  >
                    <Pause className="w-5 h-5" />
                    <span>Pause</span>
                  </motion.button>
                )}

                {session.status === 'paused' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resumeInterview}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <Play className="w-5 h-5" />
                    <span>Resume</span>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={endInterview}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors shadow-lg"
                >
                  <Square className="w-5 h-5" />
                  <span>End Interview</span>
                </motion.button>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </motion.div>

            {/* Live Transcript */}
            {showTranscript && currentTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <h3 className="font-semibold text-gray-900 mb-3">Live Transcript</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 italic">"{currentTranscript}"</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar removed for minimal experience */}
          <div className="space-y-6" />
        </div>
      </div>
    </div>
  );
}