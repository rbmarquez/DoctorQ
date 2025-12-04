// Global instrumentation for Next.js (App Router)
// Runs on server startup; logs environment and captures unhandled errors

const registered = (globalThis as any).__instrumentationRegistered as boolean | undefined;

export async function register() {
  if (registered) return;
  (globalThis as any).__instrumentationRegistered = true;

  try {
    // Edge/runtime-safe environment info (avoid Node-only APIs like process.on)
    const env = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) ? process.env.NODE_ENV : 'development';
    const nodeVersion = (typeof process !== 'undefined' && process.version) ? process.version : 'undefined';
    console.log(`[Instrumentation] Starting Next.js (env: ${env}, node: ${nodeVersion})`);

    // Capture unhandled errors only if supported (Node runtime); skip on Edge
    const canUseProcessOn = typeof process !== 'undefined' && typeof (process as any).on === 'function';
    if (canUseProcessOn) {
      (process as any).on('uncaughtException', (err: any) => {
        console.error('[Instrumentation] uncaughtException', err);
      });

      (process as any).on('unhandledRejection', (reason: any) => {
        console.error('[Instrumentation] unhandledRejection', reason);
      });
    }

    // Enhance console.error to include stack when available
    const origError = console.error;
    console.error = (...args: any[]) => {
      try {
        const withStack = args.map((a) => {
          if (a instanceof Error) {
            return `${a.name}: ${a.message}\n${a.stack ?? ''}`;
          }
          return a;
        });
        origError.apply(console, withStack as any);
      } catch {
        origError.apply(console, args as any);
      }
    };
  } catch (e) {
    console.error('[Instrumentation] Failed to initialize', e);
  }
}
