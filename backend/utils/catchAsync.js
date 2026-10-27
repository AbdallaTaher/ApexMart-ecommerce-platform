/**
 * Higher-order async handler wrapper to eliminate repetitive try/catch blocks
 * in Express controllers. Automatically passes any rejected promise error to next().
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware handler
 */
module.exports = (fn) => {
  return (req, res, next) => {
    return fn(req, res, next).catch(next);
  };
};
