/**
 * Latency Budget & High-Resolution Performance Monitoring Middleware
 * Enforces the strict <300ms read latency budget mandated by AI-Rules/02-Backend-Rules.md
 */

const LATENCY_BUDGET_MS = 300;

function latencyBudgetMiddleware(budgetMs = LATENCY_BUDGET_MS) {
  return (req, res, next) => {
    const startTime = process.hrtime.bigint();

    // Standard latency budget header
    res.setHeader('X-Latency-Budget', `${budgetMs}ms`);

    // Intercept finish/close to measure exact duration
    const onFinish = () => {
      res.removeListener('finish', onFinish);
      res.removeListener('close', onFinish);

      const endTime = process.hrtime.bigint();
      // Calculate elapsed milliseconds with 2 decimal places
      const elapsedMs = Number(endTime - startTime) / 1e6;
      const formattedElapsed = `${elapsedMs.toFixed(2)}ms`;

      // Set header if headers have not already been sent
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', formattedElapsed);
      }

      // Log latency warning if budget exceeded
      if (elapsedMs > budgetMs && process.env.NODE_ENV !== 'test') {
        console.warn(
          `⚠️ [LATENCY BUDGET EXCEEDED] ${req.method} ${req.originalUrl || req.url} - ${formattedElapsed} (Budget: ${budgetMs}ms)`
        );
      }
    };

    res.on('finish', onFinish);
    res.on('close', onFinish);

    // Also inject early so standard header inspection in Supertest or clients can read it
    const originalWriteHead = res.writeHead;
    res.writeHead = function (...args) {
      const endTime = process.hrtime.bigint();
      const elapsedMs = Number(endTime - startTime) / 1e6;
      res.setHeader('X-Response-Time', `${elapsedMs.toFixed(2)}ms`);
      return originalWriteHead.apply(this, args);
    };

    next();
  };
}

module.exports = latencyBudgetMiddleware;
