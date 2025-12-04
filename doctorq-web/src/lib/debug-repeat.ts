/*
  Guard for String.prototype.repeat to avoid crashes when called with
  negative or invalid counts. Enabled by default in development and can be
  toggled explicitly with NEXT_PUBLIC_ENABLE_REPEAT_GUARD or the runtime flag
  globalThis.__ENABLE_REPEAT_GUARD.
*/

declare global {
  var __repeatGuardPatched: boolean | undefined;
  var __ENABLE_REPEAT_GUARD: boolean | undefined;
}

const nodeEnv =
  typeof process !== "undefined" && process.env?.NODE_ENV
    ? process.env.NODE_ENV
    : "production";

const explicitEnable =
  typeof process !== "undefined" &&
  process.env?.NEXT_PUBLIC_ENABLE_REPEAT_GUARD === "true";

const explicitDisable =
  typeof process !== "undefined" &&
  process.env?.NEXT_PUBLIC_ENABLE_REPEAT_GUARD === "false";

const runtimeFlag =
  typeof globalThis !== "undefined" &&
  (globalThis as Record<string, unknown>).__ENABLE_REPEAT_GUARD === true;

const shouldPatch =
  !explicitDisable && (explicitEnable || runtimeFlag || nodeEnv !== "production");

if (
  shouldPatch &&
  typeof globalThis !== "undefined" &&
  !globalThis.__repeatGuardPatched &&
  typeof String.prototype.repeat === "function"
) {
  const originalRepeat = String.prototype.repeat;

  const safeRepeat = function (this: string, count: number | string): string {
    try {
      let n = typeof count === "number" ? count : Number(count);
      if (!Number.isFinite(n)) n = 0;
      n = Math.floor(n);

      if (n < 0) {
        const err = new Error("[RepeatGuard] Invalid count for String.repeat");
        if (process.env.NODE_ENV !== "production") {
          console.error("[RepeatGuard] Negative count detected", {
            count: n,
            sample:
              typeof this === "string"
                ? this.slice(0, 50)
                : String(this).slice(0, 50),
            stack: err.stack,
          });
        }
        n = 0;
      }

      return originalRepeat.call(this, n);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[RepeatGuard] Error in patched repeat", error);
      }
      return "";
    }
  } as unknown as (count: number) => string;

  try {
    Object.defineProperty(String.prototype, "repeat", {
      value: safeRepeat,
      writable: true,
      configurable: true,
    });
  } catch {
    (
      String.prototype as unknown as {
        repeat: typeof safeRepeat;
      }
    ).repeat = safeRepeat;
  }

  globalThis.__repeatGuardPatched = true;
}

export {}; // side-effect module
