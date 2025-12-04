// Configurações de ambiente para o sistema de logger

export const LoggerConfig = {
  // Configurações baseadas no ambiente
  isProduction: process.env.NODE_ENV === 'production',
  
  // Buffer e timing
  maxBufferSize: process.env.NODE_ENV === 'production' ? 50 : 100,
  flushInterval: process.env.NODE_ENV === 'production' ? 15000 : 30000, // ms
  
  // Timeout para envio
  sendTimeout: parseInt(process.env.LOGGER_SEND_TIMEOUT || '5000'),
  
  // Níveis de log habilitados
  enabledLevels: {
    INFO: true,
    WARN: true,
    ERROR: true,
    DEBUG: process.env.NODE_ENV === 'development'
  },
  
  // Configurações de retry
  maxRetries: process.env.NODE_ENV === 'production' ? 3 : 1,
  retryDelay: 1000,
  
  // Configurações de produção
  production: {
    // Formato de log estruturado para ELK/Fluentd
    logFormat: 'json',
    
    // Campos obrigatórios em produção
    requiredFields: ['@timestamp', 'level', 'message', 'service', 'environment'],
    
    // Serviço identificador
    serviceName: 'inovaia-web',
    
    // Versão do formato de log
    logVersion: '1.0',
    
    // Compressão para logs grandes
    enableCompression: true,
    
    // Sampling para logs de debug em produção
    debugSampling: 0.1 // 10% dos logs debug
  },
  
  // Configurações de desenvolvimento
  development: {
    logFormat: 'pretty',
    prettyPrint: true,
    colorOutput: true,
    debugSampling: 1.0 // 100% dos logs debug
  }
};

// Validação de configuração
export function validateLoggerConfig(): boolean {
  const config = LoggerConfig;
  
  // Verificações básicas
  if (config.maxBufferSize <= 0) return false;
  if (config.flushInterval <= 0) return false;
  if (config.sendTimeout <= 0) return false;
  
  return true;
}

// Utilitários para ambiente
export const isProduction = () => LoggerConfig.isProduction;
export const isDevelopment = () => !LoggerConfig.isProduction;
export const getLogLevel = () => LoggerConfig.enabledLevels;
export const shouldEnableDebug = () => LoggerConfig.enabledLevels.DEBUG;
