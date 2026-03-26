import Link from 'next/link'
import { formatDate, getBlogPosts } from 'app/blog/utils'

export function BlogPosts() {
  const allBlogs = [...getBlogPosts()].sort((a, b) => {
    if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
      return -1
    }
    return 1
  })

  return (
    <div className="space-y-4">
      {allBlogs
        .map((post, index) => {
          const accentColors = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-yellow)']
          const accentColor = accentColors[index % accentColors.length]

          return (
          <Link
            key={post.slug}
            className="surface-card flex flex-col gap-2 rounded-[26px] p-5 transition-transform duration-200 hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between"
            href={`/blog/${post.slug}`}
          >
            <div className="w-full md:flex md:items-center md:gap-4">
              <p
                className="w-[110px] tabular-nums text-xs font-medium uppercase tracking-[0.18em]"
                style={{ color: accentColor }}
              >
                {formatDate(post.metadata.publishedAt, false)}
              </p>
              <p className="tracking-tight text-[var(--ink-strong)]">
                {post.metadata.title}
              </p>
            </div>
          </Link>
          )
        })}
    </div>
  )
}
