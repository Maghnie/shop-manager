import React, { useState, useEffect } from 'react';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = ''
}) => {
  const [dateError, setDateError] = useState('');

  const validateDateRange = (fromDate: string, toDate: string) => {
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setDateError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleStartDateChange = (value: string) => {
    onStartDateChange(value);
    validateDateRange(value, endDate);
  };

  const handleEndDateChange = (value: string) => {
    onEndDateChange(value);
    validateDateRange(startDate, value);
  };

  useEffect(() => {
    if (startDate && endDate) {
      validateDateRange(startDate, endDate);
    }
  }, [startDate, endDate]);

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:space-x-4 sm:space-x-reverse space-y-4 sm:space-y-0">
        {/* From Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              dateError ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              dateError ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        </div>
      </div>

      {/* Date Error */}
      {dateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-red-800 text-sm">{dateError}</div>
        </div>
      )}
    </div>
  );
};