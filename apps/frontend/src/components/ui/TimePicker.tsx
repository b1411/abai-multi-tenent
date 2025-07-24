import React from 'react';

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = "Выберите время",
  required = false,
  className = ""
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default TimePicker;
