/**
 * API Endpoint - Versão do Sistema
 *
 * Retorna informações sobre a versão atual em produção
 *
 * GET /api/version
 */

import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

interface VersionInfo {
  version: string;
  commit: string;
  branch: string;
  buildTime: string;
  environment: string;
}

export async function GET() {
  try {
    // Tentar obter informações do Git
    let commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'unknown';
    let branch = process.env.NEXT_PUBLIC_BRANCH || 'main';

    // Se não estiver em produção, pegar do Git local
    if (process.env.NODE_ENV === 'development') {
      try {
        commitHash = execSync('git rev-parse --short HEAD').toString().trim();
        branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
      } catch {
        // Ignora erro se git não estiver disponível
      }
    }

    const versionInfo: VersionInfo = {
      version: process.env.npm_package_version || '1.0.0',
      commit: commitHash,
      branch: branch,
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
    };

    return NextResponse.json(versionInfo, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erro ao obter informações de versão:', error);
    return NextResponse.json(
      {
        version: '1.0.0',
        commit: 'unknown',
        branch: 'unknown',
        buildTime: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}
