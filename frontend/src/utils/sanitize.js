import DOMPurify from 'dompurify';

/**
 * Enterprise XSS Sanitization Utility (OWASP Compliance - Module 01/03)
 * Strips malicious script tags, javascript: URI schemas, SVG payloads,
 * and dangerous event handler attributes (onload, onerror, onclick, etc.).
 *
 * @param {string} dirtyHtml - Raw unsanitized string or HTML snippet
 * @param {Object} [options] - Custom DOMPurify configuration overrides
 * @returns {string} - Clean, hardened HTML safe for DOM rendering
 */
export function sanitizeHtml(dirtyHtml, options = {}) {
  if (typeof dirtyHtml !== 'string') return '';

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'span',
      'code',
      'pre',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'h4',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'title'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
    FORCE_BODY: false,
    ...options,
  });
}

/**
 * Strips all HTML tags entirely, producing pure safe plain text
 *
 * @param {string} dirtyString - Raw string containing possible HTML tags
 * @returns {string} - Pure plain text with zero HTML tags
 */
export function sanitizePlainText(dirtyString) {
  if (typeof dirtyString !== 'string') return '';
  return DOMPurify.sanitize(dirtyString, { ALLOWED_TAGS: [] }).trim();
}
