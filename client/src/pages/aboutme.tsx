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

// Profile photo shown on the About section.
// Place the image at client/public/profile.jpg (or change the path below).
const PROFILE_IMAGE = '/profile.jpg';

/**
 * About section. Third panel in the horizontal track.
 *
 * UX layout:
 *   - Desktop: two-column split. A rounded, bordered profile image sits on
 *     the left, occupying roughly 40% of the content width. The bio card and
 *     skills sit on the right, slightly shifted inward to create breathing
 *     room. The image is allowed to grow vertically to match the combined
 *     height of the right-hand content block, while staying capped so it
 *     never exceeds the section's available space.
 *   - Mobile: image appears as a centered circular avatar above the bio, so
 *     the section remains vertically scrollable and nothing is clipped.
 */
export default function AboutMe({ viewportW, isActive }: AboutMeProps) {
  const isMobile = useIsMobile();

  return (
    <motion.section
      id="about"
      className={`content-section content-section-secondary overflow-y-auto ${
        isMobile ? 'py-6 px-4' : 'py-12 md:py-16 px-6 md:px-12 lg:px-20 flex flex-col'
      }`}
      style={{ width: viewportW, flexShrink: 0 }}
      initial={false}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: isActive ? 0.1 : 0 }}
    >
      <h2 className="section-title section-title-about shrink-0">About Me</h2>

      {isMobile ? (
        // Mobile: vertical flow with a compact avatar above the bio.
        <div className="mx-auto w-full max-w-3xl space-y-5 pt-1 pb-6">
          <div className="flex justify-center">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-[#967259]/40 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
              <img
                src={PROFILE_IMAGE}
                alt="Benedict Abellana"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="glass-card-dark p-4 sm:p-5">
            <div className="space-y-3 text-sm sm:text-base text-gray-200 leading-relaxed text-center">
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

          <h3 className="text-lg font-bold text-white text-center pt-1">
            Skills & Technologies
          </h3>
          <div className="flex flex-wrap gap-2 justify-center pb-2">
            {SKILLS.map((skill) => (
              <span
                key={skill}
                className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium
                           text-[#ece0d1] border border-[#967259]/40 bg-[#38220f]/45
                           hover:border-[#967259] hover:bg-[#634832]/40 transition-colors duration-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : (
        // Desktop: two-column layout.
        // A 40/60 split gives the image prominence while leaving ample room
        // for the bio and skills. The columns align to a shared top edge,
        // and the image height naturally matches the right-hand content.
        <div className="flex-1 flex flex-col justify-center min-h-0 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-[minmax(220px,2fr)_minmax(320px,3fr)] gap-8 lg:gap-12 items-start">
            {/* Left column: profile image */}
            <div className="glass-card-dark p-2 h-full">
              <div className="relative w-full h-full min-h-[260px] rounded-lg overflow-hidden border border-[#967259]/40 shadow-[inset_0_0_40px_rgba(0,0,0,0.25)]">
                <img
                  src={PROFILE_IMAGE}
                  alt="Benedict Abellana"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Right column: bio + skills, shifted slightly right by the grid gap */}
            <div className="flex flex-col justify-center space-y-6 h-full">
              <div className="glass-card-dark p-5 md:p-7 lg:p-9">
                <div className="space-y-5 text-base md:text-lg text-gray-200 leading-relaxed text-center md:text-left">
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

              <div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white text-center md:text-left mb-3">
                  Skills & Technologies
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center md:justify-start pb-2">
                  {SKILLS.map((skill) => (
                    <span
                      key={skill}
                      className="inline-block px-2 py-0.5 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium
                                 text-[#ece0d1] border border-[#967259]/40 bg-[#38220f]/45
                                 hover:border-[#967259] hover:bg-[#634832]/40 transition-colors duration-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}
