import React, { useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FaCalendar, FaCaretDown } from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
}

interface CustomInputProps {
  value?: string;
  onClick?: () => void;
}

// Добавляем стили для календаря
const calendarStyles = `
  .react-datepicker {
    font-family: inherit;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    background: white;
  }
  .react-datepicker__header {
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 8px 8px 0 0;
    padding: 16px 0 8px;
  }
  .react-datepicker__month {
    margin: 0;
    padding: 0.5rem;
  }
  .react-datepicker__day-name {
    color: #6b7280;
    font-weight: 500;
    width: 2rem;
    line-height: 2rem;
    margin: 0.2rem;
  }
  .react-datepicker__day {
    width: 2rem;
    line-height: 2rem;
    margin: 0.2rem;
    border-radius: 4px;
    color: #1f2937;
  }
  .react-datepicker__day:hover {
    background-color: #f3f4f6;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--in-range {
    background-color: #ca181f !important;
    color: white !important;
  }
  .react-datepicker__day--keyboard-selected {
    background-color: #f6cfd3;
    color: white;
  }
  .react-datepicker__day--in-selecting-range {
    background-color: #fbeaec;
  }
  .react-datepicker__current-month {
    color: #1f2937;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 8px;
  }
  .react-datepicker__navigation {
    top: 16px;
  }
  .react-datepicker__navigation--previous {
    left: 16px;
    width: 24px;
    height: 24px;
  }
  .react-datepicker__navigation--next {
    right: 16px;
    width: 24px;
    height: 24px;
  }
  .react-datepicker__navigation-icon::before {
    border-color: #6b7280;
    border-width: 2px 2px 0 0;
    height: 8px;
    width: 8px;
  }
  .react-datepicker-popper {
    z-index: 20;
  }
  .react-datepicker__triangle {
    display: none;
  }
  .react-datepicker__month-container {
    float: left;
    background: white;
    border-radius: 8px;
    margin-right: 1rem;
  }
  .react-datepicker__month-container:last-child {
    margin-right: 0;
  }
`;

const CustomInput = forwardRef<HTMLDivElement, CustomInputProps>(({ value, onClick }, ref) => (
  <div
    className="w-full px-4 py-2.5 border border-gray-200 rounded-md bg-white text-gray-700 flex items-center cursor-pointer hover:border-blue-500 transition-colors shadow-sm"
    onClick={onClick}
    ref={ref}
  >
    <FaCalendar className="text-gray-400 mr-3 text-lg" />
    <span className="flex-1 text-sm font-medium">{value}</span>
    <FaCaretDown className="text-gray-400 ml-2" />
  </div>
));

CustomInput.displayName = 'CustomInput';

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: 'Сегодня', getValue: (): [Date, Date] => {
      const today = new Date();
      return [today, today];
    }},
    { label: 'Вчера', getValue: (): [Date, Date] => {
      const yesterday = subDays(new Date(), 1);
      return [yesterday, yesterday];
    }},
    { label: 'Эта неделя', getValue: (): [Date, Date] => {
      const now = new Date();
      return [startOfWeek(now, { locale: ru }), endOfWeek(now, { locale: ru })];
    }},
    { label: 'Этот месяц', getValue: (): [Date, Date] => {
      const now = new Date();
      return [startOfMonth(now), endOfMonth(now)];
    }},
    { label: '1 семестр', getValue: (): [Date, Date] => {
      const year = new Date().getFullYear();
      return [new Date(year, 8, 1), new Date(year, 11, 31)];
    }},
    { label: '2 семестр', getValue: (): [Date, Date] => {
      const year = new Date().getFullYear();
      return [new Date(year, 0, 15), new Date(year, 4, 31)];
    }},
  ];

  const handlePresetClick = (getValue: () => [Date, Date]) => {
    const [start, end] = getValue() as [Date, Date];
    onChange(start, end);
  };

  return (
    <div className="relative">
      <style>{calendarStyles}</style>
      <div className="relative">
        <DatePicker
          selected={startDate}
          onChange={(dates) => {
            const [start, end] = dates as [Date, Date];
            onChange(start, end);
          }}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          monthsShown={1}
          locale={ru}
          dateFormat="dd.MM.yyyy"
          customInput={<CustomInput />}
          onCalendarOpen={() => setIsOpen(true)}
          onCalendarClose={() => setIsOpen(false)}
          popperClassName="calendar-popper"
          renderCustomHeader={({
            date,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="flex flex-col px-2">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                  type="button"
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-gray-900 font-semibold">
                  {format(date, 'LLLL yyyy', { locale: ru })}
                </div>
                <button
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                  type="button"
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-md whitespace-nowrap transition-colors border border-gray-200"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePresetClick(preset.getValue);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          popperModifiers={[
            {
              name: "offset",
              options: {
                offset: [0, 12],
              },
              fn: (state) => state
            },
            {
              name: "preventOverflow",
              options: {
                rootBoundary: "viewport",
                tether: false,
                altAxis: true,
                padding: 16
              },
              fn: (state) => state
            },
          ]}
          calendarClassName="!bg-white !border-gray-200 !shadow-xl !rounded-lg !p-2"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
