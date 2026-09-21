// OptionCard.jsx
import React from 'react';

const OptionCard = ({ icon, label, onClick, isImage = false, scale = 1, renderIcon, badge }) => {
  return (
    <button
      onClick={onClick}
      className="relative group flex flex-col items-center gap-1.5 lg:gap-3 w-full max-w-[10rem] lg:max-w-[11rem] mx-auto"
    >
      {badge && (
          <div className="absolute -top-2 -right-1 z-10 bg-[#00e676] text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm tracking-wider uppercase animate-pulse">
              {badge}
          </div>
      )}
      <div className="flex items-center justify-center w-full aspect-square lg:aspect-[11/9] bg-white/60 backdrop-blur-2xl rounded-2xl lg:rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] group-hover:shadow-[0_15px_50px_rgba(0,0,0,0.08)] group-hover:bg-white/80 group-hover:scale-[1.03] transition-all duration-500 border border-white/80 p-2 lg:p-4">
        <div
          className="flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
          style={{ width: `${scale * 80}%`, height: `${scale * 80}%` }}
        >
          {renderIcon ? renderIcon() : <img src={icon} alt={label} className="max-h-full max-w-full object-contain" />}
        </div>
      </div>
      <span
        className="text-[10px] lg:text-[13px] font-medium text-gray-700 text-center group-hover:text-black leading-tight transition-colors duration-300"
        style={{ letterSpacing: '2px' }}
      >
        {label}
      </span>
    </button>
  );
};

export default OptionCard;



