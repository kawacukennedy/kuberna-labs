import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, BookOpen, ArrowRight } from 'lucide-react';

interface CourseCardProps {
  title: string;
  instructor: string;
  thumbnail: string;
  progress?: number;
  level: string;
  duration: string;
  price?: number;
}

export const CourseCard: React.FC<CourseCardProps> = ({ title, instructor, thumbnail, progress, level, duration, price }) => {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 flex flex-col h-full hover:bg-surface-container transition-colors duration-300 group">
      <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
        <Image 
          src={thumbnail} 
          alt={title} 
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider text-on-surface shadow-sm">
          {level}
        </div>
      </div>
      
      <div className="flex-grow flex flex-col">
        <h4 className="font-medium text-lg mb-1 group-hover:text-primary transition-colors line-clamp-2">{title}</h4>
        <p className="text-xs text-on-surface-variant mb-4">by {instructor}</p>
        
        <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-4 mt-auto">
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
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <span>Course Progress</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary-container transition-all rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-auto">
            {price !== undefined && price > 0 && (
              <span className="text-xl font-bold text-on-surface">${price}</span>
            )}
            {price === 0 && (
              <span className="text-lg font-bold text-secondary">Free</span>
            )}
            <Link href={`/courses/${title.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              View Details <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};