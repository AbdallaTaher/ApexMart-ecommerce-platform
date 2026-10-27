import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect clicks outside of a referenced element
 *
 * @param {Function} handler - Callback to execute when click outside occurs
 * @param {boolean} [listenCapturing=true] - Event propagation capture phase flag
 * @returns {React.RefObject} Ref to attach to target container
 */
export function useOutsideClick(handler, listenCapturing = true) {
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        handler();
      }
    }

    document.addEventListener('click', handleClick, listenCapturing);

    return () => document.removeEventListener('click', handleClick, listenCapturing);
  }, [handler, listenCapturing]);

  return ref;
}
