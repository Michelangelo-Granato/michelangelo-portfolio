
'use client';
import React from 'react';
import { projects } from '../data/projects';

const Projects: React.FC = () => {
    const accentColors = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-yellow)']
    let runningLinkIndex = 0

    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {projects.map((project, index) => {
                const gridColumns = ['span 7 / span 7', 'span 5 / span 5', 'span 12 / span 12']
                const accentColor = accentColors[index] ?? 'var(--accent-yellow)'
                const gridColumn = gridColumns[index] ?? 'span 12 / span 12'
                const githubAccent = accentColors[runningLinkIndex % accentColors.length]
                runningLinkIndex += 1
                const demoAccent = project.demoUrl
                    ? accentColors[runningLinkIndex % accentColors.length]
                    : null

                if (project.demoUrl) {
                    runningLinkIndex += 1
                }

                return (
                <div
                    key={project.title}
                    className="surface-card group relative flex flex-col rounded-[30px] p-6 transition-transform duration-200 hover:-translate-y-1 lg:p-8"
                    style={{ gridColumn }}
                >
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <p className="retro-label mb-3" style={{ color: accentColor }}>
                                Stuff I've built
                            </p>
                            <h3 className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">{project.title}</h3>
                        </div>
                        <div className="flex gap-2">
                            <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full p-2.5 text-[var(--ink-soft)] transition-colors hover:text-[var(--ink-strong)]"
                                style={{
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: `color-mix(in srgb, ${githubAccent} 42%, var(--line))`,
                                    background: `color-mix(in srgb, ${githubAccent} 22%, transparent)`,
                                }}
                                aria-label="GitHub Repository"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                            {project.demoUrl && (
                                <a
                                    href={project.demoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-full p-2.5 text-[var(--ink-soft)] transition-colors hover:text-[var(--ink-strong)]"
                                    style={{
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                        borderColor: demoAccent ? `color-mix(in srgb, ${demoAccent} 42%, var(--line))` : 'var(--line)',
                                        background: demoAccent ? `color-mix(in srgb, ${demoAccent} 22%, transparent)` : 'transparent',
                                    }}
                                    aria-label="Live Demo"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                    <p className="mb-6 flex-grow max-w-[62ch] text-sm leading-6 text-[var(--ink)] md:text-base">
                        {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
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
                </div>
                )
            })}
        </div>
    );
};

export default Projects;