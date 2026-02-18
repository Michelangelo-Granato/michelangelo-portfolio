
import React from 'react';
import { projects } from '../data/projects';
import Link from 'next/link';

export default function Page() {
    return (
        <div className="space-y-12">
            <section className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    A detailed look at some of the projects I've worked on.
                </p>
            </section>

            <div className="space-y-16">
                {projects.map((project, index) => (
                    <article key={index} className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/3 aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-gray-400 dark:text-gray-500">Project Screenshot</span>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                                <h2 className="text-2xl font-bold">{project.title}</h2>
                                <div className="flex gap-3">
                                    <a
                                        href={project.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                    >
                                        GitHub
                                    </a>
                                    {project.demoUrl && (
                                        <a
                                            href={project.demoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                        >
                                            Demo
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {project.technologies.map((tech, i) => (
                                    <span key={i} className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                                        {tech}
                                    </span>
                                ))}
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {project.longDescription || project.description}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )
}
