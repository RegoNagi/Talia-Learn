'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

const TITLE_TEXT = '\u062d\u0635\u0644 \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639';
const BODY_TEXT = '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u060c \u0648\u0628\u0646\u0639\u0645\u0644 \u0639\u0644\u0649 \u062d\u0644\u0647\u0627.';
const LINK_TEXT = '\u0627\u0644\u0631\u062c\u0648\u0639 \u0644\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629';

const containerStyle = { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '24px', textAlign: 'center' as const };
const titleStyle = { fontSize: '24px', marginBottom: '12px' };
const bodyStyle = { color: '#666', marginBottom: '24px' };
const linkStyle = { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '8px', textDecoration: 'none' };

export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div style={containerStyle}>
          <h1 style={titleStyle}>{TITLE_TEXT}</h1>
          <p style={bodyStyle}>{BODY_TEXT}</p>
          <a href="/" style={linkStyle}>{LINK_TEXT}</a>
        </div>
      </body>
    </html>
  );
}
