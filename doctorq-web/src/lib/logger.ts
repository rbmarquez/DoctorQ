

import { maskUserAgent, maskSensitiveData } from './logger-utils';

interface LogLevel {
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
  DEBUG: 'debug';
}

interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  onLine: boolean;
  screenWidth: number;
  screenHeight: number;
  timeZone: string;
  url: string;
  referrer: string;
}

interface ServerInfo {
  ip: string;
  userAgent: string;
  forwarded: string;
  realIp: string;
  host: string;
  timestamp: string;
}

interface LogEntry {
  level: keyof LogLevel;
  message: string;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  browser?: BrowserInfo;
  server?: ServerInfo;
  context?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private sessionId: string;
  private userId?: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private getBrowserInfo(): BrowserInfo {
    if (typeof window === 'undefined') {
      return {
        userAgent: '',
        language: '',
        platform: '',
        cookieEnabled: false,
        onLine: false,
        screenWidth: 0,
        screenHeight: 0,
        timeZone: '',
        url: '',
        referrer: ''
      };
    }

    return {
      userAgent: maskUserAgent(navigator.userAgent),
      language: navigator.language,
      platform: (navigator as any).userAgentData?.platform || navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: screen.width,
      screenHeight: screen.height,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      url: window.location.href,
      referrer: document.referrer
    };
  }

  private getServerInfo(): ServerInfo {
    if (typeof window === 'undefined') {
      return {
        ip: '',
        userAgent: '',
        forwarded: '',
        realIp: '',
        host: '',
        timestamp: new Date().toISOString()
      };
    }

    // Essas informações serão preenchidas no servidor via headers do nginx
    return {
      ip: '',
      userAgent: maskUserAgent(navigator.userAgent),
      forwarded: '',
      realIp: '',
      host: window.location.host,
      timestamp: new Date().toISOString()
    };
  }

  private createLogEntry(
    level: keyof LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      browser: this.getBrowserInfo(),
      server: this.getServerInfo(),
      context: context ? maskSensitiveData(context) : undefined
    };
  }

  private async sendLogToServer(log: LogEntry): Promise<void> {
    if (typeof window !== 'undefined') return; // Executar apenas no servidor

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: [log] }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (error) {
      // Silencioso para não afetar a performance
      // Em caso de erro, pode implementar retry ou fallback
    }
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('INFO', message, context);
    this.sendLogToServer(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('WARN', message, context);
    this.sendLogToServer(entry);
  }

  error(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('ERROR', message, context);
    this.sendLogToServer(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('DEBUG', message, context);
    this.sendLogToServer(entry);
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }
}

// Singleton instance
export const logger = Logger.getInstance();
