import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface VoiceVisualizerProps {
  isActive: boolean;
  type: 'listening' | 'speaking';
}

export function VoiceVisualizer({ isActive, type }: VoiceVisualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(5).fill(0));

  useEffect(() => {
    if (!isActive) {
      setBars(Array(5).fill(0));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 100));
    }, 150);

    return () => clearInterval(interval);
  }, [isActive]);

  const color = type === 'listening' ? '#10B981' : '#2563EB';

  return (
    <div className="flex items-center justify-center space-x-1 h-16">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="w-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            height: isActive ? `${Math.max(height, 20)}%` : '20%',
            opacity: isActive ? 1 : 0.3,
          }}
          transition={{
            duration: 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}