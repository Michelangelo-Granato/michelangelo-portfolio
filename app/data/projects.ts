export interface Project {
    title: string;
    description: string;
    technologies: string[];
    githubUrl: string;
    demoUrl?: string;
    longDescription?: string; // For the detailed page
    snapshotImage?: string;
}

export const projects: Project[] = [
    {
        title: "The Androse Cottage",
        description: "A website for a cottage rental in Muskoka, Ontario. Features a booking system, a calendar, and a contact form.",
        longDescription: "A complete booking and informational website for a vacation rental property. The site features a custom booking system, availability calendar, image gallery, and integration with third-party services for payments and notifications.",
        technologies: ["React", "Next.js", "Node.js", "TypeScript", "Tailwind CSS", "Vercel", "Prisma"],
        githubUrl: "https://github.com/Michelangelo-Granato/androse-cottage",
        demoUrl: "https://androse-cottage.vercel.app/",
        snapshotImage: "/cottage-snap.png",
    },
    {
        title: "TattooFinder",
        description: "A tattoo discovery engine for finding studios and artists by city, style, and visual references.",
        longDescription: "TattooFinder helps people discover tattoo studios and artists through map-driven browsing, style-aware search, and reverse image workflows. It focuses on practical discovery UX with location data, fast filtering, and production deployment on Vercel.",
        technologies: ["Next.js", "TypeScript", "Supabase", "Mapbox", "Vercel"],
        githubUrl: "https://github.com/Michelangelo-Granato/tattoofinder",
        demoUrl: "https://tattoofinder.vercel.app/",
        snapshotImage: "/tattoofinder-snap.png",
    },
    {
        title: "OpenTabs",
        description: "An open-source guitar tab platform to discover, create, and share tabs with interactive playback and editing.",
        longDescription: "OpenTabs is a free, open-source alternative for guitar tab workflows. It combines library discovery, notation tooling, and modern web UX so musicians can browse, practice, and publish tabs in a collaborative platform.",
        technologies: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Vercel"],
        githubUrl: "https://github.com/Michelangelo-Granato/opentabs",
        demoUrl: "https://tabsmith.vercel.app/",
        snapshotImage: "/opentabs-snap.png",
    },
    {
        title: "Portfolio Website",
        description: "A modern, responsive portfolio website built with Next.js and Tailwind CSS. Features dark mode, analytics, and performance monitoring.",
        longDescription: "My personal portfolio website designed to showcase my skills and projects. Built with performance and accessibility in mind, utilizing the latest Next.js features and Tailwind CSS for styling. It includes a custom blog system, dark mode support, and integration with Vercel Analytics.",
        technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
        githubUrl: "https://github.com/Michelangelo-Granato/michelangelo-portfolio",
        demoUrl: "/",
        snapshotImage: "/portfolio-snap.png",
    },
    {
        title: "Pairing Picker",
        description: "A web application I built for my partner that parses (a quite hard to read) flight work schedule, organizes it, and allows her to sort and filter it to find the best flights for her",
        longDescription: "This application solves a real-world problem for flight attendants who receive their monthly schedules in a difficult-to-parse format. It parses the raw data, presents it in a clean, user-friendly interface, and provides powerful filtering and sorting capabilities to help them manage their work-life balance effectively.",
        technologies: ["React", "Next.js", "Node.js", "TypeScript", "Tailwind CSS", "Vercel"],
        githubUrl: "https://github.com/Michelangelo-Granato/pairing-picker",
        demoUrl: "https://pairingpicker.vercel.app/",
    },
    
    
];
