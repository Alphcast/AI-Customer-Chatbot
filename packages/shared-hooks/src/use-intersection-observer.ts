import { useEffect, useRef, useState, type RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  enabled?: boolean;
  once?: boolean;
}

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {},
): [RefObject<T | null>, boolean] {
  const { threshold = 0, root = null, rootMargin = '0px', enabled = true, once = false } = options;
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const element = ref.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting;
        setIsIntersecting(intersecting);

        if (intersecting && once) {
          observer.unobserve(element);
        }
      },
      { threshold, root, rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, root, rootMargin, enabled, once]);

  return [ref, isIntersecting];
}
