import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/useMobile';

interface AboutMeProps {
  viewportW: number;
  isActive?: boolean;
}

const SKILLS = [
  'React',
  'TypeScript',
  'Tailwind CSS',
  'Next.js',
  'LLM',
  'JavaScript',
  'HTML/CSS',
  'Responsive Design',
  'UI/UX',
  'Git',
  'REST APIs',
  'Make',
  'Automation',
  'N8N',
  'AI Agents',
];

/**
 * About section. Third panel in the horizontal track.
 *
 * Mobile layout strategy:
 *
 *   The bio card + 15 skill chips together exceed 100vh on small
 *   phones, so the section has to be vertically scrollable. The
 *   classic flex-column trick (`flex flex-col overflow-y-auto`
 *   with `flex-1` on the inner content column) breaks when the
 *   inner column's natural content height exceeds the leftover
 *   space — half the content gets pushed above the visible area
 *   with no way to scroll back up to it. The fix is to keep the
 *   section as a plain block container on mobile (no `flex
 *   flex-col`) so the browser lays out the content at its natural
 *   height from top to bottom. The section's `overflow-y-auto`
 *   then provides a continuous scroll from the title all the way
 *   down to the last skill chip.
 *
 * Desktop layout strategy:
 *
 *   Plenty of room, so the section stays as a flex column. The
 *   title pins at the top and the content column fills the
 *   remaining space with `justify-center`, vertically centering
 *   the bio + skills block and removing the awkward bottom strip.
 */
export default function AboutMe({ viewportW, isActive }: AboutMeProps) {
  const isMobile = useIsMobile();

  return (
    <motion.section
      id="about"
      className={`content-section content-section-secondary overflow-y-auto ${
        isMobile ? 'py-6 px-4' : 'py-16 px-20 lg:px-28 flex flex-col'
      }`}
      style={{ width: viewportW, flexShrink: 0 }}
      // Per-section content entry: fade in with a small upward translate
      // when this panel becomes the active one. 0.1s delay lets the
      // track slide start first so the fade lands softly.
      initial={false}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: isActive ? 0.1 : 0 }}
    >
      <h2 className={`section-title section-title-about ${isMobile ? 'shrink-0' : ''}`}>About Me</h2>

      {isMobile ? (
        // Mobile: plain block flow so `overflow-y-auto` on the section
        // can scroll the full bio + skills column from top to bottom.
        <div className="mx-auto w-full max-w-3xl space-y-5 pt-1 pb-6">
          {/* Bio card — tighter padding/text on mobile to leave room
              for the skills grid below. */}
          <div className="glass-card-dark p-5">
            <div className="space-y-3 text-base text-gray-200 leading-relaxed text-center">
              <p>
                I am Benedict Abellana, a Computer Engineering student at the University of San Carlos
                who is passionate about frontend development and aspire to be a skilled developer
                with a deep love for creating beautiful, functional web experiences. I also love creating AI agents and automating workflows to make life easier.
                As of now, I spend most of my free time working my own startups building products that users will love.
              </p>
              <p>
                During weekends, you'll find me playing video games or exploring new
                coffee shops together with my siblings or friends, contributing to our side projects, or experimenting with the
                latest web technologies. I believe in the power of collaboration and continuous learning, and I am always eager to take on new challenges that push me to grow as a developer and as a person.
              </p>
            </div>
          </div>

          {/* Skills — full width below the bio, chips wrap freely */}
          <h3 className="text-lg font-bold text-white text-center pt-1">
            Skills & Technologies
          </h3>
          <div className="flex flex-wrap gap-2 justify-center pb-2">
            {SKILLS.map((skill) => (
              <span
                key={skill}
                className="inline-block px-3 py-1 rounded-full text-xs font-medium
                           text-[#ece0d1] border border-[#967259]/40 bg-[#38220f]/45
                           hover:border-[#967259] hover:bg-[#634832]/40 transition-colors duration-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : (
        // Desktop: flex column with `flex-1 justify-center` on the
        // content area so bio + skills sit in the vertical middle
        // below the title.
        <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full space-y-6">
          <div className="glass-card-dark p-7 md:p-9">
            <div className="space-y-6 text-lg text-gray-200 leading-relaxed text-center">
              <p>
                I am Benedict Abellana, a Computer Engineering student at the University of San Carlos
                who is passionate about frontend development and aspire to be a skilled developer
                with a deep love for creating beautiful, functional web experiences. I also love creating AI agents and automating workflows to make life easier.
                As of now, I spend most of my free time working my own startups building products that users will love.
              </p>
              <p>
                During weekends, you'll find me playing video games or exploring new
                coffee shops together with my siblings or friends, contributing to our side projects, or experimenting with the
                latest web technologies. I believe in the power of collaboration and continuous learning, and I am always eager to take on new challenges that push me to grow as a developer and as a person.
              </p>
            </div>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white text-center">
            Skills & Technologies
          </h3>
          <div className="flex flex-wrap gap-2.5 justify-center pb-2">
            {SKILLS.map((skill) => (
              <span
                key={skill}
                className="inline-block px-3.5 py-1.5 rounded-full text-xs font-medium
                           text-[#ece0d1] border border-[#967259]/40 bg-[#38220f]/45
                           hover:border-[#967259] hover:bg-[#634832]/40 transition-colors duration-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}
