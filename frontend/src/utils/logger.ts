type LogMethod = 'debug' | 'error' | 'info' | 'log' | 'warn';

const isProduction = process.env.NODE_ENV === 'production';

function write(method: LogMethod, args: unknown[]) {
  if (isProduction && method !== 'error') {
    return;
  }

  console[method](...args);
}

export const logger = {
  debug: (...args: unknown[]) => write('debug', args),
  error: (...args: unknown[]) => write('error', args),
  info: (...args: unknown[]) => write('info', args),
  log: (...args: unknown[]) => write('log', args),
  warn: (...args: unknown[]) => write('warn', args),
};
