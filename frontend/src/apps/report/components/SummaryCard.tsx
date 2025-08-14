import React from "react";

interface SummaryCardProps {
  title: string;
  bgColorClass: string;
  children: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, bgColorClass, children }) => (
  <div className={`${bgColorClass} rounded-lg p-6`}>
    <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
    {children}
  </div>
);
