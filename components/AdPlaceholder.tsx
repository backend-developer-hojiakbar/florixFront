import React from 'react';

interface AdPlaceholderProps {
  text?: string;
  className?: string;
  label?: string;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({
  text = "Reklama Maydoni",
  className = '',
  label = "Reklama"
}) => {
  return (
    <div
      className={`bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center p-6 min-h-[90px] text-center relative card-shadow ${className}`}
      aria-label="Reklama maydoni"
    >
      <span className="text-gray-500 text-base sm:text-lg font-medium">{text}</span>
      <div className="absolute top-1.5 right-1.5 bg-gray-400 text-white text-xs px-2 py-0.5 rounded opacity-80">
        {label}
      </div>
    </div>
  );
};

export default AdPlaceholder;
