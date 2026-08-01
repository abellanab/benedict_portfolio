import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ExperienceProps {
  viewportW: number;
  isActive: boolean;
  onAdvanceSection?: () => void;
  onRetreatSection?: () => void;
}

interface Project {
  subtitle: string;
  bullets: string[];
}

interface Role {
  title: string;
  company: string;
  dates: string;
  projects: Project[];
}

// Order matters here: this defines the deck's chronological front-to-back
// sequence (index 0 first).
const ROLES: Role[] = [
  {
    title: 'Freelance Front-End Developer',
    company: 'Independent',
    dates: 'January 2026 - Present',
    projects: [
      {
        subtitle: 'Basketball Runs',
        bullets: [
          "Built a mobile-first app for organizing pickup basketball games, with live score, queue, and rotation synced to every player's phone at the court, plus automatic team balancing and game history.",
        ],
      },
      {
        subtitle: 'TapOK',
        bullets: [
          'Built an event discovery and meetup platform where users create and share "Drops" — quick event plans with a name, time, and place — and track attendance through a live roster.',
        ],
      },
      {
        subtitle: 'Zeus & Athena Cosmetics',
        bullets: [
          'Built an e-commerce storefront for a natural skincare brand, including product listings, customer ratings, and a newsletter signup.',
        ],
      },
      {
        subtitle: 'Doro Barandino Portfolio',
        bullets: [
          'Built a portfolio site showcasing handcrafted jewelry collections and architectural design projects, with a section for custom commission inquiries.',
        ],
      },
    ],
  },
  {
    title: 'Internship',
    company: 'Techflow.AI',
    dates: 'February 2026 - May 2026',
    projects: [
      {
        subtitle: 'Intelligent Solutions (Make.com)',
        bullets: [
          'Automated intake by extracting customer ID, then retrieving the 3–7 most relevant SOPs and device details scoped to that customer. AI-generated results posted as a private note to the ticket within 2 minutes.',
        ],
      },
      {
        subtitle: 'CRM Automation',
        bullets: [
          'Routed "Completed" milestone events with follow-up flags into automatic HubSpot task creation, replacing manual setup across 25+ deal milestones per month and cutting stalled-deal risk by 30%.',
        ],
      },
      {
        subtitle: 'Slack Knowledge-Base Bot',
        bullets: [
          'Built a scheduled bot that scans developer Slack channels weekly, extracts problem-solution pairs, and indexes them into a Pinecone vector database powering retrieval for 200+ queries per week.',
        ],
      },
    ],
  },
  {
    title: 'AI Agents',
    company: 'Openclaw',
    dates: 'June 2026 - Present',
    projects: [
      {
        subtitle: 'Openclaw Agent',
        bullets: [
          'Prompt Master — Designed and implemented a prompt-engineering framework that enables AI to transform users prompts using the best prompting structure resulting the best output.',
          'Project Manager  — Created a project management agent that turns vague automation ideas into implementation-ready blueprints for tools like n8n, Make.com, and Zapier.',
          'UI UX Designer — Built to focus on user experience, creating intuitive, accessible, and aesthetically pleasing user interfaces',
        ],
      },
    ],
  },
];

// Module-level wheel consumer registry. Home.tsx's window-level wheel
// handler checks this on every wheel event; if a consumer returns true,
// Home skips its default section-track advance. Only one section may
// register at a time (Experience registers while active, clears otherwise).
type WheelConsumer = (deltaY: number) => boolean;
let activeWheelConsumer: WheelConsumer | null = null;
export function setWheelConsumer(fn: WheelConsumer | null) {
  activeWheelConsumer = fn;
}
export function getWheelConsumer(): WheelConsumer | null {
  return activeWheelConsumer;
}

const WHEEL_DEBOUNCE_MS = 250;

// Cards further than this many positions from the front are fully hidden
// (opacity 0, non-interactive) rather than unmounted, so the deck still
// looks right with more than a couple of roles without changing behavior.
const MAX_PEEK = 2;
const TINT_COUNT = 3;
const PEEK_STEP_X = 16;
const PEEK_STEP_ROTATE = 5;
const PEEK_SCALE_STEP = 0.07;
const PEEK_OPACITY_STEP = 0.4;
const DECK_SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;

function RoleCardContent({ role, isFront }: { role: Role; isFront: boolean }) {
  return (
    <div className="experience-content experience-deck-card-inner">
      <span className="role-chip">{role.company}</span>
      <h3 className="experience-deck-title">{role.title}</h3>
      {isFront && (
        <>
          <span className="experience-deck-dates">{role.dates}</span>
          <hr className="section-divider shrink-0 my-2 md:my-3" />
          <div className="experience-deck-projects overflow-y-auto text-base flex-1">
            {role.projects.map((project, pidx) => (
              <div key={pidx}>
                <p className="font-bold text-white text-lg">{project.subtitle}</p>
                <ul className="mt-2 space-y-1.5">
                  {project.bullets.map((bullet, bidx) => (
                    <li key={bidx} className="flex items-start gap-2.5 text-gray-200 text-base leading-relaxed">
                      <span className="mt-1 shrink-0 text-[#967259]">▸</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Experience section: a stacked/fanned card deck, one role focused at a
 * time. Desktop wheel and arrow keys cycle the deck (boundary triggers a
 * section change via onAdvanceSection/onRetreatSection); tapping the
 * left/right half of the front card cycles too, looping at the boundaries
 * instead. Peeking side cards are clickable/keyboard-operable shortcuts to
 * jump straight to them.
 */
export default function Experience({ viewportW, isActive, onAdvanceSection, onRetreatSection }: ExperienceProps) {
  const lastWheelAtRef = useRef(0);
  const onAdvanceRef = useRef(onAdvanceSection);
  const onRetreatRef = useRef(onRetreatSection);
  // Persists the last-visited card across Experience re-entries within the
  // same session; null means "start fresh at index 0" (set back to null
  // whenever a boundary navigation hands off to another section).
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

  const lastIdx = ROLES.length - 1;

  // direction: +1 = next card, -1 = previous card.
  // mode 'section' (desktop wheel/arrow keys): at the FIRST card, going
  //   back retreats to Home; at the LAST card, going forward advances to
  //   About. Middle cards just move within the deck.
  // mode 'loop' (tap/click on the front card): wraps around at the
  //   boundaries instead of changing section, so users can freely browse
  //   the deck by tapping; section change on mobile happens via horizontal
  //   swipe on the parent track in Home.tsx, not via the deck itself.
  // Reads the current index from a ref (not the `activeIndex` closure) so
  // the wheel consumer below — registered once per `isActive` change, not
  // per card change — always acts on the latest position.
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
      setActiveIndex((i) => (direction === 1 ? (i + 1) % ROLES.length : (i - 1 + ROLES.length) % ROLES.length));
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

  // Arrow keys mirror wheel semantics so keyboard-only desktop users have
  // the same navigation reach as the wheel, on top of the peek-card buttons.
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigate(1, 'section');
      else if (e.key === 'ArrowLeft') navigate(-1, 'section');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  // Tap/click left half of the front card = previous, right half = next
  // (loops). Ignored when the click lands on an interactive descendant so
  // those keep working normally.
  const handleCardTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, textarea, select')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const direction: 1 | -1 = tapX < rect.width / 2 ? -1 : 1;
    navigate(direction, 'loop');
  };

  return (
    <motion.section
      id="experience"
      className="content-section content-section-primary py-6 md:py-8 px-4 md:px-8 lg:px-28 flex flex-col min-h-0"
      style={{ width: viewportW, flexShrink: 0 }}
      // Per-section content entry: fade in with a small upward translate
      // when this panel becomes the active one. 0.1s delay lets the
      // track slide start first so the fade lands softly.
      initial={false}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: isActive ? 0.1 : 0 }}
    >
      {/* Header */}
      <div className="mb-3 md:mb-4 shrink-0">
        <h2 className="section-title section-title-experience mb-0">Experience</h2>
      </div>

      {/* Stacked/fanned deck: every role stays mounted at all times so
          framer-motion can animate transform/opacity between positions
          instead of mounting/unmounting cards on every navigation. */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-visible">
        <div className="experience-deck">
          {ROLES.map((role, idx) => {
            const offset = idx - activeIndex;
            const abs = Math.abs(offset);
            const isFront = offset === 0;
            const sign = Math.sign(offset);
            const clampedAbs = Math.min(abs, MAX_PEEK + 1);
            const hidden = abs > MAX_PEEK;
            const tint = idx % TINT_COUNT;

            return (
              <motion.div
                key={role.title}
                className={`experience-deck-card experience-deck-card--tint-${tint}${isFront ? ' experience-deck-card--front' : ''}`}
                style={{ zIndex: ROLES.length + 10 - clampedAbs, pointerEvents: hidden ? 'none' : undefined }}
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
                aria-label={!isFront ? `Show ${role.title} at ${role.company}` : undefined}
                aria-roledescription={isFront ? 'slide' : undefined}
                onClick={isFront ? handleCardTap : () => goTo(idx)}
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
                <RoleCardContent role={role} isFront={isFront} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
