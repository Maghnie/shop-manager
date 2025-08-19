import React from "react";
import { Info } from "lucide-react";

interface Props {
  tags: string[];
}

const ProductTags: React.FC<Props> = ({ tags }) => {
  if (!tags || tags.length === 0) return <span className="text-xs text-gray-400">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag, idx) => (
        <span
          key={idx}
          className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full"
        >
          {tag}
        </span>
      ))}
      {tags.length > 3 && (
        <div className="relative group inline-block">
          <span className="text-xs text-gray-500 cursor-pointer flex items-center gap-1">
            +{tags.length - 3}
            <Info size={12} className="text-gray-400" />
          </span>
          <div className="absolute z-10 hidden group-hover:flex flex-wrap bg-white shadow-lg rounded-lg p-2 text-xs text-gray-700 w-48 bottom-full mb-2">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full m-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTags;
