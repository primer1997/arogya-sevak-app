import React, { useId } from 'react';

/* पांढऱ्या background वर धडधडणारे हृदय + त्यातून जाणारी ECG लाईन.
   स्पंदन हृदयावर येताच ठोका पडतो — 1.8s cycle मध्ये sync.
   अहवाल टॅबच्या वर decorative strip म्हणून वापरायचे. */
const TRACE_D =
  'M0,76 H240 l10,-7 l10,7 H272 l5,6 l6,-34 l7,58 l6,-30 H310 q12,-10 24,0 H600';

export const BeatingHeartEcg: React.FC<{ className?: string }> = ({ className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const heartGradId = `bhHeart${uid}`;
  const blurId = `bhBlur${uid}`;

  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-xs print:hidden ${className}`}
    >
      <svg viewBox="0 0 600 140" className="h-24 w-full sm:h-28" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={heartGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fb7185" />
            <stop offset="1" stopColor="#e11d48" />
          </linearGradient>
          <filter id={blurId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        {/* हृदयाभोवती ठोक्यासोबत चमकणारी आभा */}
        <ellipse
          cx="290"
          cy="82"
          rx="48"
          ry="34"
          fill="#fda4af"
          filter={`url(#${blurId})`}
          className="animate-heart-glow"
        />
        {/* पूर्ण डावीकडून उजवीकडे draw होणारी ECG लाईन (pathLength मुळे लांबीची चिंता नाही) */}
        <path
          d={TRACE_D}
          pathLength={100}
          fill="none"
          stroke="#e11d48"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="100"
          className="animate-ecg-draw"
        />
        {/* धडधडणारे हृदय — spike त्यातूनच जातो */}
        <g transform="translate(269,61) scale(1.75)">
          <g
            className="animate-heart-thump"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={`url(#${heartGradId})`}
            />
          </g>
        </g>
      </svg>
    </div>
  );
};
