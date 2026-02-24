
import Link from 'next/link'

export default function Page() {
  const links = [
    {
      name: 'About',
      url: '/about',
      external: false,
      description: 'About Me'
    },
    {
      name: 'Pictures',
      url: '/pictures',
      external: false,
      description: 'Photo Gallery'
    },
    {
      name: 'Projects',
      url: '/projects',
      external: false,
      description: 'My Work'
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/in/michelangelo-granato',
      external: true,
      description: 'Connect with me'
    },
    {
      name: 'GitHub',
      url: 'https://github.com/Michelangelo-Granato',
      external: true,
      description: 'Check out my code'
    },
    {
      name: 'Watch',
      url: 'https://watch.codebymic.com',
      external: true,
      description: 'My Jellyfin Media Server'
    },
    {
      name: 'Requests',
      url: 'https://requests.codebymic.com',
      external: true,
      description: 'Movie & Show Requests (Seerr)'
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-12 py-12">
      <section className="text-center space-y-4">
        <h1 className="text-6xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Mic's Space
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
          Welcome. Here are some things
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl px-4">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.url}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
            className="group relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 transition-all hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700"
          >
            <div className="flex flex-col space-y-2">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {link.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {link.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
