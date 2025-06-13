import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Advertisement } from '../types';

// Interfeys yangi ma'lumot formatiga moslashtirildi
interface AdvertisementProps {
  ad: Advertisement | null;
}

const Advertisement: React.FC<AdvertisementProps> = ({ ad }) => {
  if (!ad) {
    return null;
  }

  const getPlatformName = (url: string) => {
    const platform = url.toLowerCase();
    if (platform.includes('telegram')) return 'Telegram';
    if (platform.includes('instagram')) return 'Instagram';
    if (platform.includes('youtube')) return 'YouTube';
    if (platform.includes('facebook')) return 'Facebook';
    return null;
  };

  const platformName = getPlatformName(ad.url);

  // Rasmning to'liq URL manzilini yaratamiz
  // Backend'dan "/media/..." kabi yo'l keladi, biz uning boshiga server manzilini qo'shamiz
  // Rasmning to'liq URL manzilini yaratamiz
  // Backend'dan "/media/..." kabi yo'l keladi, biz uning boshiga server manzilini qo'shamiz
  // Agar rasm mavjud bo'lmasa, default rasmni qaytarib beramiz
  const imageUrl = ad.media ? `http://api.florix.uz${ad.media}` : 'https://via.placeholder.com/300x200?text=No+Image';

  // Rasm yuklanishini tekshirish
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <motion.div
      className="w-full max-w-[720px] mx-auto rounded-xl shadow-lg overflow-hidden"
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <a
        href={ad.url}
        target="_blank"
        rel="noopener noreferrer"
        title={ad.title}
        className="block relative advertisement-border-animation"
      >
        {platformName && (
          <span className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
            {platformName}
          </span>
        )}

        <div className="relative w-full aspect-[8/1] bg-gray-200">
          {/* 
            <picture> tegi o'rniga yagona <img> ishlatamiz,
            chunki endi faqat bitta rasm manbai mavjud.
          */}
          <img
            src={imageUrl} // To'g'rilangan rasm manzili
            alt={ad.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLElement;
              console.error("Reklama rasmini yuklab bo'lmadi:", imageUrl); // Konsolga xatolikni chiqarish
              if (target.parentElement) {
                target.parentElement.style.display = 'none';
              }
            }}
          />
        </div>
      </a>
    </motion.div>
  );
};

export default Advertisement;