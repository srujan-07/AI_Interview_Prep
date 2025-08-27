import React from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  Download,
  Star,
  Target,
  Brain,
  Code,
  Users
} from 'lucide-react';
import { InterviewSession } from '../types';
import { saveAs } from 'file-saver';

interface InterviewResultsProps {
  session: InterviewSession;
  onStartNew: () => void;
}

export function InterviewResults({ session, onStartNew }: InterviewResultsProps) {
  const duration = session.endTime && session.startTime 
    ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    // Simple scoring algorithm based on response completeness and timing
    const avgResponseLength = session.responses.reduce((acc, r) => acc + r.response.length, 0) / session.responses.length;
    const completionRate = session.responses.length / session.questions.length;
    
    let score = 0;
    score += completionRate * 40; // 40% for completion
    score += Math.min(avgResponseLength / 100, 1) * 30; // 30% for response depth
    score += duration > 0 && duration < 1800 ? 30 : 20; // 30% for timing (under 30 mins is good)
    
    return Math.round(score);
  };

  const score = calculateScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const categoryStats = session.questions.reduce((acc, question) => {
    acc[question.category] = (acc[question.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return Code;
      case 'behavioral': return Brain;
      case 'experience': return MessageSquare;
      case 'role-specific': return Target;
      default: return Users;
    }
  };

  const downloadReport = () => {
    const report = {
      interviewDate: session.startTime.toISOString(),
      role: session.role,
      duration: formatTime(duration),
      score: score,
      questionsAnswered: session.responses.length,
      totalQuestions: session.questions.length,
      responses: session.responses.map((response, index) => ({
        question: session.questions.find(q => q.id === response.questionId)?.question || '',
        answer: response.response,
        timestamp: response.timestamp.toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    saveAs(blob, `interview-report-${session.startTime.toISOString().split('T')[0]}.json`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <Trophy className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Interview Complete!</h1>
          <p className="text-xl text-gray-600">Here's how you performed in your {session.role.replace('-', ' ')} interview</p>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-200"
        >
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBackground(score)} mb-6`}>
              <span className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall Performance</h2>
            <p className="text-gray-600 mb-6">
              {score >= 80 ? 'Excellent performance! You\'re well-prepared for this role.' :
               score >= 60 ? 'Good job! With some practice, you\'ll be ready to ace the real interview.' :
               'Keep practicing! Focus on providing more detailed responses.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-2xl p-6">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-blue-900">{formatTime(duration)}</div>
                <div className="text-blue-700">Total Time</div>
              </div>
              
              <div className="bg-green-50 rounded-2xl p-6">
                <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-green-900">{session.responses.length}</div>
                <div className="text-green-700">Questions Answered</div>
              </div>
              
              <div className="bg-purple-50 rounded-2xl p-6">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-900">
                  {Math.round((session.responses.length / session.questions.length) * 100)}%
                </div>
                <div className="text-purple-700">Completion Rate</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Question Categories */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Question Categories</h3>
            <div className="space-y-4">
              {Object.entries(categoryStats).map(([category, count]) => {
                const Icon = getCategoryIcon(category);
                const answered = session.responses.filter(r => 
                  session.questions.find(q => q.id === r.questionId)?.category === category
                ).length;
                
                return (
                  <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900 capitalize">
                          {category.replace('-', ' ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {answered} of {count} answered
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {Array.from({ length: count }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            i < answered ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Detailed Feedback */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Feedback & Recommendations</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Strengths</span>
                </div>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Completed {Math.round((session.responses.length / session.questions.length) * 100)}% of questions</li>
                  <li>• Maintained good pacing throughout the interview</li>
                  <li>• Engaged with voice-based interaction effectively</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Areas for Improvement</span>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Practice providing more detailed examples</li>
                  <li>• Work on structuring responses using STAR method</li>
                  <li>• Consider preparing stories for common behavioral questions</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Next Steps</span>
                </div>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Review your responses and identify patterns</li>
                  <li>• Practice with different question types</li>
                  <li>• Schedule another practice session</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
        >
          <button
            onClick={downloadReport}
            className="flex items-center space-x-2 px-8 py-4 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span>Download Report</span>
          </button>
          
          <button
            onClick={onStartNew}
            className="flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Trophy className="w-5 h-5" />
            <span>Start New Interview</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}