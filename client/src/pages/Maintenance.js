import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

/* ── Animations ─────────────────────────────────────────── */
const float = keyframes`
  0%,100% { transform: translateY(0px) rotate(0deg); }
  33%      { transform: translateY(-14px) rotate(-1deg); }
  66%      { transform: translateY(-7px) rotate(1deg); }
`;
const spin        = keyframes`from{transform:rotate(0deg)}  to{transform:rotate(360deg)}`;
const spinReverse = keyframes`from{transform:rotate(0deg)}  to{transform:rotate(-360deg)}`;
const pulse       = keyframes`0%,100%{opacity:.25;transform:scale(.8)} 50%{opacity:1;transform:scale(1)}`;
const fadeUp      = keyframes`from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)}`;
const shimmer     = keyframes`0%{background-position:200% center} 100%{background-position:-200% center}`;
const glow        = keyframes`0%,100%{box-shadow:0 0 20px rgba(87,138,24,.3)} 50%{box-shadow:0 0 45px rgba(87,138,24,.7)}`;
const drift       = keyframes`0%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-30px) translateX(15px)} 100%{transform:translateY(0) translateX(0)}`;
const rotate3d    = keyframes`0%{transform:perspective(400px) rotateY(0deg)} 100%{transform:perspective(400px) rotateY(360deg)}`;

/* ── Gear SVG ────────────────────────────────────────────── */
const Gear = ({ size, color, sx }) => (
  <Box component="span" sx={sx}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.34.07-.68.07-1.08s-.03-.74-.07-1.08l2.32-1.81c.21-.16.27-.45.13-.69l-2.2-3.81c-.13-.24-.42-.32-.66-.24l-2.74 1.1c-.57-.44-1.18-.79-1.85-1.06L14.92 2.1C14.87 1.84 14.65 1.67 14.4 1.67h-4.4c-.25 0-.47.17-.52.43L9.1 4.41C8.43 4.68 7.82 5.03 7.25 5.47L4.51 4.37c-.24-.09-.53 0-.66.24L1.65 8.42c-.14.23-.08.53.13.69l2.32 1.81C4.06 11.26 4 11.61 4 12s.06.74.1 1.08L1.78 14.9c-.21.16-.27.45-.13.69l2.2 3.81c.13.24.42.32.66.24l2.74-1.1c.57.44 1.18.79 1.85 1.06l.38 2.91c.05.26.27.43.52.43h4.4c.25 0 .47-.17.52-.43l.38-2.91c.67-.27 1.28-.62 1.85-1.06l2.74 1.1c.24.09.53 0 .66-.24l2.2-3.81c.14-.24.08-.53-.13-.69l-2.32-1.8z"/>
    </svg>
  </Box>
);

/* ── Countdown segment ───────────────────────────────────── */
const Segment = ({ value, label }) => (
  <Box sx={{ textAlign: 'center', minWidth: 64 }}>
    <Box
      sx={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(87,138,24,0.35)',
        borderRadius: '12px',
        px: 1.5,
        py: 1,
        mb: 0.75,
        backdropFilter: 'blur(6px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <Typography
        sx={{
          fontFamily: '"SF Mono", "Fira Code", monospace',
          fontSize: { xs: '28px', sm: '36px' },
          fontWeight: 700,
          color: '#f8fafc',
          lineHeight: 1,
          letterSpacing: '0.04em',
        }}
      >
        {String(value).padStart(2, '0')}
      </Typography>
    </Box>
    <Typography sx={{ color: '#64748b', fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      {label}
    </Typography>
  </Box>
);

/* ── Dot ─────────────────────────────────────────────────── */
const Dot = ({ delay }) => (
  <Box component="span" sx={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: '#578A18', mx: '3px', animation: `${pulse} 1.4s ease-in-out infinite`, animationDelay: delay }} />
);

/* ── Particle ────────────────────────────────────────────── */
const Particle = ({ left, top, size, dur, delay }) => (
  <Box
    sx={{
      position: 'absolute',
      left,
      top,
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: size > 2 ? 'rgba(87,138,24,0.5)' : 'rgba(255,255,255,0.25)',
      animation: `${drift} ${dur}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      pointerEvents: 'none',
    }}
  />
);

/* ── Main component ──────────────────────────────────────── */
const Maintenance = ({ message, endTime }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const countdown = useMemo(() => {
    if (!endTime) return null;
    const diff = new Date(endTime) - now;
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s };
  }, [endTime, now]);

  const particles = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      left: `${(i * 19 + 5) % 100}%`,
      top:  `${(i * 31 + 9) % 100}%`,
      size: i % 4 === 0 ? 3 : i % 7 === 0 ? 4 : 2,
      dur:  5 + (i % 7),
      delay: -(i * 0.7),
    }))
  , []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #060d1a 0%, #0d1f12 35%, #0a1628 65%, #060d1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Particles */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* Large ambient glow blobs */}
      <Box sx={{ position: 'absolute', top: '10%', left: '15%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(87,138,24,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '5%', right: '10%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Background rings */}
      {[500, 380, 260].map((s, i) => (
        <Box key={i} sx={{ position: 'absolute', width: s, height: s, borderRadius: '50%', border: `1px solid rgba(87,138,24,${0.04 + i * 0.015})`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
      ))}

      {/* Corner gears */}
      <Gear size={140} color="#578A18" sx={{ position: 'absolute', top: '6%', right: '5%', opacity: 0.07, animation: `${spin} 22s linear infinite` }} />
      <Gear size={100} color="#578A18" sx={{ position: 'absolute', bottom: '8%', left: '4%', opacity: 0.07, animation: `${spinReverse} 16s linear infinite` }} />
      <Gear size={60}  color="#3b82f6" sx={{ position: 'absolute', top: '48%', right: '2%', opacity: 0.05, animation: `${spin} 30s linear infinite` }} />
      <Gear size={50}  color="#fff'   " sx={{ position: 'absolute', top: '20%', left: '2%', opacity: 0.04, animation: `${spinReverse} 20s linear infinite` }} />

      {/* Card */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          px: { xs: 3, sm: 6 },
          py: { xs: 5, sm: 7 },
          maxWidth: 560,
          width: '100%',
          mx: 2,
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          animation: `${fadeUp} 0.9s cubic-bezier(.16,1,.3,1)`,
        }}
      >
        {/* Floating logo */}
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 4, animation: `${float} 5s ease-in-out infinite` }}>
          {/* Glow ring */}
          <Box
            sx={{
              position: 'absolute',
              inset: -10,
              borderRadius: '36px',
              background: 'transparent',
              animation: `${glow} 3s ease-in-out infinite`,
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              width: 108,
              height: 108,
              borderRadius: '26px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box component="img" src="/images/Icon.svg" alt="Logo" sx={{ width: 68, height: 68 }} />
          </Box>
          {/* Spinning gear badge */}
          <Box
            sx={{
              position: 'absolute', bottom: -6, right: -6, zIndex: 2,
              width: 30, height: 30, borderRadius: '50%',
              backgroundColor: '#0a1628',
              border: '2px solid #578A18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: `${spin} 3s linear infinite`,
            }}
          >
            <Gear size={15} color="#578A18" />
          </Box>
        </Box>

        {/* Gradient title */}
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: '26px', sm: '34px' },
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            mb: 1,
            background: 'linear-gradient(90deg, #ffffff 0%, #86efac 40%, #578A18 70%, #ffffff 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: `${shimmer} 4s linear infinite`,
          }}
        >
          Under Maintenance
        </Typography>

        {/* Accent bar */}
        <Box sx={{ width: 52, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #578A18, #86efac)', mx: 'auto', mb: 2.5 }} />

        {/* Message */}
        <Typography sx={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.8, maxWidth: 400, mx: 'auto', mb: countdown ? 3.5 : 4 }}>
          {message || 'We are performing scheduled maintenance and will be back shortly.'}
        </Typography>

        {/* Countdown */}
        {countdown ? (
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
              Back in
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: { xs: 1, sm: 1.5 } }}>
              <Segment value={countdown.h} label="Hours" />
              <Typography sx={{ color: '#578A18', fontSize: '30px', fontWeight: 700, mt: '4px', lineHeight: 1 }}>:</Typography>
              <Segment value={countdown.m} label="Minutes" />
              <Typography sx={{ color: '#578A18', fontSize: '30px', fontWeight: 700, mt: '4px', lineHeight: 1 }}>:</Typography>
              <Segment value={countdown.s} label="Seconds" />
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 4 }}>
            <Typography sx={{ color: '#475569', fontSize: '13px', mr: 1 }}>Working on it</Typography>
            <Dot delay="0s" /><Dot delay="0.2s" /><Dot delay="0.4s" />
          </Box>
        )}

        {/* Live time badge */}
        <Box
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            background: 'rgba(87,138,24,0.08)',
            border: '1px solid rgba(87,138,24,0.2)',
            borderRadius: '10px',
            px: 2.5, py: 1, mb: 3,
          }}
        >
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#578A18', animation: `${pulse} 2s ease-in-out infinite` }} />
          <Typography sx={{ color: '#86efac', fontSize: '13px', fontWeight: 500, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Typography>
        </Box>

        <Typography sx={{ color: '#334155', fontSize: '12px' }}>
          For urgent assistance, contact your system administrator.
        </Typography>
      </Box>
    </Box>
  );
};

export default Maintenance;
