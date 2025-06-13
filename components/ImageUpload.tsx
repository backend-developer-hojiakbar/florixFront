import React, { useState, useCallback, useEffect } from 'react';
import { UploadIcon, TrashIcon, PlusCircleIcon } from './icons';
import ImageSourceModal from './ImageSourceModal';
import { MAX_FILE_SIZE_MB, ALLOWED_FILE_TYPES, MIN_IMAGES, MAX_IMAGES } from '../constants';
import { ImageSourceType } from '../types';

interface ImageUploadProps {
  onAnalysisStart: (files: File[]) => void;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onAnalysisStart, disabled }) => {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [stagedPreviews, setStagedPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // Clean up object URLs on unmount or when previews change
  useEffect(() => {
    return () => {
      stagedPreviews.forEach(URL.revokeObjectURL);
    };
  }, [stagedPreviews]);

  const handleFileValidation = (file: File): { isValid: boolean; error?: string } => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { isValid: false, error: `Faqat JPG, PNG formatidagi rasmlar qabul qilinadi (${file.name}).` };
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return { isValid: false, error: `Rasm hajmi ${MAX_FILE_SIZE_MB}MB dan oshmasligi kerak (${file.name}).` };
    }
    return { isValid: true };
  };

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    
    const filesToAdd: File[] = [];
    const previewsToAdd: string[] = [];
    let currentErrors: string[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      if (stagedFiles.length + filesToAdd.length >= MAX_IMAGES) {
        currentErrors.push(`Maksimal ${MAX_IMAGES} ta rasm yuklash mumkin.`);
        break;
      }
      const file = newFiles[i];
      const validation = handleFileValidation(file);
      if (validation.isValid) {
        filesToAdd.push(file);
        previewsToAdd.push(URL.createObjectURL(file));
      } else if (validation.error) {
        currentErrors.push(validation.error);
      }
    }

    setStagedFiles(prev => [...prev, ...filesToAdd]);
    setStagedPreviews(prev => [...prev, ...previewsToAdd]);
    setError(currentErrors.length > 0 ? currentErrors.join('\n') : null);
  };

  const handleModalFilesSelected = (selectedFiles: FileList, sourceType: ImageSourceType) => {
    addFiles(selectedFiles);
    setIsSourceModalOpen(false);
  };

  const removeImage = (index: number) => {
    setError(null);
    URL.revokeObjectURL(stagedPreviews[index]);
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
    setStagedPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (disabled || stagedFiles.length >= MAX_IMAGES) return;
    addFiles(event.dataTransfer.files);
  }, [disabled, stagedFiles.length, addFiles]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && stagedFiles.length < MAX_IMAGES) setIsDragging(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const canStartAnalysis = stagedFiles.length >= MIN_IMAGES && stagedFiles.length <= MAX_IMAGES;

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-xl card-shadow border border-gray-100">
      {stagedFiles.length === 0 && (
        <div
          className={`w-full p-8 border-2 ${isDragging && !disabled ? 'border-green-500 bg-green-50 scale-105' : 'border-dashed border-gray-300'} rounded-2xl text-center transition-all duration-200 ease-in-out ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-green-400 hover:bg-green-50/50'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && setIsSourceModalOpen(true)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Rasm yuklash maydoni"
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <UploadIcon className={`w-16 h-16 ${disabled ? 'text-gray-400' : 'text-green-500 hover:text-green-600'}`} />
            <p className={`text-lg font-semibold ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>
              Rasmlarni shu yerga tashlang yoki bosib tanlang
            </p>
            <p className="text-sm text-gray-500">
              Kamida {MIN_IMAGES}, ko'pi bilan {MAX_IMAGES} ta rasm. Formatlar: JPG, PNG. Hajm: {MAX_FILE_SIZE_MB}MB gacha.
            </p>
          </div>
        </div>
      )}

      {stagedFiles.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Tanlangan rasmlar ({stagedFiles.length}/{MAX_IMAGES}):</h3>
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-${Math.min(MAX_IMAGES, 4)} gap-3 mb-4`}>
            {stagedPreviews.map((previewUrl, index) => (
              <div key={index} className="relative group aspect-square border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <img src={previewUrl} alt={`Yuklangan rasm ${index + 1}`} className="w-full h-full object-cover" />
                {!disabled && (
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1.5 rounded-full opacity-80 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    aria-label={`${index + 1}-rasmni o'chirish`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {stagedFiles.length < MAX_IMAGES && !disabled && (
              <button
                onClick={() => setIsSourceModalOpen(true)}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-500 hover:bg-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                aria-label="Yana rasm qo'shish"
              >
                <PlusCircleIcon className="w-10 h-10 mb-1" />
                <span className="text-xs">Rasm qo'shish</span>
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-2 px-4 py-2 bg-red-50 rounded-md whitespace-pre-wrap">{error}</p>}
      
      <p className="text-sm text-gray-600 my-3">
        {stagedFiles.length < MIN_IMAGES 
            ? `Tahlil uchun kamida ${MIN_IMAGES} ta rasm yuklang.` 
            : stagedFiles.length > MAX_IMAGES 
            ? `Ko'pi bilan ${MAX_IMAGES} ta rasm yuklash mumkin.`
            : `Jami ${stagedFiles.length} ta rasm tanlandi.`
        }
      </p>

      {stagedFiles.length > 0 && (
        <button
          onClick={() => onAnalysisStart(stagedFiles)}
          disabled={!canStartAnalysis || disabled}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {disabled ? 'Tahlil qilinmoqda...' : `Tahlilni Boshlash (${stagedFiles.length} rasm)`}
        </button>
      )}

      <ImageSourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onFilesSelected={handleModalFilesSelected}
        currentFileCount={stagedFiles.length}
      />
    </div>
  );
};

export default ImageUpload;
