import pino from 'pino';
const logger = pino({
  level: process.env.LOG_LEVEL || 'debug', // Use debug for detailed logging
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  },
  formatters: {
    level: (label) => ({ level: label }),
    log: (object) => ({
      ...object,
      err: object.err ? { name: object.err.name, message: object.err.message, stack: object.err.stack } : undefined
    })
  }
});
export default logger;