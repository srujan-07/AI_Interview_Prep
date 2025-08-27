import { InterviewQuestion, Resume } from '../types';

export class QuestionGenerator {
  private static readonly QUESTION_TEMPLATES = {
    technical: [
      "Can you explain your experience with {skill}?",
      "How would you approach solving a problem involving {skill}?",
      "What challenges have you faced while working with {skill}?",
      "Can you walk me through a project where you used {skill}?",
    ],
    behavioral: [
      "Tell me about a time when you had to work under pressure.",
      "Describe a situation where you had to work with a difficult team member.",
      "How do you handle constructive criticism?",
      "Tell me about a time you failed and what you learned from it.",
      "Describe your approach to learning new technologies.",
    ],
    experience: [
      "Tell me about your role at {company}.",
      "What was your biggest achievement in your previous position?",
      "How did you contribute to your team's success?",
      "What motivated you to leave your last position?",
    ],
    'role-specific': {
      'software engineer': [
        "How do you ensure code quality in your projects?",
        "Describe your experience with version control systems.",
        "How do you approach debugging complex issues?",
        "What's your experience with agile development methodologies?",
      ],
      'data scientist': [
        "How do you approach data cleaning and preprocessing?",
        "Describe your experience with machine learning algorithms.",
        "How do you validate your models?",
        "What tools do you use for data visualization?",
      ],
      'product manager': [
        "How do you prioritize features in a product roadmap?",
        "Describe your experience with user research.",
        "How do you handle conflicting stakeholder requirements?",
        "What metrics do you use to measure product success?",
      ],
      'marketing manager': [
        "How do you measure the success of marketing campaigns?",
        "Describe your experience with digital marketing channels.",
        "How do you identify target audiences?",
        "What's your approach to brand positioning?",
      ],
    },
  };

  static generateQuestions(resume: Resume, role: string, count: number = 10): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    const roleKey = role.toLowerCase().replace(/\s+/g, ' ');

    // Generate technical questions based on skills (30%)
    const technicalCount = Math.ceil(count * 0.3);
    questions.push(...this.generateTechnicalQuestions(resume.skills, technicalCount));

    // Generate behavioral questions (25%)
    const behavioralCount = Math.ceil(count * 0.25);
    questions.push(...this.generateBehavioralQuestions(behavioralCount));

    // Generate experience-based questions (25%)
    const experienceCount = Math.ceil(count * 0.25);
    questions.push(...this.generateExperienceQuestions(resume.experience, experienceCount));

    // Generate role-specific questions (20%)
    const roleSpecificCount = count - questions.length;
    questions.push(...this.generateRoleSpecificQuestions(roleKey, roleSpecificCount));

    return this.shuffleArray(questions).slice(0, count);
  }

  private static generateTechnicalQuestions(skills: string[], count: number): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    const templates = this.QUESTION_TEMPLATES.technical;

    for (let i = 0; i < count && i < skills.length; i++) {
      const skill = skills[i];
      const template = templates[i % templates.length];
      const question = template.replace('{skill}', skill);

      questions.push({
        id: `tech-${i}`,
        question,
        category: 'technical',
        difficulty: this.getRandomDifficulty(),
        expectedDuration: 120, // 2 minutes
      });
    }

    return questions;
  }

  private static generateBehavioralQuestions(count: number): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    const templates = this.QUESTION_TEMPLATES.behavioral;

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];

      questions.push({
        id: `behavioral-${i}`,
        question: template,
        category: 'behavioral',
        difficulty: 'medium',
        expectedDuration: 180, // 3 minutes
      });
    }

    return questions;
  }

  private static generateExperienceQuestions(experiences: string[], count: number): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    const templates = this.QUESTION_TEMPLATES.experience;

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      let question = template;

      // Try to extract company names from experience
      if (experiences.length > 0 && template.includes('{company}')) {
        const experience = experiences[i % experiences.length];
        const companyMatch = experience.match(/at\s+([A-Z][a-zA-Z\s&]+)/);
        const company = companyMatch ? companyMatch[1] : 'your previous company';
        question = template.replace('{company}', company);
      }

      questions.push({
        id: `exp-${i}`,
        question,
        category: 'experience',
        difficulty: 'medium',
        expectedDuration: 150, // 2.5 minutes
      });
    }

    return questions;
  }

  private static generateRoleSpecificQuestions(role: string, count: number): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    const roleTemplates = this.QUESTION_TEMPLATES['role-specific'][role as keyof typeof this.QUESTION_TEMPLATES['role-specific']] || 
                         this.QUESTION_TEMPLATES['role-specific']['software engineer']; // Default fallback

    for (let i = 0; i < count; i++) {
      const template = roleTemplates[i % roleTemplates.length];

      questions.push({
        id: `role-${i}`,
        question: template,
        category: 'role-specific',
        difficulty: this.getRandomDifficulty(),
        expectedDuration: 180, // 3 minutes
      });
    }

    return questions;
  }

  static generateFollowUpQuestion(originalQuestion: string, response: string): InterviewQuestion | null {
    const text = response.trim();
    if (!text) return null;

    // Extract specific hooks from the response for targeted follow-ups
    const hooks: string[] = [];
    const lower = text.toLowerCase();

    // Find quoted phrases
    const quoted = [...text.matchAll(/"([^"]{3,80})"|'([^']{3,80})'/g)].map(m => (m[1] || m[2]).trim());
    hooks.push(...quoted);

    // Tool/tech keywords
    const techMatches = [...text.matchAll(/\b(node|react|angular|vue|java|python|go|aws|azure|gcp|docker|kubernetes|mysql|postgres|mongodb|redis|graphql|rest)\b/gi)].map(m => m[0]);
    hooks.push(...techMatches);

    // Metrics or numbers
    const metricMatch = text.match(/(\d+\s?%|\$\d+[km]?|\d+\s?(ms|s|sec|min|hours?)|\d+\s?(users?|requests?|tickets?))/i);
    if (metricMatch) hooks.push(metricMatch[0]);

    // Roles/teams
    if (lower.includes('team') || lower.includes('stakeholder')) hooks.push('team collaboration');
    if (lower.includes('deadline')) hooks.push('deadline');
    if (lower.includes('scal')) hooks.push('scalability');
    if (lower.includes('performance')) hooks.push('performance');
    if (lower.includes('security')) hooks.push('security');

    // Pick a salient snippet from response (last sentence with substance)
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.length > 8);
    const salient = sentences[sentences.length - 1] || text;

    // Build targeted prompts
    const prompts: string[] = [];
    if (hooks.length > 0) {
      const key = hooks[Math.floor(Math.random() * hooks.length)];
      prompts.push(`You mentioned ${key}. Could you give a concrete example?`);
      prompts.push(`Can you break down the steps you took around ${key}?`);
      prompts.push(`What was the measurable impact related to ${key}?`);
      prompts.push(`What trade-offs did you consider regarding ${key}?`);
    }
    prompts.push(`What was the hardest part about that, and how did you handle it?`);
    prompts.push(`If you had to do it again, what would you change and why?`);
    prompts.push(`How did you validate success for that approach?`);

    const question = prompts[Math.floor(Math.random() * prompts.length)];
    return {
      id: `followup-${Date.now()}`,
      question,
      category: 'behavioral',
      difficulty: 'medium',
      expectedDuration: 120,
    };
  }

  private static getRandomDifficulty(): 'easy' | 'medium' | 'hard' {
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}