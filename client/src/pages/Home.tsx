import { useState, useEffect, useRef, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  type Transition,
} from 'framer-motion';
import {
  Mail,
  FileText,
  Home as HomeIcon,
  Briefcase,
  User,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/useMobile';
import Hero from './hero';
import Experience, { getWheelConsumer } from './experience';
import AboutMe from './aboutme';
import Resume from './resume';
import ContactMe from './contactme';

const SECTIONS = ['home', 'experience', 'about', 'resume', 'contact'] as const;
type SectionId = (typeof SECTIONS)[number];

const WHEEL_THRESHOLD = 70;
const SWIPE_OFFSET_FRACTION = 0.2;
const SWIPE_VELOCITY = 500;
// How long goToIndex's reentry guard stays locked. Tuned to the snap duration.
const ANIM_LOCK_MS = 600;

/**
 * Design Philosophy: Minimalist Coffee Noir
 * - Deep black background (#000000) with coffee brown accents (#6F4E37)
 * - Primary accent: #1243ae (deep blue) for technical elements
 * - Secondary accent: #38b6ff (cyan) for interactive states
 * - Glassmorphism cards with subtle blur and borders
 * - Left-side vertical navigation bar (fixed position)
 * - Horizontal swipe-right section transitions with parallax depth
 */

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const [viewportW, setViewportW] = useState(() => {
    if (typeof window === 'undefined') return 1440;
    // Initial estimate; the real content area is measured from the track
    // container after mount (ResizeObserver + window/visualViewport resize).
    return window.innerWidth;
  });
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Tracks the last submit outcome so the contact form can show a
  // success or error message inline. `'idle'` means no submission has
  // happened (or the user has started typing again after a result).
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const isAnimatingRef = useRef(false);

  const x = useMotionValue(-activeIndex * viewportW);

  // Measure the actual track container width so viewportW is the content
  // area (viewport minus the desktop left rail and any scrollbar). Resize,
  // zoom, and virtual-keyboard changes all re-measure. The nav width is
  // handled by CSS (nav-offset) so the ref clientWidth already excludes it.
  useEffect(() => {
    const measure = () => {
      const width = trackContainerRef.current?.clientWidth;
      setViewportW(width ?? window.innerWidth);
    };
    measure();

    const ro = new ResizeObserver(measure);
    if (trackContainerRef.current) ro.observe(trackContainerRef.current);

    window.addEventListener('resize', measure);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', measure);
    }

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', measure);
      }
    };
  }, []);

  const goToIndex = useCallback(
    (i: number) => {
      if (isAnimatingRef.current) return;
      const next = Math.max(0, Math.min(SECTIONS.length - 1, i));
      if (next === activeIndex) return;
      isAnimatingRef.current = true;
      setActiveIndex(next);
      window.setTimeout(() => {
        isAnimatingRef.current = false;
      }, ANIM_LOCK_MS);
    },
    [activeIndex]
  );

  const scrollToSection = (sectionId: string) => {
    const i = SECTIONS.indexOf(sectionId as SectionId);
    if (i >= 0) goToIndex(i);
  };

  // TEMP: ?section=<id> deep-link for screenshot verification. Remove after.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get('section');
    if (target) {
      const i = SECTIONS.indexOf(target as SectionId);
      if (i >= 0) {
        const t = window.setTimeout(() => goToIndex(i), 100);
        return () => window.clearTimeout(t);
      }
    }
  }, []);

  // Keep a ref of the latest activeIndex so the wheel listener (attached once)
  // doesn't capture a stale closure.
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Wheel hijack (desktop)
  useEffect(() => {
    if (isMobile) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta =
        e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      // If the active section has registered a wheel consumer (e.g. the
      // Experience card), let it handle the wheel and skip the track
      // advance. Falls back to section-track advance otherwise.
      const consumer = getWheelConsumer();
      if (consumer && consumer(delta)) {
        return;
      }
      acc += delta;
      if (Math.abs(acc) >= WHEEL_THRESHOLD) {
        goToIndex(activeIndexRef.current + Math.sign(acc));
        acc = 0;
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [isMobile, goToIndex]);

  // Manual touch-swipe handling for mobile. We previously used
  // framer-motion's `drag` prop on the track, but it sets
  // `touch-action: none` on the element, which blocks native
  // vertical scrolling inside child sections — a real problem on
  // the About page where the bio card + 15 skill chips together
  // exceed 100vh on small phones. By listening to touch events
  // passively (no preventDefault), we let the browser handle
  // vertical scrolls natively and only act on horizontal swipes.
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isHorizontal = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
      isHorizontal = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      // Lock the gesture to horizontal once it clearly exceeds a
      // horizontal-only motion. The 2× ratio biases strongly toward
      // horizontal so a slight diagonal — say, scrolling vertically
      // through the About section's bio + skills — isn't misread as
      // a section-advance swipe.
      if (!isHorizontal && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 2) {
        isHorizontal = true;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isHorizontal) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dt = Math.max(1, Date.now() - startTime);
      const velocity = Math.abs(dx) / dt; // px/ms — same scale as SWIPE_VELOCITY
      const triggerOffset = viewportW * SWIPE_OFFSET_FRACTION;
      if (dx > triggerOffset || velocity > SWIPE_VELOCITY) {
        goToIndex(activeIndexRef.current - 1);
      } else if (dx < -triggerOffset || velocity > SWIPE_VELOCITY) {
        goToIndex(activeIndexRef.current + 1);
      }
      // If the gesture didn't reach the threshold, do nothing —
      // the section stays put and the user can swipe again.
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile, goToIndex, viewportW]);

  const totalWidth = viewportW * SECTIONS.length;
  // Parallax: background drifts at 15% of row speed, foreground at -5% for depth.
  const bgX = useTransform(x, [-totalWidth, 0], [totalWidth * 0.15, 0]);
  const fgX = useTransform(x, [-totalWidth, 0], [-totalWidth * 0.05, 0]);

  // Spring on mobile feels like a finger flick; tween on desktop matches wheel.
  // Both are tuned to feel snappy (≤ 0.55s) so transitions read as motion
  // rather than loading lag.
  const rowTransition: Transition = isMobile
    ? { type: 'spring', stiffness: 260, damping: 32, mass: 0.9 }
    : { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.55 };

  // Handle form submission — POSTs to the Vercel serverless function at
  // /api/contact, which forwards the message to the portfolio owner's
  // Gmail inbox via Nodemailer + Gmail SMTP.
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (!res.ok) {
        setSubmitStatus('error');
        setSubmitError(data.error ?? 'Failed to send message');
        return;
      }
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      // Network error (offline, CORS, server unreachable).
      setSubmitStatus('error');
      setSubmitError('Network error — please try again');
      console.error('contact: fetch failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset the success/error banner as soon as the user starts editing
  // again — stale "message sent!" banners on top of new content look
  // confusing.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
      setSubmitError(null);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const activeSection = SECTIONS[activeIndex];

  return (
    <div className="h-[var(--viewport-h)] w-screen bg-[#38220f] text-white overflow-hidden">
      {/* Desktop: Left-side Vertical Navigation Bar */}
      <nav className="fixed left-0 top-0 h-[var(--viewport-h)] nav-rail bg-[#38220f]/95 backdrop-blur-md border-r border-[#967259]/30 shadow-[4px_0_24px_rgba(0,0,0,0.35)] flex-col items-center justify-center gap-8 z-50 hidden md:flex">
        <button
          onClick={() => scrollToSection('home')}
          className={`nav-icon-btn ${activeSection === 'home' ? 'active' : ''}`}
          title="Home"
        >
          <HomeIcon size={20} />
        </button>

        <button
          onClick={() => scrollToSection('experience')}
          className={`nav-icon-btn ${activeSection === 'experience' ? 'active' : ''}`}
          title="Experience"
        >
          <Briefcase size={20} />
        </button>

        <button
          onClick={() => scrollToSection('about')}
          className={`nav-icon-btn ${activeSection === 'about' ? 'active' : ''}`}
          title="About"
        >
          <User size={20} />
        </button>

        <button
          onClick={() => scrollToSection('resume')}
          className={`nav-icon-btn ${activeSection === 'resume' ? 'active' : ''}`}
          title="Resume"
        >
          <FileText size={20} />
        </button>

        <button
          onClick={() => scrollToSection('contact')}
          className={`nav-icon-btn ${activeSection === 'contact' ? 'active' : ''}`}
          title="Contact"
        >
          <Mail size={20} />
        </button>
      </nav>

      {/* Mobile: Bottom Dock Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 mobile-dock bg-[#38220f]/95 backdrop-blur-md border-t border-[#967259]/30 shadow-[0_-4px_24px_rgba(0,0,0,0.35)] flex-row items-center justify-around z-50 flex md:hidden">
        <button
          onClick={() => scrollToSection('home')}
          className={`nav-icon-btn ${activeSection === 'home' ? 'active' : ''}`}
          title="Home"
        >
          <HomeIcon size={20} />
        </button>

        <button
          onClick={() => scrollToSection('experience')}
          className={`nav-icon-btn ${activeSection === 'experience' ? 'active' : ''}`}
          title="Experience"
        >
          <Briefcase size={20} />
        </button>

        <button
          onClick={() => scrollToSection('about')}
          className={`nav-icon-btn ${activeSection === 'about' ? 'active' : ''}`}
          title="About"
        >
          <User size={20} />
        </button>

        <button
          onClick={() => scrollToSection('resume')}
          className={`nav-icon-btn ${activeSection === 'resume' ? 'active' : ''}`}
          title="Resume"
        >
          <FileText size={20} />
        </button>

        <button
          onClick={() => scrollToSection('contact')}
          className={`nav-icon-btn ${activeSection === 'contact' ? 'active' : ''}`}
          title="Contact"
        >
          <Mail size={20} />
        </button>
      </nav>

      {/* Horizontal Track */}
      <div
        ref={trackContainerRef}
        className="h-full min-w-0 min-h-0 overflow-hidden nav-offset track-offset"
      >
        <motion.div
          className="flex flex-row h-full min-w-0 min-h-0"
          style={{
            width: totalWidth,
            x,
            // `touch-action: pan-y` lets the browser handle vertical
            // scrolls natively inside child sections (e.g. the About
            // page's bio + skills column on mobile). Only horizontal
            // swipes are routed to our manual touch handler above.
            touchAction: 'pan-y',
          }}
          animate={{ x: -activeIndex * viewportW }}
          transition={rowTransition}
        >
          {/* Hero Section */}
          <Hero
            viewportW={viewportW}
            totalWidth={totalWidth}
            bgX={bgX}
            fgX={fgX}
            onCtaClick={() => scrollToSection('contact')}
            isActive={activeSection === 'home'}
          />

          {/* Experience Section */}
          <Experience
            viewportW={viewportW}
            isActive={activeSection === 'experience'}
            onAdvanceSection={() => goToIndex(SECTIONS.indexOf('about'))}
            onRetreatSection={() => goToIndex(SECTIONS.indexOf('home'))}
          />

          {/* About Section */}
          <AboutMe viewportW={viewportW} isActive={activeSection === 'about'} />

          {/* Resume Section */}
          <Resume viewportW={viewportW} isActive={activeSection === 'resume'} />

          {/* Contact Section */}
          <ContactMe
            viewportW={viewportW}
            isMobile={isMobile}
            formData={formData}
            isSubmitting={isSubmitting}
            onSubmit={handleFormSubmit}
            onInputChange={handleInputChange}
            footerBottomPadding={0}
            isActive={activeSection === 'contact'}
            submitStatus={submitStatus}
            submitError={submitError}
          />
        </motion.div>
      </div>
    </div>
  );
}
