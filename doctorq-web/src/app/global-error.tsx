"use client";

// Global error boundary for App Router
// Captures errors thrown during rendering on the client

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  console.error('[GlobalError] Render error captured', error);
  return (
    <html>
      <body>
        <main style={{ padding: 24, fontFamily: 'system-ui' }}>
          <h1>Algo deu errado</h1>
          <p>{error.message}</p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
          <button onClick={() => reset()} style={{ marginTop: 16, padding: 8 }}>
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}