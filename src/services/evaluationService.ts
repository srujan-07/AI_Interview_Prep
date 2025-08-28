import { InterviewResponse } from '../types';

export class EvaluationService {
  static async evaluateAnswer(question: string, answer: string): Promise<string> {
    try {
      // Use the same evaluation logic as the Ai-interview folder
      const prompt = `
      You are a meticulous and insightful interview coach. Your task is to provide a highly detailed evaluation of a candidate's answer.

      **INTERVIEW QUESTION:**
      "${question}"
      ---
      **CANDIDATE'S ANSWER:**
      "${answer}"
      ---
      **YOUR TASK:**
      Provide a detailed, multi-part evaluation. You MUST include scores and written analysis for each section.

      **1. Score Breakdown (Format: \`Category: [SCORE]/10\`)**
      You must provide a score for each of the following:
      - Factual Accuracy: [SCORE]/10
      - Relevance & Directness: [SCORE]/10
      - Structure & Clarity (STAR Method): [SCORE]/10

      **2. Detailed Written Evaluation**
      - **Strengths:** What did the candidate do well? (e.g., "Good use of a specific example...")
      - **Areas for Improvement:** What were the key weaknesses? (e.g., "The result of the action was unclear...")

      **3. Concrete Suggestion**
      - **Example Rephrasing:** Provide a short example of how they could have phrased a key part of their answer more effectively.
      `;

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
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not evaluate answer';
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return this.generateFallbackEvaluation(question, answer);
    }
  }

  static async generateHolisticFeedback(responses: InterviewResponse[]): Promise<string> {
    try {
      // Format the interview log
      const interviewLog = responses.map((response, index) => 
        `Question ${index + 1}: ${response.question || 'Question not available'}\nAnswer: ${response.response}\nEvaluation: ${response.evaluation || 'Not evaluated'}\n`
      ).join('\n---\n');

      const prompt = `
      You are a senior career strategist reviewing a candidate's full interview performance.
      Based on the entire Q&A log, provide a detailed "Overall Performance Summary" and an "Actionable Improvement Plan".

      **FULL INTERVIEW LOG:**
      ---
      ${interviewLog}
      ---
      **YOUR TASK:**
      1.  **Overall Performance Summary:** Write a detailed paragraph summarizing the candidate's performance. Analyze their communication style, confidence, and consistency. Identify the most significant recurring strengths and weaknesses across all answers.
      2.  **Actionable Improvement Plan:** Provide a bulleted list of the top 3 most critical and specific actions the candidate must take. For each action, explain *why* it's important and provide a *concrete example*. (e.g., "- Action: Quantify your achievements. Why: It demonstrates impact. Example: Instead of 'improved the system,' say 'reduced server response time by 15%.'").
      `;

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
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not generate holistic feedback';
    } catch (error) {
      console.error('Error generating holistic feedback:', error);
      return this.generateFallbackHolisticFeedback(responses);
    }
  }

  private static generateFallbackEvaluation(question: string, answer: string): string {
    const answerLength = answer.trim().length;
    
    if (answerLength < 50) {
      return "Your answer seems quite brief. Consider providing more detail and specific examples to fully demonstrate your experience and knowledge.";
    } else if (answerLength < 150) {
      return "Good start! Your answer shows understanding of the topic. To strengthen it, consider adding specific examples, metrics, or outcomes that demonstrate your impact.";
    } else {
      return "Thank you for your detailed response. Your answer demonstrates good knowledge and experience. Consider structuring future responses using the STAR method (Situation, Task, Action, Result) for maximum impact.";
    }
  }

  private static generateFallbackHolisticFeedback(responses: InterviewResponse[]): string {
    const totalResponses = responses.length;
    const avgLength = responses.reduce((sum, r) => sum + r.response.length, 0) / totalResponses;
    
    let feedback = `## Overall Performance Summary\n\n`;
    feedback += `You completed ${totalResponses} questions during this interview session. `;
    
    if (avgLength > 200) {
      feedback += `Your responses were generally detailed and comprehensive, which shows good preparation and knowledge depth.\n\n`;
    } else if (avgLength > 100) {
      feedback += `Your responses were of moderate length. Consider providing more specific examples and details in future interviews.\n\n`;
    } else {
      feedback += `Your responses were quite brief. Aim to provide more comprehensive answers with specific examples and outcomes.\n\n`;
    }

    feedback += `## Areas for Improvement\n\n`;
    feedback += `1. **Structure**: Use the STAR method (Situation, Task, Action, Result) to structure your behavioral responses.\n`;
    feedback += `2. **Specificity**: Include specific metrics, technologies, and outcomes in your answers.\n`;
    feedback += `3. **Examples**: Prepare concrete examples that demonstrate your skills and experience.\n\n`;
    
    feedback += `## Next Steps\n\n`;
    feedback += `Continue practicing with mock interviews and focus on providing detailed, structured responses that showcase your achievements and problem-solving abilities.`;

    return feedback;
  }
}
