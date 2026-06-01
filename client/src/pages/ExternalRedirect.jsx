import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, ArrowLeft, Briefcase, MapPin, Clock, Zap } from 'lucide-react';

/**
 * ExternalRedirect page
 * Route: /redirect?url=...&title=...&company=...&location=...
 *
 * Shows a branded in-app interstitial before forwarding the user to an
 * external apply link. All colors use CSS theme variables so it adapts to
 * both dark and light modes automatically.
 */
const ExternalRedirect = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);

  const externalUrl = params.get('url') || '';
  const title       = params.get('title')   || 'Internship';
  const company     = params.get('company') || '';
  const location    = params.get('location') || '';
  const duration    = params.get('duration') || '';

  const [countdown, setCountdown] = useState(5);
  const [started, setStarted] = useState(false);

  // Auto-redirect countdown
  useEffect(() => {
    if (!externalUrl) return;
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(id);
          window.location.replace(externalUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [externalUrl]);

  const handleApplyNow = () => {
    setStarted(true);
    if (externalUrl) window.open(externalUrl, '_blank', 'noopener,noreferrer');
  };

  const progress = ((5 - countdown) / 5) * 100;
  const isLinkedInFallback = externalUrl.includes('linkedin.com/jobs/search');
  const ctaLabel = isLinkedInFallback ? 'Find on LinkedIn Jobs → India' : 'Apply Now';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface-bg)',
        color: 'var(--surface-text)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="orb orb-1" style={{ top: '-10%', left: '-5%' }} />
        <div className="orb orb-2" style={{ bottom: '-10%', right: '-5%' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '480px',
        }}
      >
        {/* Card */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem',
              background: 'linear-gradient(135deg, #16a34a, #4ade80)',
              borderRadius: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(22,163,74,0.35)',
            }}>
              <Zap size={16} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.025em', color: 'var(--surface-text)' }}>
              Intern<span className="gradient-text">IQ</span>
            </span>
          </div>

          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', color: isLinkedInFallback ? '#f59e0b' : 'var(--brand-500)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {isLinkedInFallback ? '⚠️ Direct apply link unavailable' : 'Redirecting to application'}
          </p>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '1rem', color: 'var(--surface-text)', letterSpacing: '-0.025em' }}>
            {title}
          </h1>
          {isLinkedInFallback && (
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              color: '#f59e0b',
              lineHeight: 1.55,
            }}>
              The company's apply link is currently unavailable. We'll redirect you to a LinkedIn Jobs search for this role in India instead.
            </div>
          )}

          {/* Meta info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.75rem' }}>
            {company && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={14} style={{ color: 'var(--brand-500)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--surface-text)', fontWeight: 500 }}>{company}</span>
              </div>
            )}
            {location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} style={{ color: 'var(--surface-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--surface-muted)' }}>{location}</span>
              </div>
            )}
            {duration && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} style={{ color: 'var(--surface-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--surface-muted)' }}>{duration}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--surface-border)', marginBottom: '1.5rem' }} />

          {/* Countdown ring + label */}
          {countdown > 0 && !started && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* SVG ring */}
              <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
                <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="26" cy="26" r="22" fill="none" stroke="var(--surface-border)" strokeWidth="3.5" />
                  <circle
                    cx="26" cy="26" r="22" fill="none"
                    stroke="var(--brand-500)" strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                  />
                </svg>
                <span style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 800, color: 'var(--brand-500)'
                }}>
                  {countdown}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--surface-muted)', lineHeight: 1.5 }}>
                {isLinkedInFallback
                  ? 'Redirecting to LinkedIn Jobs India search…'
                  : 'Redirecting to the application page automatically…'
                }
              </p>
            </div>
          )}

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleApplyNow}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                borderRadius: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 0 20px rgba(22,163,74,0.35)',
                transition: 'opacity 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.boxShadow = '0 0 28px rgba(22,163,74,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 0 20px rgba(22,163,74,0.35)'; }}
            >
              {ctaLabel} <ExternalLink size={16} />
            </button>

            <button
              onClick={() => navigate(-1)}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: 'var(--surface-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderRadius: '0.875rem',
                border: '1px solid var(--surface-border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-subtle)'; e.currentTarget.style.color = 'var(--surface-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--surface-muted)'; }}
            >
              <ArrowLeft size={15} /> Go back
            </button>
          </div>

          {/* Safety note */}
          <p style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--surface-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            You'll be taken to an external site. InternIQ is not responsible for third-party content.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ExternalRedirect;
