import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

/* ── Keyframes ───────────────────────────────────────────── */
const spin      = keyframes`from{transform:rotate(0deg)}  to{transform:rotate(360deg)}`;
const spinCCW   = keyframes`from{transform:rotate(0deg)}  to{transform:rotate(-360deg)}`;
const shimmer   = keyframes`0%{background-position:200% center} 100%{background-position:-200% center}`;
const float     = keyframes`0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)}`;
const fadeUp    = keyframes`from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)}`;
const glow      = keyframes`0%,100%{box-shadow:0 0 20px rgba(87,138,24,.25),0 0 60px rgba(87,138,24,.1)} 50%{box-shadow:0 0 40px rgba(87,138,24,.55),0 0 100px rgba(87,138,24,.2)}`;
const drift     = keyframes`0%{transform:translate(0,0)} 40%{transform:translate(10px,-18px)} 80%{transform:translate(-6px,-8px)} 100%{transform:translate(0,0)}`;
const blink     = keyframes`0%,100%{opacity:1} 50%{opacity:.25}`;
const pulse     = keyframes`0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.15);opacity:1}`;
const scanLine  = keyframes`0%{top:-4%} 100%{top:104%}`;

/* ── Gear ─────────────────────────────────────────────────── */
const Gear = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.34.07-.68.07-1.08s-.03-.74-.07-1.08l2.32-1.81c.21-.16.27-.45.13-.69l-2.2-3.81c-.13-.24-.42-.32-.66-.24l-2.74 1.1c-.57-.44-1.18-.79-1.85-1.06L14.92 2.1C14.87 1.84 14.65 1.67 14.4 1.67h-4.4c-.25 0-.47.17-.52.43L9.1 4.41C8.43 4.68 7.82 5.03 7.25 5.47L4.51 4.37c-.24-.09-.53 0-.66.24L1.65 8.42c-.14.23-.08.53.13.69l2.32 1.81C4.06 11.26 4 11.61 4 12s.06.74.1 1.08L1.78 14.9c-.21.16-.27.45-.13.69l2.2 3.81c.13.24.42.32.66.24l2.74-1.1c.57.44 1.18.79 1.85 1.06l.38 2.91c.05.26.27.43.52.43h4.4c.25 0 .47-.17.52-.43l.38-2.91c.67-.27 1.28-.62 1.85-1.06l2.74 1.1c.24.09.53 0 .66-.24l2.2-3.81c.14-.24.08-.53-.13-.69l-2.32-1.8z"/>
  </svg>
);

/* ── Orbital ring with a travelling dot ─────────────────────── */
const OrbitRing = ({ size, duration, clockwise, color, dotColor, dotSize = 8, tiltX = 0, tiltY = 0, opacity = 0.4 }) => (
  <Box sx={{
    position: 'absolute',
    width: size, height: size,
    top: '50%', left: '50%',
    marginTop: `-${size / 2}px`,
    marginLeft: `-${size / 2}px`,
    borderRadius: '50%',
    border: `1px solid ${color}`,
    opacity,
    transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
    animation: `${clockwise ? spin : spinCCW} ${duration}s linear infinite`,
  }}>
    <Box sx={{
      position: 'absolute',
      top: -dotSize / 2, left: '50%',
      marginLeft: -dotSize / 2,
      width: dotSize, height: dotSize,
      borderRadius: '50%',
      backgroundColor: dotColor,
      boxShadow: `0 0 ${dotSize + 4}px ${dotColor}, 0 0 ${dotSize * 2}px ${dotColor}`,
    }} />
  </Box>
);

/* ── Particle ─────────────────────────────────────────────── */
const Particle = ({ left, top, size, dur, delay, green }) => (
  <Box sx={{
    position: 'absolute', left, top, width: size, height: size,
    borderRadius: '50%',
    backgroundColor: green ? `rgba(87,138,24,${size > 2 ? .55 : .3})` : `rgba(255,255,255,${size > 2 ? .18 : .09})`,
    animation: `${drift} ${dur}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    pointerEvents: 'none',
  }} />
);

/* ── Main ─────────────────────────────────────────────────── */
const Maintenance = ({ message }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    left:  `${(i * 19 + 7)  % 100}%`,
    top:   `${(i * 31 + 13) % 100}%`,
    size:  i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
    dur:   6 + (i % 7),
    delay: -(i * 0.65),
    green: i % 4 === 0,
  })), []);

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(155deg, #04080f 0%, #060f0a 45%, #060c1e 75%, #04080f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative',
    }}>

      {/* Dot grid */}
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(87,138,24,0.15) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 30%, transparent 100%)',
      }} />

      {/* Scan line */}
      <Box sx={{
        position: 'absolute', left: 0, right: 0, height: '1.5px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(87,138,24,0.12) 30%, rgba(134,239,172,0.2) 50%, rgba(87,138,24,0.12) 70%, transparent 100%)',
        animation: `${scanLine} 7s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Particles */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* Ambient blobs */}
      <Box sx={{ position: 'absolute', top: '8%', left: '12%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(87,138,24,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '6%', right: '8%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Meshing gears — top-right */}
      <Box sx={{ position: 'absolute', top: '4%', right: '4%', pointerEvents: 'none' }}>
        <Box sx={{ animation: `${spin} 20s linear infinite`, opacity: .08 }}><Gear size={150} color="#578A18" /></Box>
        <Box sx={{ position: 'absolute', bottom: -36, right: -34, animation: `${spinCCW} 10s linear infinite`, opacity: .08 }}><Gear size={85} color="#86efac" /></Box>
      </Box>

      {/* Meshing gears — bottom-left */}
      <Box sx={{ position: 'absolute', bottom: '3%', left: '3%', pointerEvents: 'none' }}>
        <Box sx={{ animation: `${spinCCW} 25s linear infinite`, opacity: .07 }}><Gear size={120} color="#578A18" /></Box>
        <Box sx={{ position: 'absolute', top: -28, right: -30, animation: `${spin} 12s linear infinite`, opacity: .07 }}><Gear size={70} color="#86efac" /></Box>
      </Box>

      {/* ── Card ─────────────────────────────────────────── */}
      <Box sx={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        maxWidth: 540, width: '100%', mx: 2,
        animation: `${fadeUp} 1s cubic-bezier(.16,1,.3,1)`,
      }}>

        {/* ── Orbital logo ──────────────────────────────── */}
        <Box sx={{ position: 'relative', width: 220, height: 220, mx: 'auto', mb: 3 }}>

          {/* Orbital rings */}
          <Box sx={{ position: 'absolute', inset: 0, perspective: '600px' }}>
            <OrbitRing size={210} duration={12} clockwise  color="rgba(87,138,24,0.35)"  dotColor="#578A18"  dotSize={8} tiltX={72} opacity={0.7} />
            <OrbitRing size={170} duration={8}  clockwise={false} color="rgba(134,239,172,0.25)" dotColor="#86efac" dotSize={6} tiltX={-65} tiltY={15} opacity={0.6} />
            <OrbitRing size={130} duration={5}  clockwise  color="rgba(87,138,24,0.2)"   dotColor="#578A18"  dotSize={5} tiltX={20}  tiltY={60} opacity={0.5} />
          </Box>

          {/* Centre: logo */}
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}>
          <Box sx={{ animation: `${float} 5s ease-in-out infinite` }}>
            {/* Glow halo */}
            <Box sx={{
              position: 'absolute', inset: -16, borderRadius: '32px',
              background: 'radial-gradient(ellipse, rgba(87,138,24,0.3) 0%, transparent 70%)',
              animation: `${glow} 3s ease-in-out infinite`,
            }} />
            <Box sx={{
              position: 'relative',
              width: 96, height: 96, borderRadius: '24px',
              background: 'linear-gradient(145deg, rgba(87,138,24,0.14), rgba(4,8,15,0.9))',
              border: '1px solid rgba(87,138,24,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 40px rgba(0,0,0,.6)',
            }}>
              <Box component="img" src="/images/Icon.svg" alt="Logo" sx={{ width: 62, height: 62 }} />
            </Box>
            {/* Tiny gear badge */}
            <Box sx={{
              position: 'absolute', bottom: -6, right: -6,
              width: 26, height: 26, borderRadius: '50%',
              background: '#04080f', border: '1.5px solid #578A18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: `${spin} 4s linear infinite`,
              boxShadow: '0 0 10px rgba(87,138,24,.5)',
            }}>
              <Gear size={13} color="#578A18" />
            </Box>
          </Box>
          </Box>
        </Box>

        {/* ── Text card ─────────────────────────────────── */}
        <Box sx={{
          background: 'rgba(4,8,15,0.8)',
          backdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(87,138,24,0.18)',
          boxShadow: '0 32px 64px rgba(0,0,0,.55), 0 0 50px rgba(87,138,24,.06), inset 0 1px 0 rgba(255,255,255,.05)',
          px: { xs: 3, sm: 5 }, py: { xs: 4, sm: 5 },
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Top highlight */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(87,138,24,0.45), transparent)' }} />

          {/* Title */}
          <Typography sx={{
            fontWeight: 800, fontSize: { xs: '27px', sm: '34px' },
            letterSpacing: '-0.03em', lineHeight: 1.1, mb: 0.75,
            background: 'linear-gradient(100deg, #f8fafc 0%, #86efac 40%, #578A18 60%, #86efac 80%, #f8fafc 100%)',
            backgroundSize: '250% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            animation: `${shimmer} 5s linear infinite`,
          }}>
            Under Maintenance
          </Typography>

          <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', color: '#578A18', textTransform: 'uppercase', mb: 2.5 }}>
            We'll be right back
          </Typography>

          {/* Divider */}
          <Box sx={{ width: 56, height: '2px', mx: 'auto', mb: 3, borderRadius: 2, background: 'linear-gradient(90deg, transparent, #578A18, #86efac, #578A18, transparent)', backgroundSize: '200% auto', animation: `${shimmer} 3s linear infinite` }} />

          {/* Message */}
          <Typography sx={{ color: '#94a3b8', fontSize: '14.5px', lineHeight: 1.9, maxWidth: 380, mx: 'auto', mb: 4 }}>
            {message || 'We are performing scheduled maintenance to improve your experience. We will be back shortly.'}
          </Typography>

          {/* Live clock */}
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1.25,
            background: 'rgba(87,138,24,0.07)', border: '1px solid rgba(87,138,24,0.18)',
            borderRadius: '10px', px: 2.5, py: 1, mb: 3,
          }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#578A18', animation: `${blink} 1s step-end infinite` }} />
            <Typography sx={{ color: '#86efac', fontSize: '13px', fontWeight: 600, fontFamily: '"SF Mono","Fira Code",monospace', letterSpacing: '0.07em' }}>
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
            <Typography sx={{ color: '#1e293b', fontSize: '13px' }}>·</Typography>
            <Typography sx={{ color: '#475569', fontSize: '12px', fontFamily: 'monospace' }}>
              {now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Typography>
          </Box>

          <Typography sx={{ color: '#1e293b', fontSize: '12px' }}>
            For urgent assistance, contact your system administrator.
          </Typography>

          {/* Bottom highlight */}
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(87,138,24,0.25), transparent)' }} />
        </Box>
      </Box>
    </Box>
  );
};

export default Maintenance;
