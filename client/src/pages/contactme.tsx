import { motion } from 'framer-motion';
import { CheckCircle2, Mail, Github, Linkedin, Send } from 'lucide-react';

interface ContactMeProps {
  viewportW: number;
  isMobile: boolean;
  formData: { name: string; email: string; message: string };
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  footerBottomPadding: number; // px — clears the mobile bottom dock
  isActive?: boolean;
  // `'success'` / `'error'` show an inline banner above the submit
  // button. The banner clears automatically when the user starts
  // typing again (handled in Home.tsx).
  submitStatus: 'idle' | 'success' | 'error';
  submitError: string | null;
}

const SOCIAL_LINKS = [
  {
    href: 'mailto:hello@benedictabellana.dev',
    label: 'abellanabenedict@gmail.com',
    Icon: Mail,
  },
  {
    href: 'https://github.com',
    label: 'https://github.com/coffeebdict',
    Icon: Github,
  },
  {
    href: 'https://linkedin.com',
    label: 'https://www.linkedin.com/in/benedict-abellana-b277571b2/',
    Icon: Linkedin,
  },
];

/**
 * Contact section. Final panel in the horizontal track.
 * Two columns inside a dark glass card: social links on the left,
 * contact form on the right. Footer line below the card.
 */
export default function ContactMe({
  viewportW,
  isMobile,
  formData,
  isSubmitting,
  onSubmit,
  onInputChange,
  footerBottomPadding,
  isActive,
  submitStatus,
  submitError,
}: ContactMeProps) {
  return (
    <motion.section
      id="contact"
      className="content-section content-section-secondary py-10 md:py-16 px-4 md:px-20 lg:px-28 overflow-y-auto"
      style={{ width: viewportW, flexShrink: 0 }}
      // Per-section content entry: fade in with a small upward translate
      // when this panel becomes the active one. 0.1s delay lets the
      // track slide start first so the fade lands softly.
      initial={false}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: isActive ? 0.1 : 0 }}
    >
      <h2 className="section-title section-title-contact">Get In Touch</h2>

      <div className="glass-card-dark p-7 md:p-10">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact Info */}
          <div>
            <span className="role-chip mb-4">Connect</span>
            <h3 className="text-2xl font-bold text-white mt-4 mb-3">Let's Connect</h3>
            <p className="text-gray-200 mb-7 leading-relaxed">
              I'm always interested in hearing about new projects and opportunities.
              Feel free to reach out if you'd like to collaborate or just chat about
              coffee and life!
            </p>

            {/* Social Links */}
            <div className="space-y-3">
              {SOCIAL_LINKS.map(({ href, label, Icon }, idx) => (
                <a
                  key={idx}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                             border border-[#967259]/25 bg-[#38220f]/35
                             text-gray-200 hover:text-white hover:border-[#967259]/70
                             hover:bg-[#634832]/35 transition-colors duration-200"
                >
                  <Icon size={18} className="text-[#967259] shrink-0" />
                  <span className="text-sm break-all">{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            <span className="role-chip">Message</span>
            <h3 className="text-2xl font-bold text-white mt-4">Send a Message</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onInputChange}
                  placeholder="Your Name"
                  required
                  className="contact-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={onInputChange}
                  placeholder="your@email.com"
                  required
                  className="contact-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={onInputChange}
                  placeholder="Your message here..."
                  required
                  rows={5}
                  className="contact-input resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="submit-btn flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>

              {/* Inline submit feedback. The banner sits between the
                  button and the closing form so it doesn't shift the
                  other fields. Color cues follow the warm-coffee
                  palette: emerald for success, warm red for error. */}
              {submitStatus === 'success' && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-lg border border-emerald-500/40
                             bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-200"
                >
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <span>
                    Message sent! I'll get back to you at the email you
                    provided.
                  </span>
                </div>
              )}
              {submitStatus === 'error' && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-500/40
                             bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
                >
                  <span className="mt-0.5 shrink-0">⚠️</span>
                  <span>
                    {submitError ??
                      "Couldn't send your message. Please try again."}
                  </span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      <div
        className="mt-10 pt-6 border-t border-[#967259]/20 text-center text-gray-400"
        style={{ paddingBottom: isMobile ? footerBottomPadding : undefined }}
      >
        <p>© 2026 Benedict Abellana. Built with React, Tailwind CSS, and ☕ Coffee.</p>
      </div>
    </motion.section>
  );
}
