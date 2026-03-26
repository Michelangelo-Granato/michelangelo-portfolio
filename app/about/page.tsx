

import Skills from '../components/skills'
import Projects from '../components/projects'

export default function Page() {
    return (
        <div className="space-y-10 md:space-y-14">
            <section className="surface-panel rounded-[40px] px-6 py-8 md:px-10 md:py-12">
                <p className="retro-label mb-4">About</p>
                <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] md:text-6xl">
                    Michelangelo Granato
                </h1>
                <div className="accent-rule my-6"></div>
                <p className="text-xl text-[var(--ink)]">
                    Software Developer II at Dayforce
                </p>
                <p className="mt-2 text-[var(--ink-soft)]">
                    Full-stack developer specializing in React, .NET, and distributed systems
                </p>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="surface-card rounded-[32px] p-6 md:p-8">
                    <p className="retro-label mb-3">About me</p>
                    <h2 className="mb-4 text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">Product-minded engineering.</h2>
                    <p className="text-[var(--ink)] leading-7">
                    I'm a passionate software developer with expertise in full-stack development and distributed systems.
                    Currently working at Dayforce, I focus on building scalable microservices and optimizing database performance.
                    I have a strong track record of mentoring, leading technical initiatives, and delivering high-quality software solutions.
                    </p>
                </div>
                <div className="surface-card rounded-[32px] p-6 md:p-8">
                    <p className="retro-label mb-3" style={{ color: 'var(--accent-blue)' }}>Working style</p>
                    <ul className="space-y-3 text-sm leading-6 text-[var(--ink-soft)]">
                        <li>Focused on maintainable systems with measurable outcomes.</li>
                        <li>Comfortable across UI, APIs, infrastructure, and data layers.</li>
                        <li>Strong preference for clear UX and straightforward implementation.</li>
                    </ul>
                </div>
            </section>

            <section className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="retro-label mb-2">Experience</p>
                        <h2 className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">Recent work</h2>
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="surface-card rounded-[32px] p-6 md:p-8">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-medium text-[var(--ink-strong)]">Software Developer II</h3>
                                <p className="text-sm text-[var(--accent-red)]">Dayforce | November 2024 - Present</p>
                            </div>
                        </div>
                        <ul className="space-y-2 text-[var(--ink-soft)]">
                            <li>Optimized MongoDB queries reducing daily compute time from 3 days to minutes, saving $15,000 monthly</li>
                            <li>Mentored interns in company best practices and development methodologies</li>
                        </ul>
                    </div>
                    <div className="surface-card rounded-[32px] p-6 md:p-8">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-medium text-[var(--ink-strong)]">Software Developer</h3>
                                <p className="text-sm text-[var(--accent-blue)]">Dayforce | January 2024 - November 2024</p>
                            </div>
                        </div>
                        <ul className="space-y-2 text-[var(--ink-soft)]">
                            <li>Led development of draft application feature with 90%+ test coverage</li>
                            <li>Improved backend logging and monitoring, saving 20 hours per sprint in bug triaging</li>
                            <li>Developed full-stack features using Next.js, C# .NET, Kafka, and MongoDB</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Projects Section */}
            <section className="space-y-5">
                <div>
                    <p className="retro-label mb-2">Projects</p>
                    <h2 className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">Featured projects</h2>
                </div>
                <div className="my-8">
                    <Projects />
                </div>
            </section>

            <section className="space-y-5">
                <div>
                    <p className="retro-label mb-2">Skills</p>
                    <h2 className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">Tools and systems</h2>
                </div>
                <div className="my-8">
                    <Skills />
                </div>
            </section>

        </div>
    )
}
