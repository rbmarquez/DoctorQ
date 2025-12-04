'use client';

/**
 * VersionFooter - Componente que exibe informações de versão
 *
 * Mostra versão, commit hash e ambiente no footer da aplicação
 */

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  commit: string;
  branch: string;
  buildTime: string;
  environment: string;
}

export function VersionFooter() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    // Buscar informações de versão
    fetch('/api/version')
      .then((res) => res.json())
      .then((data) => setVersionInfo(data))
      .catch(() => {
        // Se falhar, usar valores padrão
        setVersionInfo({
          version: '1.0.0',
          commit: 'unknown',
          branch: 'main',
          buildTime: new Date().toISOString(),
          environment: 'production',
        });
      });
  }, []);

  if (!versionInfo) {
    return null;
  }

  const isDev = versionInfo.environment === 'development';
  const bgColor = isDev ? 'bg-yellow-100' : 'bg-gray-100';
  const textColor = isDev ? 'text-yellow-800' : 'text-gray-600';

  return (
    <footer className={`${bgColor} border-t border-gray-200`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <div className={`flex items-center gap-4 ${textColor}`}>
            <span className="font-semibold">
              DoctorQ v{versionInfo.version}
            </span>
            <span className="hidden sm:inline">
              Commit: <code className="font-mono bg-white px-1 rounded">{versionInfo.commit}</code>
            </span>
            <span className="hidden md:inline">
              Branch: <code className="font-mono bg-white px-1 rounded">{versionInfo.branch}</code>
            </span>
          </div>

          <div className={`flex items-center gap-2 ${textColor}`}>
            {isDev && (
              <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                DEV
              </span>
            )}
            <span className="hidden lg:inline text-xs">
              Build: {new Date(versionInfo.buildTime).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default VersionFooter;
