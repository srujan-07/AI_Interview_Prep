import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Settings, Upload, Play, Brain } from 'lucide-react';
import { Resume, InterviewSession, VoiceSettings as VoiceSettingsType } from './types';
import { ResumeUpload } from './components/ResumeUpload';
import { RoleSelector } from './components/RoleSelector';
import { InterviewInterface } from './components/InterviewInterface';
import { InterviewResults } from './components/InterviewResults';
import { VoiceSettings } from './components/VoiceSettings';
import { useInterview } from './hooks/useInterview';
import { useLocalStorage } from './hooks/useLocalStorage';

type AppState = 'setup' | 'interview' | 'results';

function App() {
  const [appState, setAppState] = useState<AppState>('setup');
  const [resume, setResume] = useLocalStorage<Resume | null>('interview-resume', null);
  const [selectedRole, setSelectedRole] = useState('');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useLocalStorage<VoiceSettingsType>('voice-settings', {
    voiceId: 'en-US-AriaNeural',
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
  });

  const {
    session,
    startInterview,
    isListening,
    isSpeaking,
    currentTranscript,
    error,
    startListening,
    stopListening,
    pauseInterview,
    resumeInterview,
    endInterview,
  } = useInterview();

  const handleResumeUpload = (uploadedResume: Partial<Resume>) => {
    const newResume: Resume = {
      id: `resume-${Date.now()}`,
      fileName: uploadedResume.fileName || 'resume.txt',
      content: uploadedResume.content || '',
      skills: uploadedResume.skills || [],
      experience: uploadedResume.experience || [],
      education: uploadedResume.education || [],
      uploadedAt: uploadedResume.uploadedAt || new Date(),
    };
    setResume(newResume);
  };

  const handleStartInterview = async () => {
    if (!resume || !selectedRole) return;
    
    setAppState('interview');
    await startInterview(resume, selectedRole);
  };

  const handleInterviewComplete = (completedSession: InterviewSession) => {
    setAppState('results');
  };

  const handleStartNew = () => {
    setAppState('setup');
    setResume(null);
    setSelectedRole('');
  };

  const canStartInterview = resume && selectedRole;

  React.useEffect(() => {
    const autoStart = async () => {
      if (canStartInterview && appState !== 'interview' && !session) {
        setAppState('interview');
        await startInterview(resume as Resume, selectedRole);
      }
    };
    autoStart();
  }, [canStartInterview, appState, session, startInterview, resume, selectedRole]);

  if (appState === 'interview' && session) {
    return (
      <InterviewInterface
        session={session}
        onComplete={handleInterviewComplete}
        onExit={() => setAppState('setup')}
        isListening={isListening}
        isSpeaking={isSpeaking}
        currentTranscript={currentTranscript}
        error={error}
        startListening={startListening}
        stopListening={stopListening}
        pauseInterview={pauseInterview}
        resumeInterview={resumeInterview}
        endInterview={endInterview}
      />
    );
  }

  if (appState === 'results' && session) {
    return (
      <InterviewResults
        session={session}
        onStartNew={handleStartNew}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Interview Prep</h1>
                <p className="text-gray-600">Voice-powered interview practice</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowVoiceSettings(true)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Voice Settings</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Master Your Interview Skills
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Practice with AI-powered voice interviews tailored to your resume and target role. 
            Get real-time feedback and improve your confidence.
          </p>
        </motion.div>

        {/* Setup Steps */}
        <div className="space-y-8">
          {/* Step 1: Resume Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Upload Your Resume</h3>
            </div>
            
            <ResumeUpload
              onResumeUpload={handleResumeUpload}
              uploadedResume={resume || undefined}
              onRemoveResume={() => setResume(null)}
            />
          </motion.div>

          {/* Step 2: Role Selection */}
          <AnimatePresence>
            {resume && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Select Target Role</h3>
                </div>
                
                <RoleSelector
                  selectedRole={selectedRole}
                  onRoleSelect={setSelectedRole}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Start Interview */}
          <AnimatePresence>
            {canStartInterview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Start Your Interview</h3>
                </div>
                
                <motion.div
                  className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 max-w-2xl mx-auto"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-10 h-10 text-green-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">Ready to Begin!</h4>
                    <p className="text-gray-600">
                      Your personalized interview will include questions based on your resume and the {selectedRole.replace('-', ' ')} role.
                      The entire interview will be conducted through voice interaction.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <Upload className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <div className="font-medium text-blue-900">Resume Analyzed</div>
                      <div className="text-sm text-blue-700">{resume.skills.length} skills found</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <Play className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="font-medium text-green-900">Voice Ready</div>
                      <div className="text-sm text-green-700">AI interviewer configured</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <Brain className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <div className="font-medium text-purple-900">Questions Ready</div>
                      <div className="text-sm text-purple-700">Tailored for {selectedRole.replace('-', ' ')}</div>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={handleStartInterview}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    <Mic className="w-6 h-6" />
                    <span>Start Voice Interview</span>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Questions</h3>
            <p className="text-gray-600 text-sm">
              Get personalized questions based on your resume, skills, and target role
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mic className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Voice-Only Interface</h3>
            <p className="text-gray-600 text-sm">
              Practice speaking naturally with our advanced voice recognition and synthesis
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Detailed Feedback</h3>
            <p className="text-gray-600 text-sm">
              Receive comprehensive analysis and improvement suggestions after each session
            </p>
          </div>
        </motion.div>
      </main>

      {/* Voice Settings Modal */}
      <AnimatePresence>
        {showVoiceSettings && (
          <VoiceSettings
            settings={voiceSettings}
            onSettingsChange={setVoiceSettings}
            onClose={() => setShowVoiceSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;