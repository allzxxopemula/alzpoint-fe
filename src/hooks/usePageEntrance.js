import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { areGsapAnimationsEnabled, GSAP_PREFERENCE_EVENT } from '../utils/gsapPreference';

export default function usePageEntrance({ duration = 0.65, stagger = 0.08, y = 18, ease = 'power2.out', fromOpacity = 0 } = {}) {
  const pageRef = useRef(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let context;
    const playEntrance = () => {
      context?.revert();
      context = undefined;
      if (!areGsapAnimationsEnabled()) return;

      context = gsap.context(() => {
        const markedElements = page.querySelectorAll('[data-gsap-reveal]');
        const targets = markedElements.length ? markedElements : Array.from(page.children);

        gsap.fromTo(
          targets,
          { autoAlpha: fromOpacity, y },
          {
            autoAlpha: 1,
            y: 0,
            duration,
            stagger,
            ease,
            clearProps: 'opacity,transform',
          },
        );
      }, page);
    };

    const handlePreferenceChange = (event) => {
      if (event.detail?.enabled) playEntrance();
      else {
        context?.revert();
        context = undefined;
      }
    };

    playEntrance();
    window.addEventListener(GSAP_PREFERENCE_EVENT, handlePreferenceChange);

    return () => {
      window.removeEventListener(GSAP_PREFERENCE_EVENT, handlePreferenceChange);
      context?.revert();
    };
  }, [duration, stagger, y, ease, fromOpacity]);

  return pageRef;
}