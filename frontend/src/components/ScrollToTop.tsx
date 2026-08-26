// src/components/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * A client-side route change does not reset the scroll position, so navigating
 * from halfway down /people into /events used to land mid-page. Reset on PUSH
 * and REPLACE only — on POP the browser is restoring a real history entry and
 * the user expects to come back where they left off.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, navigationType]);

  return null;
}
