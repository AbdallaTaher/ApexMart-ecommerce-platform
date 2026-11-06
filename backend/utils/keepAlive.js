const https = require('https');
const http = require('http');

/**
 * Self-Ping Keep-Alive Engine
 * Mitigates cold-start delays on free cloud hosting platforms (e.g. Render, Railway)
 * by periodically pinging the public health endpoint every 14 minutes.
 */
function startKeepAlive() {
  const url =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.API_URL ||
    process.env.BACKEND_URL;

  if (!url) {
    return;
  }

  const pingUrl = `${url.replace(/\/$/, '')}/api/v1/health`;
  const intervalMs = 14 * 60 * 1000; // 14 minutes (free tier idle cutoff is 15 minutes)

  console.log(`⏰ [Keep-Alive] Initialized self-ping targeting ${pingUrl} every 14 minutes`);

  setInterval(() => {
    try {
      const client = pingUrl.startsWith('https') ? https : http;
      client
        .get(pingUrl, (res) => {
          if (res.statusCode === 200) {
            console.log(`💓 [Keep-Alive] Pinged ${pingUrl} successfully (status: 200)`);
          } else {
            console.warn(`⚠️ [Keep-Alive] Ping response status: ${res.statusCode}`);
          }
        })
        .on('error', (err) => {
          console.warn(`⚠️ [Keep-Alive] Ping failed: ${err.message}`);
        });
    } catch (err) {
      console.warn(`⚠️ [Keep-Alive] Execution error: ${err.message}`);
    }
  }, intervalMs);
}

module.exports = startKeepAlive;

