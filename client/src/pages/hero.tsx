import { motion, useTransform, useMotionTemplate, type MotionValue } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface HeroProps {
  viewportW: number;
  totalWidth: number;
  bgX: MotionValue<number>;
  fgX: MotionValue<number>;
  onCtaClick: () => void;
  isActive?: boolean;
}

const TECH_BADGES = [
  { icon: '⚛️', label: 'React' },
  { icon: '🤖', label: 'LLM' },
  { icon: '📘', label: 'TypeScript' },
  { icon: '🚀', label: 'Next.js' },
  { icon: '🦞', label: 'Openclaw' },
  { icon: '☕', label: 'Coffee' },
];

/**
 * Hero / landing section. First panel in the horizontal track.
 * Carries the only parallax background overlay in the app.
 */
export default function Hero({ viewportW, totalWidth, bgX, fgX, onCtaClick, isActive }: HeroProps) {
  // Headline reacts to track x: drifts -8% (layered on parent -5%),
  // lifts -16px, fades to 85%, and blurs up to 4px as it leaves view.
  const headlineX = useTransform(fgX, [-totalWidth, 0], [totalWidth * 0.08, 0]);
  const headlineY = useTransform(fgX, [-totalWidth, 0], [-16, 0]);
  const headlineOpacity = useTransform(fgX, [-totalWidth, 0], [0.85, 1]);
  const headlineBlur = useTransform(fgX, [-totalWidth, 0], [4, 0]);
  const headlineFilter = useMotionTemplate`blur(${headlineBlur}px)`;

  return (
    <motion.section
      className="relative h-full flex items-center justify-start px-4 sm:px-5 md:px-20 lg:px-28"
      style={{ width: viewportW, flexShrink: 0 }}
      // Per-section content entry animation: when this section becomes
      // active, fade the whole hero in with a small upward translate.
      // The 0.1s delay lets the track slide start moving first, so the
      // opacity fade feels like a soft landing rather than overlapping
      // the horizontal motion.
      initial={false}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: isActive ? 0.1 : 0 }}
    >
      {/* Parallax background overlay */}
      <motion.div
        className="absolute inset-0 opacity-40"
        style={{
          x: bgX,
          background:
            'radial-gradient(circle at top right, rgba(99, 72, 50, 0.1), transparent)',
        }}
      />

      {/* Section background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #ece0d1 0%, #dbc1ac 50%, #c9b5a0 100%)',
        }}
      />

      {/* Hero Content */}
      <motion.div
        className="relative z-10 hero-content min-w-0"
        style={{ x: fgX }}
      >
        <motion.h1
          className="hero-text text-[clamp(1.75rem,6vw,4.5rem)] mb-4 md:mb-6 leading-tight"
          style={{
            x: headlineX,
            y: headlineY,
            opacity: headlineOpacity,
            filter: headlineFilter,
          }}
        >
          Hey, I'm<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-900 to-orange-700">
            Benedict Abellana
          </span>
        </motion.h1>

        <p
          className="text-[clamp(0.875rem,2.2vw,1.5rem)] font-mono mb-6 md:mb-8 font-light break-words"
          style={{ color: '#634832' }}
        >
          AI Engineer | Frontend Developer | Prompt Engineer | Coffee Enthusiast
        </p>

        {/* Tech Stack Badges */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3 md:gap-4 mb-8 md:mb-12">
          {TECH_BADGES.map((tech, idx) => (
            <div
              key={idx}
              className="tech-badge"
              title={tech.label}
            >
              <span>{tech.icon}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={onCtaClick}
          className="submit-btn w-auto px-6 py-2.5 md:px-8 md:py-3 inline-flex items-center justify-center"
        >
          Get In Touch
        </Button>
      </motion.div>
    </motion.section>
  );
}
