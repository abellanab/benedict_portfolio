import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFlip } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';

import 'swiper/css';
import 'swiper/css/effect-flip';

import { useIsMobile } from '@/hooks/useMobile';

interface ExperienceProps {
  viewportW: number;
  isActive: boolean;
  onAdvanceSection?: () => void;
  onRetreatSection?: () => void;
}

interface Project {
  subtitle: string;
  bullets: string[];
  link?: string;
}

interface Role {
  title: string;
  company: string;
  dates: string;
  projects: Project[];
}

// Order matters here: this defines the carousel sequence.
// 1 = Internship, 2 = AI Agents (Openclaw), 3 = Personal Projects.
const ROLES: Role[] = [
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
          'Placeholder — add your agent description here. Edit the ROLES array in client/src/pages/experience.tsx to fill in the bullets, link, and additional agents.',
        ],
      },
    ],
  },
  {
    title: 'Personal Projects',
    company: 'Personal',
    dates: 'May 2026 - Present',
    projects: [
      {
        subtitle: 'Basketball Runs',
        link: 'https://ballruns.vercel.app/',
        bullets: [
          'Developed a game history page enabling users to view all created and joined games, with automatic MVP highlights upon game completion.',
          'Built the landing page displaying active games in real time, allowing hosts to instantly create or join ongoing pickup basketball sessions.',
          'Developed a game history and landing page system that surfaces active games, tracks participation records, and automatically highlights MVPs after each session.',
          'Deployed Basketball Runs to local basketball clubs for real-world user testing, gathering feedback to validate core features and improve the overall experience.',
        ],
      },
      {
        subtitle: 'TapOK',
        link: 'https://tapok.app',
        bullets: [
          'Crafted TapOK\'s landing page experience from concept to execution, defining the platform\'s visual language through cohesive color systems, animation-driven interactions, and an intuitive top-centered navigation layout.',
        ],
      },
    ],
  },
];

// Module-level wheel consumer registry. Home.tsx's window-level wheel
// handler checks this on every wheel event; if a consumer returns true,
// Home skips its default section-track advance. Only one section may
// register at a time (Experience registers on mount, clears on unmount).
type WheelConsumer = (deltaY: number) => boolean;
let activeWheelConsumer: WheelConsumer | null = null;
export function setWheelConsumer(fn: WheelConsumer | null) {
  activeWheelConsumer = fn;
}
export function getWheelConsumer(): WheelConsumer | null {
  return activeWheelConsumer;
}

// Wheel-debounce window. 250ms coalesces trackpad inertia but lets a
// deliberate second scroll land in under half a second.
const WHEEL_DEBOUNCE_MS = 250;

/**
 * Single active role card. Shows the role header, all sub-projects with
 * bullets, and optional links.
 */
function ActiveCardContent({ role }: { role: Role }) {
  return (
    <div
      className={`glass-card-dark w-full h-full flex flex-col overflow-hidden p-4 sm:p-6 md:p-8 lg:p-9`}
    >
      <header className="shrink-0 mb-3 md:mb-5">
        <span className="role-chip mb-2 md:mb-3">{role.company}</span>
        <h3
          className="font-bold text-white mt-2 md:mt-3 text-lg sm:text-xl md:text-2xl lg:text-3xl break-words"
        >
          {role.title}
        </h3>
        <p className="text-gray-300 mt-1 text-[10px] sm:text-xs md:text-sm">
          {role.dates}
        </p>
      </header>

      <hr className="section-divider shrink-0 mb-3 md:mb-5" />

      <div className="flex-1 min-h-0 space-y-5 overflow-y-auto text-sm md:text-base">
        {role.projects.map((project, pidx) => (
          <div key={pidx}>
            {project.link ? (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:underline underline-offset-4 decoration-1 break-words block text-sm md:text-base"
              >
                {project.subtitle}
              </a>
            ) : (
              <p className="font-semibold text-white text-sm md:text-base">
                {project.subtitle}
              </p>
            )}
            <ul className="mt-2 space-y-1.5">
              {project.bullets.map((bullet, bidx) => (
                <li
                  key={bidx}
                  className="flex items-start gap-2.5 text-gray-200 text-xs sm:text-sm leading-relaxed"
                >
                  <span className="mt-1 shrink-0 text-[#967259]">▸</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Experience section. Uses Swiper's EffectFlip to animate a 3D flip
 * between role cards. One card is visible at a time, centered.
 *
 * Section transition rule (position-based, not credit-based):
 *   - On the first card (Internship), scroll-up retreats to Home.
 *   - On the last card (Personal Projects), scroll-down advances to About.
 *   - On any middle card, scroll moves to the previous/next card.
 *
 * The active card persists across section re-entries via `lastIndexRef`:
 * returning to Experience from Home keeps the user where they left off.
 * The first visit always starts at slide 0 (Internship).
 */
export default function Experience({
  viewportW,
  isActive,
  onAdvanceSection,
  onRetreatSection,
}: ExperienceProps) {
  const isMobile = useIsMobile();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const lastWheelAtRef = useRef(0);
  const onAdvanceRef = useRef(onAdvanceSection);
  const onRetreatRef = useRef(onRetreatSection);
  // Persist the user's last position across re-entries. `null` means
  // the user has never visited Experience before — start at 0.
  const lastIndexRef = useRef<number | null>(null);

  useEffect(() => {
    onAdvanceRef.current = onAdvanceSection;
  }, [onAdvanceSection]);
  useEffect(() => {
    onRetreatRef.current = onRetreatSection;
  }, [onRetreatSection]);

  // Mirror isActive into a ref so `navigate` (called from event
  // handlers that may fire after a section change) sees the latest
  // value without re-binding the wheel/tap listeners.
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Shared step function used by both wheel-scroll and tap-to-flip.
  // Returns `true` if the action was consumed (caller should swallow
  // any default behavior), `false` if it was rejected (e.g. swiper
  // still animating). Direction is +1 for next card, -1 for previous.
  // The `mode` flag controls how the carousel boundaries behave:
  //
  //   - `'section'` (desktop wheel): boundary tap fires the
  //     `onAdvanceSection` / `onRetreatSection` callback so the
  //     track slides to the adjacent section. First card retreats
  //     to Home, last card advances to About.
  //
  //   - `'loop'` (mobile tap): boundary tap wraps the carousel so
  //     the user can browse all three cards freely without leaving
  //     Experience. Section change on mobile happens via horizontal
  //     swipe (handled by the parent track in Home.tsx).
  const navigate = (direction: 1 | -1, mode: 'loop' | 'section'): boolean => {
    if (!isActiveRef.current) return false;
    const swiper = swiperRef.current;
    if (!swiper) return false;
    if (swiper.animating) return false;
    const currentIdx = swiper.realIndex;
    const lastIdx = ROLES.length - 1;
    const atEnd = direction === 1 && currentIdx >= lastIdx;
    const atStart = direction === -1 && currentIdx <= 0;
    if ((atEnd || atStart) && mode === 'section') {
      lastIndexRef.current = null;
      const cb = direction === 1 ? onAdvanceRef.current : onRetreatRef.current;
      window.setTimeout(() => cb?.(), 0);
      return true;
    }
    // Loop mode passes through here at the boundaries — Swiper's
    // loop=true handles the wrap with the same flip animation.
    lastIndexRef.current = (currentIdx + direction + ROLES.length) % ROLES.length;
    if (direction === 1) swiper.slideNext();
    else swiper.slidePrev();
    return true;
  };

  // Wheel consumer — position-based navigation. Desktop uses wheel
  // events; on mobile the section is changed via horizontal swipe
  // (handled by the parent track in Home.tsx) and cards are flipped
  // via tap (see `handleCardTap` below).
  useEffect(() => {
    setWheelConsumer((deltaY) => {
      if (!isActive) return false;
      const now = Date.now();
      if (now - lastWheelAtRef.current < WHEEL_DEBOUNCE_MS) return true;
      if (Math.abs(deltaY) < 10) return true;
      lastWheelAtRef.current = now;
      return navigate(Math.sign(deltaY) as 1 | -1, 'section');
    });
    return () => setWheelConsumer(null);
  }, [isActive]);

  // Tap-to-flip (mobile + desktop). Users can tap/click the left half
  // of the active card to go to the previous role, or the right half
  // to go to the next. On desktop this complements the wheel scroll.
  // Cards loop freely on tap; wheel-driven navigation still triggers
  // section changes at the first/last card boundaries.
  const handleCardTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore taps/clicks that originated on a link/button inside the card —
    // those should follow their own click target.
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, textarea, select')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const direction: 1 | -1 = tapX < rect.width / 2 ? -1 : 1;
    navigate(direction, 'loop');
  };

  // Card width: scales with the viewport while preserving the flip
  // animation's aspect ratio. The card's height is driven by the
  // available section space (flex-1 wrapper) and capped so it never
  // grows unwieldy on tall displays.
  const cardWidth = isMobile
    ? 'min(88vw, 360px)'
    : 'clamp(720px, 50vw, 820px)';

  return (
    <motion.section
      id="experience"
      className="content-section content-section-primary py-8 md:py-12 px-4 md:px-20 lg:px-28 overflow-y-auto flex flex-col min-h-0"
      style={{ width: viewportW, flexShrink: 0 }}
      // Per-section content entry: fade in with a small upward translate
      // when this panel becomes the active one. 0.1s delay lets the
      // track slide start first so the fade lands softly.
      initial={false}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: isActive ? 0.1 : 0 }}
    >
      {/* Header */}
      <div className="mb-4 md:mb-6 shrink-0">
        <h2 className="section-title section-title-experience mb-0">Experience</h2>
      </div>

      {/* Flip carousel — one card visible at a time. Swiper handles the
          3D flip animation between slides via the EffectFlip module.
          The wrapper centers the Swiper in the section's content area
          (capped at 1100px) so the card stays anchored regardless of
          viewport width. */}
      <div
        className="relative mx-auto flex-1 min-h-0 w-full flex items-center justify-center"
        style={{ maxWidth: '1100px' }}
      >
        <Swiper
          // Imperative API — we drive slide changes via swiperRef, not
          // by binding a controlled `slideTo` prop.
          onSwiper={(s) => {
            swiperRef.current = s;
            // Restore the user's last position if they previously
            // visited Experience. First-time visitors start at 0.
            const saved = lastIndexRef.current;
            if (saved !== null && saved > 0) {
              // slideToLoop is safe here even with loop=false — it
              // just routes to slideTo internally.
              s.slideTo(saved, 0);
            }
          }}
          effect="flip"
          grabCursor
          // Disable Swiper's touch handling on mobile so horizontal
          // swipes pass through to the parent track and change
          // sections, instead of being captured here to flip cards.
          // Cards are flipped via tap (handleCardTap) on mobile; the
          // wheel consumer drives flips on desktop.
          allowTouchMove={false}
          // Loop enabled so the tap-to-flip path can wrap from the
          // last card back to the first (and vice versa) with the
          // same flip animation. On desktop the `navigate(..., 'section')`
          // call short-circuits the boundary BEFORE calling
          // slideNext/slidePrev, so the wrap never fires there — the
          // section-change callback handles the boundary instead.
          loop={true}
          // Speed is irrelevant for wheel-driven flips — Swiper only
          // animates when its internal API is called. We set it anyway
          // so any future touch-driven flips look consistent.
          speed={600}
          flipEffect={{ slideShadows: false }}
          modules={[EffectFlip]}
          mousewheel={{
            // We handle wheel events ourselves via the consumer
            // registry. Disable Swiper's built-in mousewheel so the
            // two systems don't double-fire.
            enabled: false,
          }}
          // Critical: hide all Swiper chrome (pagination dots, nav
            // arrows, scrollbar). The flip is the only visual cue.
          pagination={false}
          navigation={false}
          scrollbar={false}
          className="w-full h-full"
        >
          {ROLES.map((role) => (
            <SwiperSlide
              key={role.title}
              // Inline style centers the slide content as a fallback
              // for browsers where the Tailwind flex utilities don't
              // apply (Swiper sometimes overrides slide display).
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <div
                onClick={handleCardTap}
                // Tap/click target uses cursor-pointer so users get a hint
                // that the card is interactive on both mobile and desktop.
                className="cursor-pointer select-none h-full max-h-[560px] md:max-h-[620px]"
                style={{
                  width: cardWidth,
                }}
              >
                <ActiveCardContent role={role} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </motion.section>
  );
}