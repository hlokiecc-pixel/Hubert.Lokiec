import React, { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface PhotoPlaceholderProps {
  label: string;
  aspectRatio?: 'square' | 'video' | 'cad';
  currentUrl?: string;
  onImageSelected?: (url: string) => void;
  readOnly?: boolean;
  className?: string;
}

export const PhotoPlaceholder: React.FC<PhotoPlaceholderProps> = ({
  label,
  aspectRatio = 'square',
  currentUrl,
  onImageSelected,
  readOnly = false,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageSelected && !readOnly) {
      try {
        const compressed = await compressImage(file, 800, 0.82);
        onImageSelected(compressed);
      } catch (err) {
        console.error('Failed to compress portrait photo:', err);
      }
    }
    e.target.value = '';
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : 'aspect-[4/3]';

  if (readOnly && !currentUrl) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {currentUrl ? (
        <div
          className={`relative w-full ${aspectClass} rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group`}
        >
          <img
            src={currentUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
          {!readOnly && onImageSelected && (
            <button
              onClick={() => onImageSelected('')}
              title="Remove portrait photo"
              className="absolute top-2 right-2 p-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !readOnly && fileInputRef.current?.click()}
          className={`w-full ${aspectClass} border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/80 hover:bg-slate-100/60 rounded-lg flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors group`}
        >
          <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors mb-2">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-700">{label}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            Click to upload photo
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
};
