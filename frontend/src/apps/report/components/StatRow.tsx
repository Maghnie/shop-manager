import React from "react";

interface StatRowProps {
  label: string;
  value: React.ReactNode;
}

export const StatRow: React.FC<StatRowProps> = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);
