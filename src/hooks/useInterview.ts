import { useState, useCallback, useRef, useEffect } from 'react';
import { InterviewSession, InterviewQuestion, InterviewResponse, Resume } from '../types';
import { QuestionGenerator } from '../services/questionGenerator';
import { SpeechService } from '../services/speechService';
import { MurfService } from '../services/murfApi';

export function useInterview() {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [awaitingEndConfirmation, setAwaitingEndConfirmation] = useState(false);

  const speechService = useRef(new SpeechService());
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const silenceTimer = useRef<number | null>(null);
  const lastTranscriptAt = useRef<number>(0);

  // Hoisted helper to end the interview safely from anywhere
  function endInterviewNow() {
    if (!session) return;
    speechService.current.stopListening();
    speechService.current.stopSpeaking();
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    setIsListening(false);
    setIsSpeaking(false);
    setAwaitingEndConfirmation(false);
    setSession(prev => prev ? {
      ...prev,
      status: 'completed',
      endTime: new Date()
    } : null);
  }

  const startInterview = useCallback(async (resume: Resume, role: string) => {
    try {
      const questions = QuestionGenerator.generateQuestions(resume, role, 10);
      
      const newSession: InterviewSession = {
        id: `interview-${Date.now()}`,
        resumeId: resume.id,
        role,
        questions,
        responses: [],
        currentQuestionIndex: 0,
        status: 'preparing',
        startTime: new Date(),
      };

      setSession(newSession);
      setError(null);

      // Start with the first question after a brief delay
      setTimeout(async () => {
        await askCurrentQuestion(newSession);
        setSession(prev => prev ? { ...prev, status: 'active' } : null);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview');
    }
  }, []);

  const askCurrentQuestion = useCallback(async (currentSession: InterviewSession) => {
    if (!currentSession || currentSession.currentQuestionIndex >= currentSession.questions.length) {
      return;
    }

    const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
    setIsSpeaking(true);
    setError(null);

    try {
      // Stop any existing audio
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }

      // Try Murf API first
      try {
        const audioUrl = await MurfService.generateSpeech(currentQuestion.question, {
          voiceId: 'en-US-AriaNeural',
          speed: 1.0,
          pitch: 1.0,
          volume: 1.0,
        });

        const audio = new Audio(audioUrl);
        currentAudio.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          currentAudio.current = null;
          // Start listening after a brief pause
          setTimeout(() => {
            startListening();
          }, 500);
        };
        
        audio.onerror = () => {
          console.warn('Murf audio failed, falling back to browser speech');
          fallbackToSpeechSynthesis(currentQuestion.question);
        };
        
        await audio.play();
      } catch (murfError) {
        console.warn('Murf API failed, using browser speech synthesis:', murfError);
        fallbackToSpeechSynthesis(currentQuestion.question);
      }
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      setIsSpeaking(false);
      setError('Failed to play question audio. Please read the question and click "Start Speaking" when ready.');
    }
  }, []);

  const fallbackToSpeechSynthesis = useCallback(async (text: string) => {
    try {
      await speechService.current.speak(text, { rate: 0.9, pitch: 1.0, volume: 1.0 });
      setIsSpeaking(false);
      setTimeout(() => {
        startListening();
      }, 500);
    } catch (error) {
      console.error('Browser speech synthesis failed:', error);
      setIsSpeaking(false);
      setError('Failed to play question audio. Please read the question and click "Start Speaking" when ready.');
    }
  }, []);

  const startListening = useCallback(() => {
    if (isListening || isSpeaking) return;

    setIsListening(true);
    setCurrentTranscript('');
    setError(null);

    speechService.current.startListening(
      (transcript, isFinal) => {
        setCurrentTranscript(transcript);
        lastTranscriptAt.current = Date.now();

        // Silence timeout fallback: if no final in 5000ms, submit or skip
        if (silenceTimer.current) {
          window.clearTimeout(silenceTimer.current);
        }
        silenceTimer.current = window.setTimeout(() => {
          if (!speechService.current.isCurrentlyListening) return;
          speechService.current.stopListening();
          setIsListening(false);
          const finalText = (currentTranscript || transcript).trim();
          if (awaitingEndConfirmation) {
            if (finalText) {
              const lower = finalText.toLowerCase();
              const shouldEnd = /(end|finish|submit|complete|done|stop)/.test(lower) || /yes/.test(lower);
              if (shouldEnd) {
                endInterviewNow();
                return;
              }
            }
            (async () => {
              try {
                setIsSpeaking(true);
                await speechService.current.speak("If you're ready, say 'end interview' to finish.", { rate: 1.0 });
              } catch {}
              setIsSpeaking(false);
              setTimeout(() => startListening(), 400);
            })();
          } else {
            if (finalText) {
              handleResponse(finalText);
            } else if (session) {
              // No transcript captured; skip recording and advance
              const updatedSession = { ...session } as InterviewSession;
              const nextIndex = updatedSession.currentQuestionIndex + 1;
              if (nextIndex >= updatedSession.questions.length) {
                setSession(updatedSession);
                setAwaitingEndConfirmation(true);
                (async () => {
                  try {
                    setIsSpeaking(true);
                    await speechService.current.speak(
                      "That was the final question. If you're ready to finish, say 'end interview' to end the meeting.",
                      { rate: 1.0, pitch: 1.0, volume: 1.0 }
                    );
                  } catch {}
                  setIsSpeaking(false);
                  setTimeout(() => startListening(), 600);
                })();
              } else {
                updatedSession.currentQuestionIndex = nextIndex;
                setSession(updatedSession);
                setTimeout(() => {
                  askCurrentQuestion(updatedSession);
                }, 500);
              }
            }
          }
        }, 5000) as unknown as number;
        // Immediately submit on final result for reliability
        if (isFinal && transcript.trim()) {
          if (silenceTimer.current) {
            window.clearTimeout(silenceTimer.current);
            silenceTimer.current = null;
          }
          speechService.current.stopListening();
          setIsListening(false);
          if (awaitingEndConfirmation) {
            const lower = transcript.toLowerCase();
            const shouldEnd = /(end|finish|submit|complete|done|stop)/.test(lower) || /yes/.test(lower);
            if (shouldEnd) {
              endInterviewNow();
            } else {
              // Re-prompt briefly
              (async () => {
                try {
                  setIsSpeaking(true);
                  await speechService.current.speak("If you're ready, say 'end interview' to finish.", { rate: 1.0 });
                } catch {}
                setIsSpeaking(false);
                setTimeout(() => startListening(), 400);
              })();
            }
          } else {
            handleResponse(transcript);
          }
        }
      },
      (error) => {
        // For transient errors we rely on SpeechService auto-retry. Only surface persistent issues.
        if (error === 'network' || error === 'no-speech' || error === 'aborted') {
          // Keep UI quiet; it will auto-retry.
          return;
        }
        setIsListening(false);
        setError(`Speech recognition error: ${error}. Please try again.`);
      }
    );
  }, [isListening, isSpeaking, awaitingEndConfirmation]);

  const stopListening = useCallback(() => {
    if (!isListening) return;
    
    speechService.current.stopListening();
    setIsListening(false);
    if (silenceTimer.current) {
      window.clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    
    if (currentTranscript.trim()) {
      handleResponse(currentTranscript);
    } else if (session) {
      // Skip recording and advance on manual stop with no transcript
      const updatedSession = { ...session } as InterviewSession;
      const nextIndex = updatedSession.currentQuestionIndex + 1;
      if (nextIndex >= updatedSession.questions.length) {
        setSession(updatedSession);
        setAwaitingEndConfirmation(true);
        (async () => {
          try {
            setIsSpeaking(true);
            await speechService.current.speak(
              "That was the final question. If you're ready to finish, say 'end interview' to end the meeting.",
              { rate: 1.0, pitch: 1.0, volume: 1.0 }
            );
          } catch {}
          setIsSpeaking(false);
          setTimeout(() => startListening(), 600);
        })();
      } else {
        updatedSession.currentQuestionIndex = nextIndex;
        setSession(updatedSession);
        setTimeout(() => {
          askCurrentQuestion(updatedSession);
        }, 500);
      }
    }
  }, [isListening, currentTranscript, session]);

  const handleResponse = useCallback(async (responseText: string) => {
    if (!session || !responseText.trim()) return;

    const currentQuestion = session.questions[session.currentQuestionIndex];
    const response: InterviewResponse = {
      questionId: currentQuestion.id,
      response: responseText.trim(),
      duration: 0,
      timestamp: new Date(),
    };

    const updatedSession = {
      ...session,
      responses: [...session.responses, response],
    };

    // Check if we need a follow-up question (30% chance for detailed responses)
    const followUp = QuestionGenerator.generateFollowUpQuestion(currentQuestion.question, responseText);
    // Always insert a follow-up if one is generated
    if (followUp) {
      const questionsWithFollowUp = [...updatedSession.questions];
      questionsWithFollowUp.splice(updatedSession.currentQuestionIndex + 1, 0, followUp);
      updatedSession.questions = questionsWithFollowUp;
    }

    // Move to next question
    const nextIndex = updatedSession.currentQuestionIndex + 1;
    
    if (nextIndex >= updatedSession.questions.length) {
      // Ask to end the meeting instead of auto-completing
      setSession(updatedSession);
      setAwaitingEndConfirmation(true);
      setIsSpeaking(true);
      try {
        await speechService.current.speak(
          "That was the final question. If you're ready to finish, say 'end interview' to end the meeting.",
          { rate: 1.0, pitch: 1.0, volume: 1.0 }
        );
      } catch (error) {
        console.error('Failed to speak ending prompt:', error);
      }
      setIsSpeaking(false);
      setTimeout(() => startListening(), 600);
    } else {
      // Continue with next question
      updatedSession.currentQuestionIndex = nextIndex;
      setSession(updatedSession);
      
      // Brief acknowledgment before next question
      setIsSpeaking(true);
      try {
        const acknowledgments = [
          "Thank you for that response.",
          "I see, that's interesting.",
          "Good, let's move on to the next question.",
          "Thank you for sharing that.",
        ];
        const acknowledgment = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
        
        await speechService.current.speak(acknowledgment, { rate: 1.0, pitch: 1.0, volume: 1.0 });
        
        // Wait a moment before asking the next question
        setTimeout(() => {
          askCurrentQuestion(updatedSession);
        }, 1000);
      } catch (error) {
        console.error('Failed to speak acknowledgment:', error);
        // Continue to next question anyway
        setTimeout(() => {
          askCurrentQuestion(updatedSession);
        }, 1000);
      }
    }

    setCurrentTranscript('');
    setIsListening(false);
  }, [session, askCurrentQuestion]);

  const pauseInterview = useCallback(() => {
    if (!session) return;
    
    speechService.current.stopListening();
    speechService.current.stopSpeaking();
    
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    
    setIsListening(false);
    setIsSpeaking(false);
    setSession(prev => prev ? { ...prev, status: 'paused' } : null);
  }, [session]);

  const resumeInterview = useCallback(() => {
    if (!session) return;
    
    setSession(prev => prev ? { ...prev, status: 'active' } : null);
    askCurrentQuestion(session);
  }, [session, askCurrentQuestion]);

  const endInterview = useCallback(() => {
    endInterviewNow();
  }, [session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechService.current.stopListening();
      speechService.current.stopSpeaking();
      if (currentAudio.current) {
        currentAudio.current.pause();
      }
    };
  }, []);

  return {
    session,
    isListening,
    isSpeaking,
    currentTranscript,
    error,
    startInterview,
    startListening,
    stopListening,
    pauseInterview,
    resumeInterview,
    endInterview,
  };
}