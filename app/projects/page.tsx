
import { projects } from '../data/projects';

export default function Page() {
    return (
        <div className="space-y-10 md:space-y-14">
            <section className="surface-panel rounded-[40px] px-6 py-8 md:px-10 md:py-12">
                <p className="retro-label mb-4">Projects</p>
                <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] md:text-6xl">Selected work</h1>
                <div className="accent-rule my-6"></div>
                <p className="max-w-2xl text-xl text-[var(--ink)]">
                    A detailed look at some of the projects I've worked on.
                </p>
            </section>

            <div className="space-y-16">
                {projects.map((project, index) => {
                    const accentColors = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-yellow)']
                    const accentColor = accentColors[index % accentColors.length]

                    return (
                    <article key={project.title} className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
                        <div className="surface-card aspect-video rounded-[30px] p-6">
                            <div className="flex h-full items-end rounded-[22px] border border-dashed border-[var(--line)] bg-[linear-gradient(135deg,rgba(198,59,50,0.06),rgba(45,94,157,0.08),rgba(216,166,43,0.08))] p-5">
                                <span className="retro-label">Project snapshot</span>
                            </div>
                        </div>
                        <div className="surface-card rounded-[30px] p-6 md:p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="retro-label mb-3" style={{ color: accentColor }}>Case study</p>
                                    <h2 className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">{project.title}</h2>
                                </div>
                                <div className="flex gap-3">
                                    <a
                                        href={project.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-[var(--line)] bg-white/50 px-4 py-2 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink-strong)]"
                                    >
                                        GitHub
                                    </a>
                                    {project.demoUrl && (
                                        <a
                                            href={project.demoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-full border border-[var(--line)] bg-white/50 px-4 py-2 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink-strong)]"
                                        >
                                            Demo
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                {project.technologies.map((tech) => (
                                    <span key={`${project.title}-${tech}`} className="rounded-full border border-[var(--line)] bg-white/45 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                                        {tech}
                                    </span>
                                ))}
                            </div>

                            <p className="mt-5 leading-7 text-[var(--ink)]">
                                {project.longDescription || project.description}
                            </p>
                        </div>
                    </article>
                    )
                })}
            </div>
        </div>
    )
}
