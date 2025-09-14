import Link from 'next/link'
const showContact = false;
const navItems = {
  '/': {
    name: 'home',
  },
  ...(showContact
    ? {
        '/contact': {
          name: 'contact',
        },
      }
    : {}),
}

export function Navbar() {
  return (
    <nav
      className="w-full bg-white/80 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 shadow-sm fixed top-0 left-0 z-50"
      id="nav"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-row items-center justify-between h-14">
          <div className="flex flex-row space-x-2">
            {Object.entries(navItems).map(([path, { name }]) => {
              return (
                <Link
                  key={path}
                  href={path}
                  className="transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-md px-4 py-2 font-medium capitalize"
                >
                  {name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
