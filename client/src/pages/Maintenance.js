import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

/* ── Keyframes ───────────────────────────────────────────── */
const float     = keyframes`0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-16px) rotate(1deg)}`;
const spin      = keyframes`from{transform:rotate(0deg)}  to{transform:rotate(360deg)}`;
const spinCCW   = keyframes`from{transform:rotate(0deg)}  to{transform:rotate(-360deg)}`;
const shimmer   = keyframes`0%{background-position:200% center} 100%{background-position:-200% center}`;
const pulseGlow = keyframes`0%,100%{opacity:.3;transform:scale(.95)} 50%{opacity:1;transform:scale(1.05)}`;
const fadeUp    = keyframes`from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)}`;
const drift     = keyframes`0%{transform:translate(0,0)} 33%{transform:translate(12px,-20px)} 66%{transform:translate(-8px,-12px)} 100%{transform:translate(0,0)}`;
const scanLine  = keyframes`0%{top:-5%} 100%{top:105%}`;
const borderRot = keyframes`0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)}`;
const blink     = keyframes`0%,100%{opacity:1} 50%{opacity:.3}`;
const slideIn   = keyframes`from{transform:scaleX(0);opacity:0} to{transform:scaleX(1);opacity:1}`;

/* ── Gear SVG ────────────────────────────────────────────── */
const GearSVG = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.34.07-.68.07-1.08s-.03-.74-.07-1.08l2.32-1.81c.21-.16.27-.45.13-.69l-2.2-3.81c-.13-.24-.42-.32-.66-.24l-2.74 1.1c-.57-.44-1.18-.79-1.85-1.06L14.92 2.1C14.87 1.84 14.65 1.67 14.4 1.67h-4.4c-.25 0-.47.17-.52.43L9.1 4.41C8.43 4.68 7.82 5.03 7.25 5.47L4.51 4.37c-.24-.09-.53 0-.66.24L1.65 8.42c-.14.23-.08.53.13.69l2.32 1.81C4.06 11.26 4 11.61 4 12s.06.74.1 1.08L1.78 14.9c-.21.16-.27.45-.13.69l2.2 3.81c.13.24.42.32.66.24l2.74-1.1c.57.44 1.18.79 1.85 1.06l.38 2.91c.05.26.27.43.52.43h4.4c.25 0 .47-.17.52-.43l.38-2.91c.67-.27 1.28-.62 1.85-1.06l2.74 1.1c.24.09.53 0 .66-.24l2.2-3.81c.14-.24.08-.53-.13-.69l-2.32-1.8z"/>
  </svg>
);

/* ── Status row item ─────────────────────────────────────── */
const StatusItem = ({ label, delay }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#578A18', animation: `${pulseGlow} 2s ease-in-out infinite`, animationDelay: delay }} />
    <Typography sx={{ color: '#475569', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</Typography>
  </Box>
);

/* ── Particle ────────────────────────────────────────────── */
const Particle = ({ left, top, size, dur, delay, green }) => (
  <Box sx={{
    position: 'absolute', left, top, width: size, height: size,
    borderRadius: '50%',
    backgroundColor: green ? `rgba(87,138,24,${size > 2 ? .6 : .35})` : `rgba(255,255,255,${size > 2 ? .2 : .1})`,
    animation: `${drift} ${dur}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    pointerEvents: 'none',
  }} />
);

/* ── Main ────────────────────────────────────────────────── */
const Maintenance = ({ message }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const particles = useMemo(() => Array.from({ length: 35 }, (_, i) => ({
    left:  `${(i * 17 + 5)  % 100}%`,
    top:   `${(i * 29 + 11) % 100}%`,
    size:  i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
    dur:   5 + (i % 8),
    delay: -(i * 0.6),
    green: i % 4 === 0,
  })), []);

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #04080f 0%, #06110a 40%, #060d1f 70%, #04080f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative',
    }}>

      {/* Dot-grid overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(87,138,24,0.18) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* Scan line */}
      <Box sx={{
        position: 'absolute', left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(87,138,24,0.15), transparent)',
        animation: `${scanLine} 6s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Particles */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* Ambient blobs */}
      <Box sx={{ position: 'absolute', top: '5%',  left: '10%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(87,138,24,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '5%', right: '8%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Meshing gears — top-right */}
      <Box sx={{ position: 'absolute', top: '4%', right: '4%', pointerEvents: 'none' }}>
        <Box sx={{ animation: `${spin} 18s linear infinite`, opacity: .09 }}><GearSVG size={160} color="#578A18" /></Box>
        <Box sx={{ position: 'absolute', bottom: -38, right: -36, animation: `${spinCCW} 9s linear infinite`, opacity: .09 }}><GearSVG size={90} color="#86efac" /></Box>
      </Box>

      {/* Meshing gears — bottom-left */}
      <Box sx={{ position: 'absolute', bottom: '3%', left: '3%', pointerEvents: 'none' }}>
        <Box sx={{ animation: `${spinCCW} 22s linear infinite`, opacity: .08 }}><GearSVG size={130} color="#578A18" /></Box>
        <Box sx={{ position: 'absolute', top: -30, right: -32, animation: `${spin} 11s linear infinite`, opacity: .08 }}><GearSVG size={75} color="#86efac" /></Box>
      </Box>

      {/* Small corner gears */}
      <Box sx={{ position: 'absolute', top: '42%', right: '1.5%', opacity: .05, animation: `${spin} 35s linear infinite`, pointerEvents: 'none' }}><GearSVG size={55} color="#fff" /></Box>
      <Box sx={{ position: 'absolute', top: '18%', left: '1.5%', opacity: .05, animation: `${spinCCW} 28s linear infinite`, pointerEvents: 'none' }}><GearSVG size={45} color="#578A18" /></Box>

      {/* ── Card ─────────────────────────────────────────── */}
      <Box sx={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        px: { xs: 3, sm: 6 }, py: { xs: 5, sm: 6.5 },
        maxWidth: 560, width: '100%', mx: 2,
        animation: `${fadeUp} 1s cubic-bezier(.16,1,.3,1)`,
      }}>

        {/* Rotating gradient border ring */}
        <Box sx={{
          position: 'absolute', inset: -1, borderRadius: '30px', zIndex: -1,
          background: 'linear-gradient(135deg, rgba(87,138,24,.6), rgba(134,239,172,.2), rgba(87,138,24,.0), rgba(134,239,172,.3), rgba(87,138,24,.6))',
          backgroundSize: '300% 300%',
          animation: `${shimmer} 5s linear infinite`,
          filter: 'blur(1px)',
        }} />

        <Box sx={{
          position: 'relative',
          background: 'rgba(4,8,15,0.85)',
          backdropFilter: 'blur(24px)',
          borderRadius: '28px',
          border: '1px solid rgba(87,138,24,0.2)',
          boxShadow: '0 40px 80px rgba(0,0,0,.6), 0 0 60px rgba(87,138,24,.08), inset 0 1px 0 rgba(255,255,255,.06)',
          px: { xs: 3, sm: 5 }, py: { xs: 4, sm: 5.5 },
          overflow: 'hidden',
        }}>

          {/* Inner scan highlight */}
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(87,138,24,0.5), transparent)',
          }} />

          {/* Floating logo */}
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 4, animation: `${float} 5s ease-in-out infinite` }}>
            {/* Outer glow ring */}
            <Box sx={{
              position: 'absolute', inset: -14, borderRadius: '38px',
              background: 'radial-gradient(ellipse, rgba(87,138,24,0.25) 0%, transparent 70%)',
              animation: `${pulseGlow} 3s ease-in-out infinite`,
            }} />
            {/* Logo box */}
            <Box sx={{
              position: 'relative', width: 112, height: 112, borderRadius: '26px',
              background: 'linear-gradient(145deg, rgba(87,138,24,0.12), rgba(4,8,15,0.8))',
              border: '1px solid rgba(87,138,24,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto',
              boxShadow: '0 16px 48px rgba(0,0,0,.5), 0 0 30px rgba(87,138,24,0.15)',
            }}>
              <Box component="img" src="/images/Icon.svg" alt="Logo" sx={{ width: 70, height: 70 }} />
            </Box>
            {/* Spinning gear badge */}
            <Box sx={{
              position: 'absolute', bottom: -8, right: -8,
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0a1628, #0d1f12)',
              border: '2px solid #578A18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: `${spin} 4s linear infinite`,
              boxShadow: '0 0 12px rgba(87,138,24,0.5)',
            }}>
              <GearSVG size={16} color="#578A18" />
            </Box>
          </Box>

          {/* Gradient title */}
          <Typography sx={{
            fontWeight: 800, fontSize: { xs: '28px', sm: '36px' },
            letterSpacing: '-0.03em', lineHeight: 1.1, mb: 0.5,
            background: 'linear-gradient(90deg, #f8fafc 0%, #86efac 35%, #578A18 55%, #86efac 75%, #f8fafc 100%)',
            backgroundSize: '250% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            animation: `${shimmer} 5s linear infinite`,
          }}>
            Under Maintenance
          </Typography>

          <Typography sx={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.22em',
            color: '#578A18', textTransform: 'uppercase', mb: 2.5,
          }}>
            System Update In Progress
          </Typography>

          {/* Accent line */}
          <Box sx={{
            width: 60, height: 2, mx: 'auto', mb: 3, borderRadius: 2,
            background: 'linear-gradient(90deg, transparent, #578A18, #86efac, #578A18, transparent)',
            animation: `${shimmer} 3s linear infinite`, backgroundSize: '200% auto',
          }} />

          {/* Message */}
          <Typography sx={{ color: '#94a3b8', fontSize: '14.5px', lineHeight: 1.85, maxWidth: 380, mx: 'auto', mb: 4 }}>
            {message || 'We are performing scheduled maintenance to improve your experience. We will be back shortly.'}
          </Typography>

          {/* Animated progress bar */}
          <Box sx={{ mb: 3.5, px: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: '#475569', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Progress</Typography>
              <Typography sx={{ color: '#578A18', fontSize: '11px', fontWeight: 600 }}>In Progress</Typography>
            </Box>
            <Box sx={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', border: '1px solid rgba(87,138,24,0.15)' }}>
              <Box sx={{
                height: '100%', width: '65%', borderRadius: 3,
                background: 'linear-gradient(90deg, #578A18, #86efac, #578A18)',
                backgroundSize: '200% auto',
                animation: `${shimmer} 2s linear infinite`,
                boxShadow: '0 0 10px rgba(87,138,24,0.6)',
              }} />
            </Box>
          </Box>

          {/* Status rows */}
          <Box sx={{
            display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2.5,
            mb: 3.5, px: 1,
            py: 1.5, borderRadius: '10px',
            backgroundColor: 'rgba(87,138,24,0.04)',
            border: '1px solid rgba(87,138,24,0.1)',
          }}>
            <StatusItem label="Database"       delay="0s"    />
            <StatusItem label="Services"       delay="0.4s"  />
            <StatusItem label="Security"       delay="0.8s"  />
            <StatusItem label="Configuration"  delay="1.2s"  />
          </Box>

          {/* Live clock */}
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1.25,
            background: 'rgba(87,138,24,0.07)',
            border: '1px solid rgba(87,138,24,0.18)',
            borderRadius: '10px', px: 2.5, py: 1, mb: 3,
          }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#578A18', animation: `${blink} 1s step-end infinite` }} />
            <Typography sx={{ color: '#86efac', fontSize: '13px', fontWeight: 600, fontFamily: '"SF Mono","Fira Code",monospace', letterSpacing: '0.07em' }}>
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
            <Typography sx={{ color: '#334155', fontSize: '12px', mx: 0.5 }}>·</Typography>
            <Typography sx={{ color: '#475569', fontSize: '12px', fontFamily: 'monospace' }}>
              {now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Typography>
          </Box>

          <Typography sx={{ color: '#1e293b', fontSize: '12px' }}>
            For urgent assistance, contact your system administrator.
          </Typography>

          {/* Bottom inner line */}
          <Box sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(87,138,24,0.3), transparent)',
          }} />
        </Box>
      </Box>
    </Box>
  );
};

export default Maintenance;
