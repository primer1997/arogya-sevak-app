import React, { useMemo } from 'react';
import { Activity, HeartPulse, Plus, Stethoscope } from 'lucide-react';

/* कर्मचारी + PHC दोन्ही headers साठी सामायिक live decorations:
   ECG heartbeat line, तरंगणारी सूक्ष्म icons, drifting glow.
   गडद navy header वरच वापरायचे — पांढऱ्या background वर नाही. */
export const LiveHeaderFx: React.FC = () => {
  // ECG हार्टबीट लाईनचा path — दर 200px ला एक ठोका
  const ecgPath = useMemo(() => {
    const beats: string[] = [];
    for (let x = 0; x < 1200; x += 200) {
      beats.push(
        `M${x} 16 h46 l7 -4 l7 4 h28 l5 3 l4 -17 l6 25 l5 -11 h42 q9 -7 18 0 h32`,
      );
    }
    return beats.join(' ');
  }, []);

  return (
    <>
      {/* तरंगणारे glow */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#f39c12]/15 blur-3xl animate-drift" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-10 w-64 h-64 rounded-full bg-sky-400/10 blur-3xl animate-drift" style={{ animationDelay: '-11s' }} />
      {/* तरंगणारी सूक्ष्म आरोग्य icons — bobbing animation सह जिवंत */}
      <HeartPulse aria-hidden className="pointer-events-none absolute top-3 left-[12%] w-8 h-8 text-white/15 animate-icon-bob" style={{ animationDelay: '-1.5s', animationDuration: '5.5s' }} />
      <Plus aria-hidden className="pointer-events-none absolute bottom-6 right-[18%] w-6 h-6 text-white/15 animate-icon-bob" style={{ animationDelay: '-3.2s', animationDuration: '7s' }} />
      <Activity aria-hidden className="pointer-events-none absolute top-4 right-[38%] w-7 h-7 text-white/15 animate-icon-bob" style={{ animationDelay: '-4.6s', animationDuration: '6.2s' }} />
      <Stethoscope aria-hidden className="pointer-events-none absolute bottom-8 left-[42%] w-6 h-6 text-white/15 animate-icon-bob" style={{ animationDelay: '-2.4s', animationDuration: '6.8s' }} />
      {/* ECG हार्टबीट लाईन — आरोग्य थीमची सही */}
      <svg aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-7 w-full" viewBox="0 0 1200 28" preserveAspectRatio="none">
        <path d={ecgPath} fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="2" />
        <path
          d={ecgPath}
          fill="none"
          stroke="#f5b942"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="130 1070"
          className="animate-ecg"
        />
      </svg>
    </>
  );
};
