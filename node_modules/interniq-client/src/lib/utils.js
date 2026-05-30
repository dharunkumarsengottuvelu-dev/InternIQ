import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

// ─── Tailwind class merger ────────────────────────────────────
export const cn = (...inputs) => twMerge(clsx(inputs));

// ─── Score utilities ──────────────────────────────────────────
export const getScoreColor = (score) => {
  if (score === null || score === undefined) return 'text-surface-muted';
  if (score >= 80) return 'text-success-500';
  if (score >= 60) return 'text-warning-500';
  return 'text-danger-500';
};

export const getScoreBg = (score) => {
  if (score === null || score === undefined) return 'bg-surface-700';
  if (score >= 80) return 'bg-success-500/20 border-success-500/40';
  if (score >= 60) return 'bg-warning-500/20 border-warning-500/40';
  return 'bg-danger-500/20 border-danger-500/40';
};

export const getScoreLabel = (score) => {
  if (score === null || score === undefined) return 'Not yet scored';
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Average';
  if (score >= 40) return 'Below Average';
  return 'Needs Improvement';
};

export const getScoreHex = (score) => {
  if (score === null || score === undefined) return '#475569';
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#f43f5e';
};

// ─── Date formatters ──────────────────────────────────────────
export const formatDate = (date) =>
  date ? format(new Date(date), 'MMM d, yyyy') : '—';

export const formatRelativeTime = (date) =>
  date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '—';

// ─── String utilities ─────────────────────────────────────────
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

export const truncate = (str, n = 80) =>
  str?.length > n ? str.slice(0, n) + '...' : str;

export const initials = (name) =>
  name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'U';

// ─── Number formatters ────────────────────────────────────────
export const formatStipend = (stipend) => {
  if (!stipend?.amount) return 'Unpaid';
  return `${stipend.currency || '₹'}${stipend.amount.toLocaleString('en-IN')}/month`;
};

export const formatNumber = (n) =>
  n !== null && n !== undefined ? n.toLocaleString('en-IN') : '—';

// ─── URL utilities ────────────────────────────────────────────
export const isValidUrl = (url) => {
  try { new URL(url); return true; } catch { return false; }
};

// ─── Storage helpers ──────────────────────────────────────────
export const storage = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { console.error('Storage set err:', err); }
  },
  remove: (key) => { try { localStorage.removeItem(key); } catch (err) { console.error('Storage del err:', err); } },
};

// ─── Debounce ─────────────────────────────────────────────────
export const debounce = (fn, ms = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

// ─── External redirect helper (in-app interstitial) ──────────
/**
 * Returns an internal /redirect?... URL that shows the themed
 * interstitial page before forwarding the user to the external apply link.
 *
 * Strategy:
 *  1. If link is empty / '#' → fall back to LinkedIn India search.
 *  2. If the hostname matches known fake seed domains → fall back.
 *  3. If the hostname looks like a made-up company domain (no known
 *     real TLD product like .in, .org, .gov, .edu, .co.in and NOT a
 *     well-known job board) → fall back.
 *  4. Otherwise pass the real URL through.
 */
const KNOWN_FAKE_DOMAINS = new Set([
  'techflow.com', 'webstridetechnologies.com', 'cloudnative.io', 'aiinnovations.com',
  'startupx.co', 'arclightsystems.com', 'nexacoreai.com', 'veridianlabs.com',
  'pinnaclesoftworks.com', 'opteraanalytics.com', 'cloudnineinfra.com',
  'pixeldriftstudio.com', 'mobiforgetech.com', 'appleberryapps.com',
  'shieldnetsecurity.com', 'nexgenmobility.com', 'testforgesolutions.com',
  'webstridetechnologies.com', 'datanexustech.com', 'quantumleapai.com',
  'bytecraftlabs.com', 'synapticworks.io', 'orbitalcoding.com',
  'futurebridgesystems.com', 'alphacodeworks.com', 'codebreeze.io',
  'techmindsolutions.com', 'digitalaura.co', 'innovacraft.in',
  'heliostack.com', 'prismsoftlabs.com', 'stackpulse.io',
]);

const REAL_JOB_BOARDS = new Set([
  'linkedin.com', 'indeed.co.in', 'indeed.com', 'naukri.com', 'internshala.com',
  'unstop.com', 'shine.com', 'glassdoor.co.in', 'glassdoor.com',
  'monster.com', 'letsintern.com', 'hirist.com', 'freshersworld.com',
  'apna.co', 'foundit.in', 'angel.co', 'wellfound.com', 'cutshort.io',
  'hackerearth.com', 'hackerrank.com', 'hirect.in', 'twentytenturns.com',
  'edunuts.com', 'youtern.com', 'simplyhired.com', 'ziprecruiter.com',
  'remoteok.com', 'weworkremotely.com', 'angel.co', 'workatastartup.com',
]);

const _linkedinSearch = (internship) =>
  `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    `${internship?.company || ''} ${internship?.title || ''} internship`
  )}&location=India`;

export const getRedirectUrl = (internship) => {
  const rawLink = internship?.applyLink;

  let externalUrl = '';

  if (!rawLink || rawLink === '#' || rawLink.trim() === '') {
    externalUrl = _linkedinSearch(internship);
  } else {
    try {
      const url = new URL(rawLink.startsWith('http') ? rawLink : `https://${rawLink}`);
      const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

      // Check known fake seeds
      if (KNOWN_FAKE_DOMAINS.has(hostname)) {
        externalUrl = _linkedinSearch(internship);
      }
      // Allow real job boards unconditionally
      else if (REAL_JOB_BOARDS.has(hostname) || [...REAL_JOB_BOARDS].some(b => hostname.endsWith('.' + b))) {
        externalUrl = rawLink.startsWith('http') ? rawLink : `https://${rawLink}`;
      }
      // Heuristic: company website that isn't a job board — still pass through, but verify it
      // looks like a real URL structure (has a dot-separated TLD)
      else if (hostname.includes('.') && !hostname.endsWith('.invalid')) {
        externalUrl = rawLink.startsWith('http') ? rawLink : `https://${rawLink}`;
      }
      else {
        externalUrl = _linkedinSearch(internship);
      }
    } catch {
      externalUrl = _linkedinSearch(internship);
    }
  }

  const params = new URLSearchParams({
    url:      externalUrl,
    title:    internship?.title    || '',
    company:  internship?.company  || '',
    location: internship?.location || internship?.mode || '',
    duration: internship?.duration || '',
  });
  return `/redirect?${params.toString()}`;
};


// ─── Apply Link Fallback ──────────────────────────────────────
export const getSafeApplyLink = (internship) => {
  const link = internship?.applyLink;
  if (!link || link === '#' || link.trim() === '') {
    return `https://www.google.com/search?q=${encodeURIComponent(`${internship?.company || ''} ${internship?.title || ''} internship`)}`;
  }
  
  const mockDomains = [
    'techflow.com', 'webstridetechnologies.com', 'cloudnative.io', 'aiinnovations.com', 
    'startupx.co', 'arclightsystems.com', 'nexacoreai.com', 'veridianlabs.com', 
    'pinnaclesoftworks.com', 'opteraanalytics.com', 'cloudnineinfra.com', 
    'pixeldriftstudio.com', 'mobiforgetech.com', 'appleberryapps.com', 
    'shieldnetsecurity.com', 'nexgenmobility.com'
  ];
  
  try {
    const url = new URL(link);
    const hostname = url.hostname.toLowerCase();
    if (mockDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
      return `https://www.google.com/search?q=${encodeURIComponent(`${internship?.company || ''} ${internship?.title || ''} internship`)}`;
    }
  } catch (e) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${internship?.company || ''} ${internship?.title || ''} internship`)}`;
  }
  
  return link;
};
