import { ContactInfoCardProps } from '@/types/type';
import React from 'react';

const ContactInfoCard: React.FC<ContactInfoCardProps> = ({ contactInfo }) => {
  return (
    <div className="bg-secondColor/30 shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300 border border-firstColor/20">
      <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${contactInfo.color}`}>
        {contactInfo.icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{contactInfo.title}</h3>
      <div className="space-y-2">
        {contactInfo.content.map((line, index) => (
          <p key={index} className="text-gray-600">{line}</p>
        ))}
      </div>
    </div>
  );
};

export default ContactInfoCard;