'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>{'حصل خطأ غير متوقع'}</h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>{'تم تسجيل المشكلة، وبنعمل على حلها.'}</p>
          
            href="/"
            style={{
              padding: '10px 20px',
              backgroundColor: '#4f46e5',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            {'الرجوع للصفحة الرئيسية'}
          </a>
        </div>
      </body>
    </html>
  );
}
