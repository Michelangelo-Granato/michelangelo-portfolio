import { getBlogPosts } from 'app/blog/utils'

export const baseUrl = 'https://codebymic.com'

export default async function sitemap() {
  let posts = getBlogPosts()

  let blogs = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }))

  // Only advertise /blog once something is published there, so an empty index
  // never gets indexed.
  let paths = ['', '/about', '/projects', '/server', '/pictures', '/contact']
  if (posts.length > 0) {
    paths.push('/blog')
  }

  let routes = paths.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs]
}
