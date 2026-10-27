import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Universal ScrollToTop Component
 * Resets window scroll position smoothly to top (0, 0) on every client route transition.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Only scroll to top if not performing pagination or in-page filter changes on catalog
    const isCatalogFilter = pathname.startsWith('/catalog') && search.includes('page=');
    if (!isCatalogFilter) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    }
  }, [pathname, search]);

  return null;
}
