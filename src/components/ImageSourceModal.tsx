import React, { useRef } from 'react';
import { CameraIcon, GalleryIcon, XCircleIcon } from './icons';
import { ALLOWED_FILE_TYPES, MAX_IMAGES } from '../constants';
import { ImageSourceType } from '../types';

interface ImageSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: FileList, sourceType: ImageSourceType) => void;
  currentFileCount: number;
}

const ImageSourceModal: React.FC<ImageSourceModalProps> = ({ isOpen, onClose, onFilesSelected, currentFileCount }) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const remainingSlots = MAX_IMAGES - currentFileCount;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, sourceType: ImageSourceType) => {
    if (event.target.files) {
      onFilesSelected(event.target.files, sourceType);
    }
    onClose(); 
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-source-modal-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all duration-300 ease-in-out scale-100"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="image-source-modal-title" className="text-2xl font-semibold text-gray-800">Rasm Manbasini Tanlang</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Yopish"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Eng yaxshi tahlil uchun {MAX_IMAGES} tagacha rasm yuklashingiz mumkin. Hozirda {currentFileCount} ta rasm tanlangan.
          {remainingSlots > 0 ? ` Yana ${remainingSlots} ta rasm qo'shishingiz mumkin.` : " Maksimal rasm soniga yetdingiz."}
        </p>

        <div className="space-y-4">
          <button
            onClick={() => galleryInputRef.current?.click()}
            disabled={remainingSlots <= 0}
            className="w-full flex items-center justify-center text-lg bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <GalleryIcon className="w-6 h-6 mr-3" />
            Galeriyadan Yuklash
          </button>
          <input
            type="file"
            ref={galleryInputRef}
            className="hidden"
            accept={ALLOWED_FILE_TYPES.join(',')}
            multiple
            onChange={(e) => handleFileChange(e, 'gallery')}
          />

          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={remainingSlots <= 0}
            className="w-full flex items-center justify-center text-lg bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white font-medium py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <CameraIcon className="w-6 h-6 mr-3" />
            Kameradan Rasmga Olish
          </button>
          <input
            type="file"
            ref={cameraInputRef}
            className="hidden"
            accept="image/*" // More generic for camera
            capture="environment" // Prioritize back camera
            multiple // Some devices might support multiple captures, most don't
            onChange={(e) => handleFileChange(e, 'camera')}
          />
        </div>
         <p className="text-xs text-gray-500 mt-6 text-center">
            Agar kamera orqali bir nechta rasm olmoqchi bo'lsangiz, har bir rasm uchun jarayonni takrorlashingiz kerak bo'lishi mumkin.
        </p>
      </div>
    </div>
  );
};

export default ImageSourceModal;
