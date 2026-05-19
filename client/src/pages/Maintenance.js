import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const spinReverse = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const GearIcon = ({ size, color, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.34.07-.68.07-1.08s-.03-.74-.07-1.08l2.32-1.81c.21-.16.27-.45.13-.69l-2.2-3.81c-.13-.24-.42-.32-.66-.24l-2.74 1.1c-.57-.44-1.18-.79-1.85-1.06L14.92 2.1C14.87 1.84 14.65 1.67 14.4 1.67h-4.4c-.25 0-.47.17-.52.43L9.1 4.41C8.43 4.68 7.82 5.03 7.25 5.47L4.51 4.37c-.24-.09-.53 0-.66.24L1.65 8.42c-.14.23-.08.53.13.69l2.32 1.81C4.06 11.26 4 11.61 4 12s.06.74.1 1.08L1.78 14.9c-.21.16-.27.45-.13.69l2.2 3.81c.13.24.42.32.66.24l2.74-1.1c.57.44 1.18.79 1.85 1.06l.38 2.91c.05.26.27.43.52.43h4.4c.25 0 .47-.17.52-.43l.38-2.91c.67-.27 1.28-.62 1.85-1.06l2.74 1.1c.24.09.53 0 .66-.24l2.2-3.81c.14-.24.08-.53-.13-.69l-2.32-1.8z"/>
  </svg>
);

const Dot = ({ delay }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: '#578A18',
      mx: 0.5,
      animation: `${pulse} 1.4s ease-in-out infinite`,
      animationDelay: delay,
    }}
  />
);

const Maintenance = ({ message }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Background decorative circles */}
      {[
        { size: 400, top: '-10%', left: '-10%', opacity: 0.04 },
        { size: 300, bottom: '-5%', right: '-5%', opacity: 0.05 },
        { size: 200, top: '40%', right: '10%', opacity: 0.03 },
      ].map((circle, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: circle.size,
            height: circle.size,
            borderRadius: '50%',
            border: '1px solid rgba(87, 138, 24, 0.3)',
            top: circle.top,
            left: circle.left,
            right: circle.right,
            bottom: circle.bottom,
            opacity: circle.opacity * 10,
          }}
        />
      ))}

      {/* Gear decorations */}
      <Box sx={{ position: 'absolute', top: '12%', right: '8%', opacity: 0.06, animation: `${spin} 20s linear infinite` }}>
        <GearIcon size={120} color="#578A18" />
      </Box>
      <Box sx={{ position: 'absolute', bottom: '10%', left: '6%', opacity: 0.06, animation: `${spinReverse} 15s linear infinite` }}>
        <GearIcon size={90} color="#578A18" />
      </Box>
      <Box sx={{ position: 'absolute', top: '55%', right: '3%', opacity: 0.04, animation: `${spin} 25s linear infinite` }}>
        <GearIcon size={60} color="#fff" />
      </Box>

      {/* Main card */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          px: { xs: 3, sm: 6 },
          py: { xs: 5, sm: 7 },
          maxWidth: 520,
          width: '100%',
          mx: 2,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          animation: `${fadeIn} 0.8s ease-out`,
        }}
      >
        {/* Logo floating / bouncing */}
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 4, animation: `${float} 4s ease-in-out infinite` }}>
          <Box
            sx={{
              width: 110,
              height: 110,
              borderRadius: '28px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box
              component="img"
              src="/images/Icon.svg"
              alt="Betika Logo"
              sx={{ width: 70, height: 70 }}
            />
          </Box>
          {/* Small spinning gear badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              border: '2px solid #578A18',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: `${spin} 3s linear infinite`,
            }}
          >
            <GearIcon size={15} color="#578A18" />
          </Box>
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontWeight: 800,
            color: '#f8fafc',
            fontSize: { xs: '26px', sm: '32px' },
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            mb: 1.5,
          }}
        >
          Under Maintenance
        </Typography>

        {/* Green divider */}
        <Box sx={{ width: 48, height: 3, borderRadius: 2, backgroundColor: '#578A18', mx: 'auto', mb: 2.5 }} />

        {/* Message */}
        <Typography
          sx={{
            color: '#94a3b8',
            fontSize: '15px',
            lineHeight: 1.8,
            maxWidth: 380,
            mx: 'auto',
            mb: 4,
          }}
        >
          {message || 'We are currently performing scheduled maintenance. We will be back shortly.'}
        </Typography>

        {/* Animated dots */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 4 }}>
          <Typography sx={{ color: '#64748b', fontSize: '13px', mr: 1 }}>Working on it</Typography>
          <Dot delay="0s" />
          <Dot delay="0.2s" />
          <Dot delay="0.4s" />
        </Box>

        {/* Live clock */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: 'rgba(87,138,24,0.1)',
            border: '1px solid rgba(87,138,24,0.25)',
            borderRadius: '10px',
            px: 2.5,
            py: 1,
            mb: 3,
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#578A18', animation: `${pulse} 2s ease-in-out infinite` }} />
          <Typography sx={{ color: '#86efac', fontSize: '13px', fontWeight: 500, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Typography>
        </Box>

        {/* Footer note */}
        <Typography sx={{ color: '#475569', fontSize: '12px', lineHeight: 1.6 }}>
          For urgent assistance, please contact your system administrator.
        </Typography>
      </Box>
    </Box>
  );
};

export default Maintenance;
