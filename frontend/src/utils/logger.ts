/**
 * Logger utility for conditional logging based on environment.
 * Debug logs are automatically stripped in production builds.
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Debug logs - only shown in development
   * @param args - Arguments to log
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Info logs - shown in all environments
   * @param args - Arguments to log
   */
  info: (...args: any[]) => {
    console.info(...args);
  },

  /**
   * Warning logs - shown in all environments
   * @param args - Arguments to log
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Error logs - shown in all environments
   * @param args - Arguments to log
   */
  error: (...args: any[]) => {
    console.error(...args);
  },
};
