import { ImageResponse } from 'next/og';

export const alt = 'Chambé — Trusted Toronto Contractors';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111111',
          padding: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: '48px solid transparent',
              borderBottom: '48px solid transparent',
              borderLeft: '72px solid #f2c94c',
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: '48px solid transparent',
              borderBottom: '48px solid transparent',
              borderLeft: '72px solid #ffffff',
              marginLeft: -36,
            }}
          />
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: '#ffffff',
            marginBottom: 24,
          }}
        >
          CHAMBÉ
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#f2c94c',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Trusted Toronto Contractors — Without the Hassle
        </div>
      </div>
    ),
    { ...size },
  );
}
