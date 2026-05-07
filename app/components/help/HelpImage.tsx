import Image from 'next/image';
import React from 'react';

interface HelpImageProps {
  src: string;
  alt: string;
}

const HelpImage: React.FC<HelpImageProps> = ({ src, alt }) => {
  return (
    <div className="w-full h-[250px] bg-gray-100 rounded-lg overflow-hidden">
      <div className="relative w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover object-center"
          priority
        />
      </div>
    </div>
  );
};

export default HelpImage;