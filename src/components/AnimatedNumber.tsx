import React from 'react';
import { useCountUp } from '../hooks/useCountUp';

interface Props {
  value: number;
  className?: string;
  duration?: number;
}

/** Number that counts up with an ease-out motion when it mounts or changes. */
export const AnimatedNumber: React.FC<Props> = ({ value, className, duration }) => {
  const display = useCountUp(value, duration);
  return <span className={className}>{display}</span>;
};
