import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCountdownReturn {
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  totalSeconds: number;
  isExpired: boolean;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  restart: (newTotalSeconds: number) => void;
}

export function useCountdown(totalSeconds: number, autoStart = true): UseCountdownReturn {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setIsRunning(true);
  }, [clearTimer]);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (remaining > 0) {
      setIsRunning(true);
    }
  }, [remaining]);

  const reset = useCallback(() => {
    clearTimer();
    setRemaining(totalSeconds);
    setIsRunning(false);
  }, [totalSeconds, clearTimer]);

  const restart = useCallback(
    (newTotalSeconds: number) => {
      clearTimer();
      setRemaining(newTotalSeconds);
      setIsRunning(true);
    },
    [clearTimer],
  );

  useEffect(() => {
    if (!isRunning || remaining <= 0) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, remaining, clearTimer]);

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return {
    seconds,
    minutes,
    hours,
    days,
    totalSeconds: remaining,
    isExpired: remaining <= 0,
    isRunning,
    start,
    pause,
    resume,
    reset,
    restart,
  };
}
