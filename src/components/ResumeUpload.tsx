import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Resume } from '../types';

interface ResumeUploadProps {
  onResumeUpload: (resume: Partial<Resume>) => void;
  uploadedResume?: Resume;
  onRemoveResume?: () => void;
}

export function ResumeUpload({ onResumeUpload, uploadedResume, onRemoveResume }: ResumeUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      // Simple text extraction for demo
      const content = await file.text();
      
      const resume: Partial<Resume> = {
        fileName: file.name,
        content,
        skills: extractSkills(content),
        experience: extractExperience(content),
        education: extractEducation(content),
        uploadedAt: new Date(),
      };

      onResumeUpload(resume);
    } catch (error) {
      console.error('Error processing resume:', error);
    }
  }, [onResumeUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  if (uploadedResume) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{uploadedResume.fileName}</h3>
              <p className="text-sm text-gray-500">
                {uploadedResume.skills.length} skills • {uploadedResume.experience.length} experiences
              </p>
            </div>
          </div>
          {onRemoveResume && (
            <button
              onClick={onRemoveResume}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1">
              {uploadedResume.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {skill}
                </span>
              ))}
              {uploadedResume.skills.length > 3 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  +{uploadedResume.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3">
            <h4 className="font-medium text-green-900 mb-2">Experience</h4>
            <p className="text-sm text-green-700">
              {uploadedResume.experience.length} positions found
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3">
            <h4 className="font-medium text-purple-900 mb-2">Education</h4>
            <p className="text-sm text-purple-700">
              {uploadedResume.education.length} entries found
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200"
    >
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <motion.div
            animate={{ scale: isDragActive ? 1.1 : 1 }}
            className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4"
          >
            <Upload className="w-8 h-8 text-blue-600" />
          </motion.div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
          </h3>
          
          <p className="text-gray-500 mb-4">
            Drag and drop your resume file, or click to browse
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-400">
            <span className="px-3 py-1 bg-gray-100 rounded-full">PDF</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">DOC</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">DOCX</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">TXT</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper functions for resume parsing
function extractSkills(content: string): string[] {
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

function extractExperience(content: string): string[] {
  // Simple extraction - look for common patterns
  const lines = content.split('\n');
  const experiences: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/\d{4}.*-.*\d{4}|present/i) || 
        line.toLowerCase().includes('experience') ||
        line.toLowerCase().includes('work')) {
      experiences.push(line);
    }
  }
  
  return experiences.slice(0, 5);
}

function extractEducation(content: string): string[] {
  const lines = content.split('\n');
  const education: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().includes('university') ||
        line.toLowerCase().includes('college') ||
        line.toLowerCase().includes('degree') ||
        line.toLowerCase().includes('bachelor') ||
        line.toLowerCase().includes('master')) {
      education.push(line);
    }
  }
  
  return education.slice(0, 3);
}