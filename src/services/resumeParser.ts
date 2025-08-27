import { Resume } from '../types';

export class ResumeParser {
  static async parseResume(file: File): Promise<Partial<Resume>> {
    const content = await this.extractTextFromFile(file);
    
    return {
      fileName: file.name,
      content,
      skills: this.extractSkills(content),
      experience: this.extractExperience(content),
      education: this.extractEducation(content),
    };
  }

  private static async extractTextFromFile(file: File): Promise<string> {
    if (file.type === 'text/plain') {
      return await file.text();
    }
    
    if (file.type === 'application/pdf') {
      // For demo purposes, we'll simulate PDF parsing
      // In production, you'd use a library like pdf-parse
      return `[PDF Content from ${file.name}]\n\nThis is a simulated extraction from a PDF resume. In a real implementation, this would contain the actual parsed text from the PDF file.`;
    }

    // For other file types, try to read as text
    try {
      return await file.text();
    } catch {
      throw new Error('Unsupported file format');
    }
  }

  private static extractSkills(content: string): string[] {
    const skillsSection = this.findSection(content, ['skills', 'technical skills', 'technologies']);
    if (!skillsSection) return [];

    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
      'Git', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'Machine Learning', 'AI',
      'Data Analysis', 'Project Management', 'Leadership', 'Communication'
    ];

    return commonSkills.filter(skill => 
      content.toLowerCase().includes(skill.toLowerCase())
    );
  }

  private static extractExperience(content: string): string[] {
    const experienceSection = this.findSection(content, ['experience', 'work experience', 'employment']);
    if (!experienceSection) return [];

    // Simple extraction - split by common patterns
    const experiences = experienceSection
      .split(/\n\s*\n/)
      .filter(exp => exp.trim().length > 20)
      .slice(0, 5); // Limit to 5 experiences

    return experiences;
  }

  private static extractEducation(content: string): string[] {
    const educationSection = this.findSection(content, ['education', 'academic background']);
    if (!educationSection) return [];

    const education = educationSection
      .split(/\n\s*\n/)
      .filter(edu => edu.trim().length > 10)
      .slice(0, 3); // Limit to 3 education entries

    return education;
  }

  private static findSection(content: string, sectionNames: string[]): string | null {
    const lines = content.split('\n');
    
    for (const sectionName of sectionNames) {
      const sectionIndex = lines.findIndex(line => 
        line.toLowerCase().includes(sectionName.toLowerCase())
      );
      
      if (sectionIndex !== -1) {
        // Find the next section or end of content
        let endIndex = lines.length;
        for (let i = sectionIndex + 1; i < lines.length; i++) {
          if (lines[i].match(/^[A-Z\s]+:?\s*$/)) {
            endIndex = i;
            break;
          }
        }
        
        return lines.slice(sectionIndex + 1, endIndex).join('\n');
      }
    }
    
    return null;
  }
}