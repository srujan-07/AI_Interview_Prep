import React from 'react';
import { motion } from 'framer-motion';
import { Code, BarChart3, Users, Megaphone, Briefcase, Palette } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: string;
  onRoleSelect: (role: string) => void;
}

const roles = [
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    icon: Code,
    description: 'Technical coding and system design questions',
    color: 'blue',
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    icon: BarChart3,
    description: 'Analytics, ML, and statistical modeling',
    color: 'green',
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    icon: Users,
    description: 'Strategy, roadmaps, and stakeholder management',
    color: 'purple',
  },
  {
    id: 'marketing-manager',
    title: 'Marketing Manager',
    icon: Megaphone,
    description: 'Campaigns, branding, and growth strategies',
    color: 'orange',
  },
  {
    id: 'business-analyst',
    title: 'Business Analyst',
    icon: Briefcase,
    description: 'Process improvement and requirements analysis',
    color: 'indigo',
  },
  {
    id: 'ux-designer',
    title: 'UX Designer',
    icon: Palette,
    description: 'User research, design thinking, and prototyping',
    color: 'pink',
  },
];

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    selectedBg: 'bg-blue-100',
    selectedBorder: 'border-blue-500',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    description: 'text-blue-700',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    selectedBg: 'bg-green-100',
    selectedBorder: 'border-green-500',
    icon: 'text-green-600',
    title: 'text-green-900',
    description: 'text-green-700',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    selectedBg: 'bg-purple-100',
    selectedBorder: 'border-purple-500',
    icon: 'text-purple-600',
    title: 'text-purple-900',
    description: 'text-purple-700',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    selectedBg: 'bg-orange-100',
    selectedBorder: 'border-orange-500',
    icon: 'text-orange-600',
    title: 'text-orange-900',
    description: 'text-orange-700',
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    selectedBg: 'bg-indigo-100',
    selectedBorder: 'border-indigo-500',
    icon: 'text-indigo-600',
    title: 'text-indigo-900',
    description: 'text-indigo-700',
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    selectedBg: 'bg-pink-100',
    selectedBorder: 'border-pink-500',
    icon: 'text-pink-600',
    title: 'text-pink-900',
    description: 'text-pink-700',
  },
};

export function RoleSelector({ selectedRole, onRoleSelect }: RoleSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-4">Select Interview Role</h2>
      <p className="text-gray-600 mb-6">Choose the position you're interviewing for to get tailored questions</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          const colors = colorClasses[role.color as keyof typeof colorClasses];
          const Icon = role.icon;
          
          return (
            <motion.button
              key={role.id}
              onClick={() => onRoleSelect(role.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? `${colors.selectedBg} ${colors.selectedBorder}`
                  : `${colors.bg} ${colors.border} hover:${colors.selectedBg}`
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <Icon className={`w-6 h-6 ${colors.icon}`} />
                <h3 className={`font-semibold ${colors.title}`}>{role.title}</h3>
              </div>
              <p className={`text-sm ${colors.description}`}>{role.description}</p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}