import React from 'react';
import Image from 'next/image';
import { Clock, BookOpen, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
    <div className="glass glass-card group flex flex-col h-full">
      <div className="relative h-48 mb-5 overflow-hidden rounded-2xl">
        <Image 
          src={thumbnail} 
          alt={title} 
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider text-text-primary shadow-sm">
          {level}
        </div>
      </div>
      
      <div className="flex-grow flex flex-col">
        <h4 className="font-bold text-lg mb-1 font-heading group-hover:text-primary transition-colors line-clamp-1">{title}</h4>
        <p className="text-xs text-text-secondary mb-4 font-medium italic">by {instructor}</p>
        
        <div className="flex items-center gap-4 text-xs text-text-secondary mb-6 mt-auto">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-primary" />
            <span className="font-semibold">{duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-primary" />
            <span className="font-semibold">12 Modules</span>
          </div>
        </div>

        {progress !== undefined ? (
          <div className="space-y-2.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              <span>Course Progress</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-glass-border">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-1000 ease-out rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <button className="btn btn-glass w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2 group/btn">
            View Details <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
