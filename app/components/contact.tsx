'use client';
import { useState } from 'react';

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-current">
    <path d="M4.98 3.5a2.49 2.49 0 1 1 0 4.98 2.49 2.49 0 0 1 0-4.98ZM3 9h4v12H3zM9 9h3.83v1.64h.05c.53-1.01 1.84-2.08 3.78-2.08 4.04 0 4.79 2.66 4.79 6.12V21h-4v-5.58c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95V21H9z" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-current">
    <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.87 10.92c.58.1.79-.25.79-.56v-2.15c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.02 1.74 2.67 1.24 3.32.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.27-5.23-5.68 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.07 0 0 .97-.31 3.18 1.18A10.99 10.99 0 0 1 12 6.07c.98 0 1.97.13 2.9.39 2.21-1.49 3.18-1.18 3.18-1.18.62 1.6.23 2.78.11 3.07.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-none stroke-current" strokeWidth="1.8">
    <path d="M3.75 6.75h16.5a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-7.5a1.5 1.5 0 0 1 1.5-1.5Z" />
    <path d="m3 7.5 9 6 9-6" />
  </svg>
);

const socialLinks = [
  {
    name: 'LinkedIn',
    label: 'Connect with me!',
    href: 'https://www.linkedin.com/in/michelangelo-granato/',
    Icon: LinkedInIcon,
  },
  {
    name: 'GitHub',
    label: 'Check out my code',
    href: 'https://github.com/michelangelo-granato',
    Icon: GitHubIcon,
  },
  {
    name: 'Email',
    label: 'Shoot me a message',
    href: 'mailto:michelangelo.granato.1@gmail.com',
    Icon: MailIcon,
  },
];

const contactDetails = [
  {
    label: 'Email',
    value: 'michelangelo.granato.1@gmail.com',
    href: 'mailto:michelangelo.granato.1@gmail.com',
  },
  {
    label: 'Phone',
    value: '+1 (647) 390-6776',
    href: 'tel:+16473906776',
  },
  {
    label: 'Location',
    value: 'Toronto, Ontario, Canada',
  },
];

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subjectLine = formData.subject.trim() || `Portfolio inquiry from ${formData.name}`;
    const subject = encodeURIComponent(subjectLine);
    const body = encodeURIComponent([
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Subject: ${subjectLine}`,
      '',
      formData.message,
    ].join('\n'));

    globalThis.location.href = `mailto:michelangelo.granato.1@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section className="contact-stage overflow-hidden rounded-[36px] text-[#f2e9dc]">
      <div className="relative grid gap-10 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[minmax(0,1.2fr)_20rem] xl:gap-12">
        <div>
          <h2 className="title max-w-xl text-4xl font-semibold leading-[0.92] tracking-[-0.06em] text-[#fbf6ee] md:text-6xl">
            Let&apos;s connect
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#ede2d3]/72 md:text-base">
            Have a project in mind or want to compare notes on product engineering, platform work, or photography? Send a note and I&apos;ll reply directly.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 md:mt-10">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#f3e8d8]/84">
                  Your name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className="contact-input block w-full rounded-[18px] px-4 py-3 outline-none transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#f3e8d8]/84">
                  Your email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="contact-input block w-full rounded-[18px] px-4 py-3 outline-none transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="mb-2 block text-sm font-medium text-[#f3e8d8]/84">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What are we talking about?"
                className="contact-input block w-full rounded-[18px] px-4 py-3 outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-[#f3e8d8]/84">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                placeholder="Project scope, timeline, or whatever context will help."
                className="contact-input block w-full rounded-[18px] px-4 py-3 outline-none transition-all duration-200"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-[18px] bg-[#efe5d8] px-4 py-3.5 text-sm font-semibold tracking-[-0.01em] text-[#171310] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Send message
              </button>
              <p className="mt-3 text-xs leading-6 text-[#e6d9c8]/54">
                The form opens your default email client with the message prefilled.
              </p>
            </div>
          </form>
        </div>

        <aside className="relative flex flex-col gap-4 xl:pl-8 xl:before:absolute xl:before:bottom-1 xl:before:left-0 xl:before:top-1 xl:before:w-px xl:before:bg-[#f1e5d4]/10 xl:before:content-['']">
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {socialLinks.map(({ name, label, href, Icon }) => (
              <a
                key={name}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="group rounded-[24px] border border-[#f1e5d4]/8 bg-[#231d18] px-4 py-5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-[#f1e5d4]/16 hover:bg-[#2a231d]"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#f1e5d4]/8 bg-[#2c241e] text-[#fbf6ee] transition-transform duration-200 group-hover:scale-[1.03]">
                  <Icon />
                </span>
                <span className="mt-4 block text-lg font-semibold tracking-tight text-[#fbf6ee]">{name}</span>
                <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-[#e7dbc9]/34">{label}</span>
              </a>
            ))}
          </div>

          <div className="rounded-[28px] border border-[#f1e5d4]/8 bg-[#1d1713] p-5">
            <p className="retro-label mb-4 text-[#efe2d1]/56">Contact Info</p>
            <div className="space-y-4">
              {contactDetails.map(({ label, value, href }) => (
                <div key={label} className="border-b border-[#f1e5d4]/8 pb-4 last:border-b-0 last:pb-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#e6d9c8]/30">{label}</p>
                  {href ? (
                    <a href={href} className="mt-2 block text-sm font-medium text-[#f6eee2]/88 transition-colors hover:text-[#fffaf2]">
                      {value}
                    </a>
                  ) : (
                    <p className="mt-2 text-sm font-medium text-[#f6eee2]/88">{value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Contact;