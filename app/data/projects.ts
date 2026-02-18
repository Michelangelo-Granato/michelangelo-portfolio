export interface Project {
    title: string;
    description: string;
    technologies: string[];
    githubUrl: string;
    demoUrl?: string;
    longDescription?: string; // For the detailed page
}

export const projects: Project[] = [
    {
        title: "Pairing Picker",
        description: "A web application I built for my partner that parses (a quite hard to read) flight work schedule, organizes it, and allows her to sort and filter it to find the best flights for her",
        longDescription: "This application solves a real-world problem for flight attendants who receive their monthly schedules in a difficult-to-parse format. It parses the raw data, presents it in a clean, user-friendly interface, and provides powerful filtering and sorting capabilities to help them manage their work-life balance effectively.",
        technologies: ["React", "Next.js", "Node.js", "TypeScript", "Tailwind CSS", "Vercel"],
        githubUrl: "https://github.com/Michelangelo-Granato/pairing-picker",
        demoUrl: "https://pairingpicker.vercel.app/",
    },
    {
        title: "Portfolio Website",
        description: "A modern, responsive portfolio website built with Next.js and Tailwind CSS. Features dark mode, analytics, and performance monitoring.",
        longDescription: "My personal portfolio website designed to showcase my skills and projects. Built with performance and accessibility in mind, utilizing the latest Next.js features and Tailwind CSS for styling. It includes a custom blog system, dark mode support, and integration with Vercel Analytics.",
        technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
        githubUrl: "https://github.com/Michelangelo-Granato/michelangelo-portfolio",
    },
    {
        title: "The Androse Cottage",
        description: "A website for a cottage rental in Muskoka, Ontario. Features a booking system, a calendar, and a contact form.",
        longDescription: "A complete booking and informational website for a vacation rental property. The site features a custom booking system, availability calendar, image gallery, and integration with third-party services for payments and notifications.",
        technologies: ["React", "Next.js", "Node.js", "TypeScript", "Tailwind CSS", "Vercel", "Prisma"],
        githubUrl: "https://github.com/Michelangelo-Granato/androse-cottage",
        demoUrl: "https://androse-cottage.vercel.app/",
    },
];
