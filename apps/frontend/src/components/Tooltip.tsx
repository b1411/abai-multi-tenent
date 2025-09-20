import React, { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  text: string;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, text, className }) => (
  <span className="relative group inline-block">
    {children}
    <span
      className={`absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none ${className || ""}`}
      style={{ minWidth: "60px" }}
    >
      {text}
    </span>
  </span>
);

export default Tooltip;
