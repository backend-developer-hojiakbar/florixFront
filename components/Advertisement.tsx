import React from 'react';
import { motion } from 'framer-motion';

// Interfeys yangi ma'lumot formatiga moslashtirildi
interface AdvertisementProps {
  ad: {
    id: number;
    title: string;
    media: string; // media1 va media2 o'rniga yagona 'media' maydoni
    created_at: string;
    expires_at: string;
    is_active: boolean;
    url: string;
  } | null;
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
  const imageUrl = `http://api.florix.uz${ad.media}`;

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