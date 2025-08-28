import { InterviewQuestion, Resume } from '../types';

export class QuestionGenerator {
  static async generateQuestions(resume: Resume, role: string): Promise<InterviewQuestion[]> {
    try {
      // Extract document text from resume
      const documentText = resume.content || this.createDocumentTextFromResume(resume);
      
      // Generate only the first question initially to avoid rate limiting
      const firstQuestion = await this.generateSingleQuestionWithAI(role, documentText, 0);
      
      const questions: InterviewQuestion[] = [{
        id: `ai-${Date.now()}-0`,
        question: firstQuestion,
        category: 'technical',
        difficulty: this.getRandomDifficulty(),
        expectedDuration: 120,
      }];

      return questions;
    } catch (error) {
      console.error('Error generating questions with AI:', error);
      throw new Error('Unable to generate interview questions. Please check your internet connection and try again.');
    }
  }

  static async generateNextQuestion(resume: Resume, role: string, questionIndex: number): Promise<InterviewQuestion> {
    try {
      const documentText = resume.content || this.createDocumentTextFromResume(resume);
      const question = await this.generateSingleQuestionWithAI(role, documentText, questionIndex);
      
      return {
        id: `ai-${Date.now()}-${questionIndex}`,
        question,
        category: this.getQuestionCategory(questionIndex, 10),
        difficulty: this.getRandomDifficulty(),
        expectedDuration: 120,
      };
    } catch (error) {
      console.error('Error generating next question:', error);
      throw error;
    }
  }

  private static async generateSingleQuestionWithAI(interviewType: string, documentText: string, questionIndex: number): Promise<string> {
    // Use the exact same prompt logic as the Ai-interview folder's llm_handler.py
    const contextualPrompts = [
      `As an expert ${interviewType} interviewer, analyze this resume and ask a challenging technical question that tests specific skills mentioned in the document:`,
      `As an experienced ${interviewType} interviewer, create a behavioral question based on the candidate's experience described in this resume:`,
      `As a senior ${interviewType} interviewer, formulate a situational question that relates to the projects and roles mentioned in this document:`,
      `As a professional ${interviewType} interviewer, ask a role-specific question that evaluates competencies relevant to the position based on this resume:`,
      `As an expert ${interviewType} interviewer, create a problem-solving question that connects to the candidate's background as described in this document:`
    ];

    const selectedPrompt = contextualPrompts[questionIndex % contextualPrompts.length];
    const prompt = `${selectedPrompt}\n\n---\nRESUME CONTENT:\n${documentText}\n---\n\nGenerate ONE specific, open-ended interview question. Make it unique and directly related to the content above. Do not repeat questions. Question ${questionIndex + 1}:`;
    
    // Retry logic for rate limiting
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Add delay before each attempt (exponential backoff)
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 3000; // 3s, 6s, 12s
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyAWF4TvMZMEv7W-MTkNdZzTel324MwrZaE', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.8, // Add randomness to avoid repetitive questions
              maxOutputTokens: 200,
              topP: 0.9,
              topK: 40,
            }
          }),
        });

        if (response.status === 429) {
          console.warn(`Rate limit hit, attempt ${attempt + 1}/3`);
          continue; // Try again with longer delay
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const generatedQuestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (!generatedQuestion) {
          throw new Error('Empty response from Gemini API');
        }

        // Clean up the question (remove any extra formatting)
        return generatedQuestion.replace(/^(Question:|Q:|\d+\.?\s*)/i, '').trim();
      } catch (error) {
        if (attempt === 2) { // Last attempt
          console.error('AI question generation failed after all retries:', error);
          throw error;
        }
        console.warn(`Attempt ${attempt + 1} failed, retrying...`, error);
      }
    }
    
    throw new Error('Failed to generate question after multiple attempts');
  }

  private static createDocumentTextFromResume(resume: Resume): string {
    let text = `Resume for ${resume.fileName || 'Candidate'}\n\n`;
    
    if (resume.skills && resume.skills.length > 0) {
      text += `Skills: ${resume.skills.join(', ')}\n\n`;
    }
    
    if (resume.experience && resume.experience.length > 0) {
      text += `Experience:\n${resume.experience.join('\n')}\n\n`;
    }
    
    if (resume.education && resume.education.length > 0) {
      text += `Education:\n${resume.education.join('\n')}\n\n`;
    }

    if (resume.content) {
      text += `Additional Content:\n${resume.content}`;
    }

    return text;
  }

  private static getQuestionCategory(index: number, total: number): 'technical' | 'behavioral' | 'experience' | 'role-specific' {
    const ratio = index / total;
    if (ratio < 0.3) return 'technical';
    if (ratio < 0.55) return 'behavioral';
    if (ratio < 0.8) return 'experience';
    return 'role-specific';
  }

  static async generateFollowUpQuestion(originalQuestion: string, response: string): Promise<InterviewQuestion | null> {
    const text = response.trim();
    if (!text) return null;

    // Use AI to generate contextual follow-up questions
    const prompt = `Based on this interview question and answer, generate ONE specific follow-up question that digs deeper into their response:

ORIGINAL QUESTION: ${originalQuestion}

CANDIDATE'S ANSWER: ${text}

Generate a follow-up question that:
- Asks for specific examples or details
- Explores the impact or results of their actions
- Challenges them to think deeper about their approach
- Is natural and conversational

Provide only the follow-up question, nothing else.`;

    try {
      const apiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyAWF4TvMZMEv7W-MTkNdZzTel324MwrZaE', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
          }
        }),
      });

      if (!apiResponse.ok) {
        return null; // Fail silently for follow-up questions
      }

      const data = await apiResponse.json();
      const followUpQuestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      if (!followUpQuestion) {
        return null;
      }

      return {
        id: `followup-${Date.now()}`,
        question: followUpQuestion.replace(/^(Question:|Q:|\d+\.?\s*)/i, '').trim(),
        category: 'behavioral',
        difficulty: 'medium',
        expectedDuration: 120,
      };
    } catch (error) {
      console.warn('Follow-up question generation failed:', error);
      return null;
    }
  }

  private static getRandomDifficulty(): 'easy' | 'medium' | 'hard' {
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }
}
