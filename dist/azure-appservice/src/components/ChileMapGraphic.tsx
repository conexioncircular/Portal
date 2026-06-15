"use client";

export default function ChileMapGraphic() {
  return (
    <div className="relative h-[520px] w-[170px] opacity-90">
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[90px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#18D6B6] opacity-[0.14] blur-3xl" />

      <svg
        viewBox="0 0 100 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute h-full w-full drop-shadow-[0_0_8px_rgba(24,214,182,0.45)]"
      >
        <path
          d="M60 20 Q55 40 50 80 T45 150 T40 220 T45 280 T55 350 L50 380 L40 375 L45 340 Q35 280 30 200 T40 80 Q45 40 50 10 Z"
          stroke="#18D6B6"
          strokeWidth="1.5"
          fill="rgba(24, 214, 182, 0.05)"
          strokeLinejoin="round"
        />

        <path
          d="M52 60 L70 80 L70 120 L48 150 M45 220 L25 240 L25 280 L48 310"
          stroke="#18D6B6"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="opacity-70"
        />
        <path
          d="M48 150 L20 150 L20 200 L42 220"
          stroke="#18D6B6"
          strokeWidth="1"
          className="opacity-50"
        />

        <circle cx="52" cy="60" r="3" fill="white" stroke="#18D6B6" strokeWidth="1.5" />
        <circle cx="70" cy="120" r="2.5" fill="white" stroke="#18D6B6" strokeWidth="1.5" />

        <circle cx="48" cy="150" r="4" fill="#18D6B6" className="animate-pulse" />
        <circle cx="48" cy="150" r="4" fill="none" stroke="white" strokeWidth="1" />

        <circle cx="42" cy="220" r="4" fill="#18D6B6" className="animate-pulse" />
        <circle cx="42" cy="220" r="4" fill="none" stroke="white" strokeWidth="1" />

        <circle cx="25" cy="280" r="2.5" fill="white" stroke="#18D6B6" strokeWidth="1.5" />
        <circle cx="48" cy="310" r="3" fill="white" stroke="#18D6B6" strokeWidth="1.5" />

        <path
          d="M75 180 L85 180 M80 170 L80 190 M77 175 L83 185 M77 185 L83 175"
          stroke="#18D6B6"
          strokeWidth="1"
          className="opacity-60"
        />
        <path
          d="M15 100 L25 100 M20 90 L20 110 M17 95 L23 105 M17 105 L23 95"
          stroke="#18D6B6"
          strokeWidth="1"
          className="opacity-60"
        />
      </svg>
    </div>
  );
}