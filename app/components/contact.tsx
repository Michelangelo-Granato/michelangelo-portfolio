'use client';
import { useState } from 'react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio inquiry from ${formData.name}`);
    const body = encodeURIComponent([
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
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
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-card rounded-[26px] p-5 text-sm text-[var(--ink-soft)]">
          <p className="retro-label mb-2" style={{ color: 'var(--accent-red)' }}>Email</p>
          <a href="mailto:michelangelo.granato.1@gmail.com" className="font-medium text-[var(--ink-strong)] transition-colors hover:text-[var(--accent-red)]">
            michelangelo.granato.1@gmail.com
          </a>
        </div>
        <div className="surface-card rounded-[26px] p-5 text-sm text-[var(--ink-soft)]">
          <p className="retro-label mb-2" style={{ color: 'var(--accent-blue)' }}>Phone</p>
          <p className="font-medium text-[var(--ink-strong)]">+1 (647) 390-6776</p>
        </div>
        <div className="surface-card rounded-[26px] p-5 text-sm text-[var(--ink-soft)]">
          <p className="retro-label mb-2" style={{ color: 'var(--accent-yellow)' }}>Location</p>
          <p className="font-medium text-[var(--ink-strong)]">Toronto, Ontario, Canada</p>
        </div>
      </div>

      <div className="surface-panel mx-auto max-w-2xl rounded-[32px] p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-[var(--ink-strong)]">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="block w-full rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-3 text-[var(--ink-strong)] outline-none transition-colors focus:border-[var(--accent-red)]"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--ink-strong)]">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="block w-full rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-3 text-[var(--ink-strong)] outline-none transition-colors focus:border-[var(--accent-blue)]"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-medium text-[var(--ink-strong)]">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="block w-full rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-3 text-[var(--ink-strong)] outline-none transition-colors focus:border-[var(--accent-yellow)]"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--ink-strong)] px-4 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;