
import { projects } from '../data/projects';

export default function Page() {
    return (
        <div className="space-y-10 md:space-y-14">
            <section className="surface-panel rounded-[40px] px-6 py-8 md:px-10 md:py-12">
                <p className="retro-label mb-4">Projects</p>
                <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] md:text-6xl">Some Things I've Built</h1>
                <div className="accent-rule my-6"></div>
                <p className="max-w-2xl text-xl text-[var(--ink)]">
                    A look at some of the projects I've worked on for fun.
                </p>
            </section>

            <div className="space-y-16">
                {projects.map((project, index) => {
                    const accentColors = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-yellow)']
                    const accentColor = accentColors[index % accentColors.length]
                    const siteUrl = project.demoUrl || project.githubUrl

                    return (
                    <article key={project.title} className="grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
                        <div className="surface-card aspect-video rounded-[30px] p-6 lg:aspect-auto lg:h-full">
                            {siteUrl ? (
                                <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                                    {project.snapshotImage ? (
                                        <div className="h-full w-full overflow-hidden rounded-[22px] border border-dashed border-[var(--line)]">
                                            <img
                                                src={project.snapshotImage}
                                                alt={`${project.title} snapshot`}
                                                className="object-cover w-full h-full"
                                                loading="lazy"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex h-full items-end rounded-[22px] border border-dashed border-[var(--line)] bg-[linear-gradient(135deg,rgba(198,59,50,0.06),rgba(45,94,157,0.08),rgba(216,166,43,0.08))] p-5">
                                            <span className="retro-label">Project snapshot</span>
                                        </div>
                                    )}
                                </a>
                            ) : (
                                project.snapshotImage ? (
                                    <div className="h-full w-full overflow-hidden rounded-[22px] border border-dashed border-[var(--line)]">
                                        <img
                                            src={project.snapshotImage}
                                            alt={`${project.title} snapshot`}
                                            className="object-cover w-full h-full"
                                            loading="lazy"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-full items-end rounded-[22px] border border-dashed border-[var(--line)] bg-[linear-gradient(135deg,rgba(198,59,50,0.06),rgba(45,94,157,0.08),rgba(216,166,43,0.08))] p-5">
                                        <span className="retro-label">Project snapshot</span>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="surface-card rounded-[30px] p-6 md:p-8 lg:h-full">
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
                                        className="rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-strong)] transition-colors"
                                        style={{
                                            borderWidth: '1px',
                                            borderStyle: 'solid',
                                            borderColor: `color-mix(in srgb, ${accentColor} 42%, var(--line))`,
                                            background: `color-mix(in srgb, ${accentColor} 22%, transparent)`,
                                        }}
                                    >
                                        GitHub
                                    </a>
                                    {project.demoUrl && (
                                        <a
                                            href={project.demoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-strong)] transition-colors"
                                            style={{
                                                borderWidth: '1px',
                                                borderStyle: 'solid',
                                                borderColor: `color-mix(in srgb, ${accentColor} 42%, var(--line))`,
                                                background: `color-mix(in srgb, ${accentColor} 22%, transparent)`,
                                            }}
                                        >
                                            Demo
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                {project.technologies.map((tech, techIndex) => {
                                    const techAccent = accentColors[techIndex % accentColors.length]

                                    return (
                                        <span
                                            key={`${project.title}-${tech}`}
                                            className="rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--ink-strong)]"
                                            style={{
                                                borderWidth: '1px',
                                                borderStyle: 'solid',
                                                borderColor: `color-mix(in srgb, ${techAccent} 42%, var(--line))`,
                                                background: `color-mix(in srgb, ${techAccent} 22%, transparent)`,
                                            }}
                                        >
                                            {tech}
                                        </span>
                                    )
                                })}
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
