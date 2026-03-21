import React from 'react';
import { Clock, BookOpen, Star } from 'lucide-react';

interface CourseCardProps {
  title: string;
  instructor: string;
  thumbnail: string;
  progress?: number;
  level: string;
  duration: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({ title, instructor, thumbnail, progress, level, duration }) => {
  return (
    <div className="glass glass-card group">
      <div className="relative h-40 mb-4 overflow-hidden rounded-2xl">
        <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-tight">
          {level}
        </div>
      </div>
      
      <h4 className="font-bold text-lg mb-1 line-clamp-1">{title}</h4>
      <p className="text-xs text-text-secondary mb-4">by {instructor}</p>
      
      <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          {duration}
        </div>
        <div className="flex items-center gap-1">
          <BookOpen size={14} />
          12 Modules
        </div>
      </div>

      {progress !== undefined ? (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      ) : (
        <button className="btn btn-glass w-full text-xs font-bold py-2">View Details</button>
      )}
    </div>
  );
};
