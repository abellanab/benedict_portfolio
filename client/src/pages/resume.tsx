import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface ProjectsProps {
  viewportW: number;
  isActive: boolean;
  onAdvanceSection?: () => void;
  onRetreatSection?: () => void;
}

interface Project {
  title: string;
  url: string;
  description: string;
  // Defaults to true when omitted. Set false only for sites known to block
  // iframe embedding (X-Frame-Options/CSP frame-ancestors) — this is the
  // reliable override the load-timeout heuristic below can't fully replace.
  embeddable?: boolean;
}

// Order matters here: this defines the deck's front-to-back sequence
// (index 0 first).
const PROJECTS: Project[] = [
  {
    title: 'Basketball Runs',
    url: 'https://ballruns.vercel.app/',
    description:
      "A mobile-first app for organizing pickup basketball games — live score, queue, and rotation synced to every player's phone at the court, with automatic team balancing and game history.",
  },
  {
    title: 'TapOK',
    url: 'https://www.tapok.app/',
    description:
      "An event discovery and meetup platform where users create 'Drops' — quick event plans with a name, time, and place — share them via a single link, and track who's coming through a live attendance roster.",
    embeddable: false,
  },
  {
    title: 'Zeus & Athena Cosmetics',
    url: 'https://zeus-athena-cosmetics.vercel.app/',
    description:
      'An e-commerce storefront for Zeus & Athena House of Cosmetics, a natural skincare brand selling handmade soap made with bio ingredients, featuring product listings, customer ratings, and a newsletter signup.',
  },
  {
    title: 'Doro Barandino Portfolio',
    url: 'https://dorobarandino-portfolio.vercel.app/',
    description:
      'A portfolio site for designer Doro Barandino, showcasing handcrafted jewelry collections and architectural design projects, with a section for custom commission inquiries.',
  },
];

// Module-level wheel consumer registry, mirroring experience.tsx's own
// instance. Home.tsx checks both registries on every wheel event — kept
// separate (not shared) since only one section is ever active at a time.
type WheelConsumer = (deltaY: number) => boolean;
let activeWheelConsumer: WheelConsumer | null = null;
export function setWheelConsumer(fn: WheelConsumer | null) {
  activeWheelConsumer = fn;
}
export function getWheelConsumer(): WheelConsumer | null {
  return activeWheelConsumer;
}

const WHEEL_DEBOUNCE_MS = 250;
const MAX_PEEK = 2;
const TINT_COUNT = 3;
const PEEK_STEP_X = 16;
const PEEK_STEP_ROTATE = 5;
const PEEK_SCALE_STEP = 0.07;
const PEEK_OPACITY_STEP = 0.4;
const DECK_SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;
const IFRAME_LOAD_TIMEOUT_MS = 6000;

// Cross-origin X-Frame-Options/CSP blocks can't be detected via iframe
// onError — a blocked frame often still fires onLoad on its own
// browser-rendered error page. This timeout is a best-effort fallback for
// sites we haven't manually verified; project.embeddable is the reliable
// override for known-bad ones (see TapOK above).
//
// A live cross-origin iframe also swallows wheel events entirely — the
// parent page's window-level wheel listener (Home.tsx) never sees them —
// so a bare iframe would break scroll-to-navigate wherever the cursor
// happens to be over the preview. A permanent transparent overlay (part of
// our own document, not the iframe's) sits on top so wheel scroll always
// reaches the deck's navigation, matching experience.tsx exactly; direct
// interaction with the embedded site happens via the "Visit site" link.
function ProjectPreviewFrame({ project, className }: { project: Project; className?: string }) {
  const embeddable = project.embeddable !== false;
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>(embeddable ? 'loading' : 'failed');

  useEffect(() => {
    if (!embeddable) return;
    const timer = window.setTimeout(() => {
      setStatus((current) => (current === 'loading' ? 'failed' : current));
    }, IFRAME_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [embeddable]);

  if (status === 'failed') {
    return (
      <div className={`projects-deck-frame projects-deck-frame--fallback${className ? ` ${className}` : ''}`}>
        <span className="projects-deck-fallback-icon" aria-hidden="true">
          <ExternalLink size={22} />
        </span>
        <p className="projects-deck-fallback-text">Live preview isn't available for this site</p>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="projects-deck-fallback-cta"
        >
          Visit site
          <ExternalLink size={14} />
        </a>
      </div>
    );
  }

  return (
    <div className={`projects-deck-frame${className ? ` ${className}` : ''}`}>
      {status === 'loading' && <div className="projects-deck-frame-spinner" aria-hidden="true" />}
      <iframe
        src={project.url}
        title={`${project.title} live preview`}
        className="h-full w-full"
        onLoad={() => setStatus('loaded')}
      />
      <div className="projects-deck-frame-overlay" aria-hidden="true" />
    </div>
  );
}

function ProjectCardContent({ project, isFront }: { project: Project; isFront: boolean }) {
  if (!isFront) {
    return (
      <div className="experience-content experience-deck-card-inner">
        <span className="role-chip">Project</span>
        <h3 className="experience-deck-title">{project.title}</h3>
      </div>
    );
  }

  return (
    <div className="experience-content experience-deck-card-inner">
      <div className="flex items-start justify-between gap-3 flex-wrap shrink-0">
        <h3 className="experience-deck-title">{project.title}</h3>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ece0d1] hover:text-white shrink-0"
        >
          Visit site
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Only the front card ever reaches this branch — peeking cards
          render the placeholder above instead — so only one external
          site is ever embedded/loaded at a time. Keying on project.url
          gives each project's frame its own fresh load/timeout state. */}
      <ProjectPreviewFrame key={project.url} project={project} className="mt-3" />

      <p className="projects-deck-description overflow-y-auto mt-3 text-gray-200 text-sm leading-relaxed">
        {project.description}
      </p>
    </div>
  );
}

/**
 * Projects section: a stacked/fanned card deck, one project focused at a
 * time. Wheel and arrow keys cycle the deck (boundary triggers a section
 * change via onAdvanceSection/onRetreatSection); peeking side cards are
 * clickable/keyboard-operable shortcuts to jump straight to them. Unlike
 * experience.tsx, the front card's surface is a live iframe the user needs
 * to interact with, so it does not use tap-to-navigate — Prev/Next buttons
 * flank the deck instead, always visible regardless of iframe hover state.
 */
export default function Projects({ viewportW, isActive, onAdvanceSection, onRetreatSection }: ProjectsProps) {
  const lastWheelAtRef = useRef(0);
  const onAdvanceRef = useRef(onAdvanceSection);
  const onRetreatRef = useRef(onRetreatSection);
  const lastIndexRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => lastIndexRef.current ?? 0);
  const activeIndexRef = useRef(activeIndex);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    onAdvanceRef.current = onAdvanceSection;
  }, [onAdvanceSection]);
  useEffect(() => {
    onRetreatRef.current = onRetreatSection;
  }, [onRetreatSection]);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    lastIndexRef.current = activeIndex;
  }, [activeIndex]);

  const lastIdx = PROJECTS.length - 1;

  const navigate = (direction: 1 | -1, mode: 'loop' | 'section'): boolean => {
    if (!isActiveRef.current) return false;
    const currentIdx = activeIndexRef.current;
    const atEnd = direction === 1 && currentIdx >= lastIdx;
    const atStart = direction === -1 && currentIdx <= 0;
    if ((atEnd || atStart) && mode === 'section') {
      lastIndexRef.current = null;
      const cb = direction === 1 ? onAdvanceRef.current : onRetreatRef.current;
      window.setTimeout(() => cb?.(), 0);
      return true;
    }
    if (mode === 'loop') {
      setActiveIndex((i) => (direction === 1 ? (i + 1) % PROJECTS.length : (i - 1 + PROJECTS.length) % PROJECTS.length));
    } else {
      setActiveIndex((i) => Math.max(0, Math.min(lastIdx, i + direction)));
    }
    return true;
  };

  const goTo = (idx: number) => {
    if (!isActiveRef.current || idx === activeIndexRef.current) return;
    setActiveIndex(idx);
  };

  // Only register a real consumer while active — registering unconditionally
  // (even a stub that returns false when inactive) would leave this module's
  // getWheelConsumer() permanently non-null, breaking Home.tsx's
  // `getExperienceWheelConsumer() ?? getProjectsWheelConsumer()` fallback,
  // which only falls through on an actual null.
  useEffect(() => {
    if (!isActive) {
      setWheelConsumer(null);
      return;
    }
    setWheelConsumer((deltaY) => {
      const now = Date.now();
      if (now - lastWheelAtRef.current < WHEEL_DEBOUNCE_MS) return true;
      if (Math.abs(deltaY) < 10) return true;
      lastWheelAtRef.current = now;
      return navigate(Math.sign(deltaY) as 1 | -1, 'section');
    });
    return () => setWheelConsumer(null);
  }, [isActive]);

  // Arrow keys mirror wheel semantics, same as experience.tsx.
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigate(1, 'section');
      else if (e.key === 'ArrowLeft') navigate(-1, 'section');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return (
    <motion.section
      id="resume"
      className="content-section content-section-primary py-6 md:py-8 px-4 md:px-8 lg:px-28 flex flex-col min-h-0"
      style={{ width: viewportW, flexShrink: 0 }}
      initial={false}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: isActive ? 0.1 : 0 }}
    >
      <div className="mb-3 md:mb-4 shrink-0">
        <h2 className="section-title section-title-resume mb-0">Projects Built</h2>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center gap-3 md:gap-5 overflow-visible">
        <button
          type="button"
          className="projects-nav-btn"
          onClick={() => navigate(-1, 'section')}
          aria-label="Previous project"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="projects-deck">
          {PROJECTS.map((project, idx) => {
            const offset = idx - activeIndex;
            const abs = Math.abs(offset);
            const isFront = offset === 0;
            const sign = Math.sign(offset);
            const clampedAbs = Math.min(abs, MAX_PEEK + 1);
            const hidden = abs > MAX_PEEK;
            const tint = idx % TINT_COUNT;

            return (
              <motion.div
                key={project.title}
                className={`experience-deck-card experience-deck-card--tint-${tint}${isFront ? ' experience-deck-card--front' : ''}`}
                style={{ zIndex: PROJECTS.length + 10 - clampedAbs, pointerEvents: hidden ? 'none' : undefined }}
                initial={false}
                animate={{
                  x: `${sign * clampedAbs * PEEK_STEP_X}%`,
                  rotate: sign * clampedAbs * PEEK_STEP_ROTATE,
                  scale: 1 - clampedAbs * PEEK_SCALE_STEP,
                  opacity: hidden ? 0 : 1 - clampedAbs * PEEK_OPACITY_STEP,
                }}
                transition={DECK_SPRING}
                role={isFront ? 'group' : 'button'}
                tabIndex={hidden || isFront ? -1 : 0}
                aria-hidden={hidden || undefined}
                aria-label={!isFront ? `Show ${project.title}` : undefined}
                aria-roledescription={isFront ? 'slide' : undefined}
                onClick={isFront ? undefined : () => goTo(idx)}
                onKeyDown={
                  isFront
                    ? undefined
                    : (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          goTo(idx);
                        }
                      }
                }
              >
                <ProjectCardContent project={project} isFront={isFront} />
              </motion.div>
            );
          })}
        </div>

        <button
          type="button"
          className="projects-nav-btn"
          onClick={() => navigate(1, 'section')}
          aria-label="Next project"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </motion.section>
  );
}
