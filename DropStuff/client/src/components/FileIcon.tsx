import React from 'react';
import {
  FileText,
  Image,
  Archive,
  Code2,
  Video,
  Music,
  File,
} from 'lucide-react';
import { getFileCategory } from '../utils/formatters.js';

interface FileIconProps {
  filename: string;
  mimeType?: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ filename, mimeType, className = 'w-5 h-5' }) => {
  const category = getFileCategory(filename, mimeType);

  switch (category) {
    case 'pdf':
      return <FileText className={`${className} text-red-500`} />;
    case 'image':
      return <Image className={`${className} text-emerald-500`} />;
    case 'archive':
      return <Archive className={`${className} text-amber-500`} />;
    case 'code':
      return <Code2 className={`${className} text-indigo-500`} />;
    case 'video':
      return <Video className={`${className} text-purple-500`} />;
    case 'audio':
      return <Music className={`${className} text-pink-500`} />;
    case 'text':
      return <FileText className={`${className} text-blue-500`} />;
    default:
      return <File className={`${className} text-slate-400`} />;
  }
};
