import React from 'react';
import { Link } from "@/i18n/navigation";
import Image from 'next/image';

const CategoryCard = ({ name, image }:{name:string;image:string}) => {
  return (
    <Link href="/shop" className="block group">
      <div className="relative overflow-hidden rounded-lg shadow-md">
        <Image
          src={image} 
          alt={name}
          height={500}
          width={500}
          className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <h3 className="text-white text-xl font-bold">{name}</h3>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;