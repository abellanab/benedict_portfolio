import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

interface ResumeProps {
  viewportW: number;
  isActive?: boolean;
}

const RESUME_URL = '/Benedict_Resume.pdf';
const RESUME_FILENAME = 'Benedict_Abellana_Resume.pdf';

/**
 * Resume section. Fourth panel in the horizontal track.
 * Renders a download CTA and an embedded PDF preview. Uses the unified
 * dark glass card theme (matches experience.tsx and aboutme.tsx).
 */
export default function Resume({ viewportW, isActive }: ResumeProps) {
  return (
    <motion.section
      id="resume"
      className="content-section content-section-primary py-10 md:py-16 px-4 md:px-20 lg:px-28 overflow-y-auto min-h-0"
      style={{ width: viewportW, flexShrink: 0 }}
      // Per-section content entry: fade in with a small upward translate
      // when this panel becomes the active one. 0.1s delay lets the
      // track slide start first so the fade lands softly.
      initial={false}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: isActive ? 0.1 : 0 }}
    >
      <h2 className="section-title section-title-resume">Resume</h2>

      <div className="max-w-3xl mx-auto w-full flex flex-col items-center gap-6 min-h-0">
        <div className="glass-card-dark p-5 sm:p-7 md:p-10 w-full flex flex-col items-center text-center gap-6">
          <span className="role-chip">Document</span>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            My Resume
          </h3>
          <p className="text-gray-200 leading-relaxed max-w-xl">
            Download my full resume to see a overview of my experience, education, and
            technical skills.
          </p>

          <a
            href={RESUME_URL}
            download={RESUME_FILENAME}
            className="submit-btn w-auto inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3"
          >
            <Download size={18} />
            Download Resume
          </a>

          {/* Resume PDF Preview — scales with available space and caps height */}
          <div className="resume-preview">
            <iframe
              src={`${RESUME_URL}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              title="Benedict Resume Preview"
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
