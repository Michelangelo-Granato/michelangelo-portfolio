import { BlogPosts } from 'app/components/posts'

export const metadata = {
  title: 'Blog',
  description: 'Read my blog.',
}

export default function Page() {
  return (
    <section className="space-y-8">
      <div className="surface-panel rounded-[40px] px-6 py-8 md:px-10 md:py-12">
        <p className="retro-label mb-4">Writing</p>
        <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] md:text-6xl">My Blog</h1>
        <div className="accent-rule my-6"></div>
      </div>
      <BlogPosts />
    </section>
  )
}
