import React, { useState, useRef, useEffect } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';

interface HelpTooltipProps {
  text: string;
  placement?: 'top' | 'bottom';
  widthClass?: string; // e.g. w-64
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ text, placement = 'bottom', widthClass = 'w-60' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const canHover = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      canHover.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(o => !o);
  };

  const posClasses =
    placement === 'top'
      ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
      : 'top-full mt-2 left-1/2 -translate-x-1/2';

  return (
    <div
      className="relative inline-block select-none"
      ref={ref}
      onMouseEnter={() => { if (canHover.current) show(); }}
      onMouseLeave={() => { if (canHover.current) hide(); }}
    >
      <button
        type="button"
        onClick={toggle}
        onFocus={() => { if (canHover.current) show(); }}
        aria-label="Описание метрики"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-sm"
      >
        <FaQuestionCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          role="tooltip"
            className={`absolute z-30 ${posClasses} ${widthClass} p-2 text-[11px] leading-snug bg-white border border-gray-200 rounded shadow-lg`}
        >
          <div className="text-gray-700">{text}</div>
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
