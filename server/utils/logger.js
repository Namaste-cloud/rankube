/**
 * Simple structured logger
 */

function getTimestamp() {
  const now = new Date();
  return `[${now.toISOString().replace('T', ' ').substring(0, 19)}]`;
}

function formatMessage(level, message, meta) {
  const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${getTimestamp()} [${level}] ${message}${metaString}`;
}

const logger = {
  info: (message, meta) => {
    console.log(formatMessage('INFO', message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatMessage('WARN', message, meta));
  },
  error: (message, meta) => {
    console.error(formatMessage('ERROR', message, meta));
  },
};

module.exports = logger;
