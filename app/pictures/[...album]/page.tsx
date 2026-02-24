import fs from 'fs'
import path from 'path'
import Image from 'next/image'
import Link from 'next/link'

type Props = { params: Promise<{ album: string[] }> }

function tidyTitle(filename: string) {
  return filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function Page({ params }: Props) {
  const resolved = await params
  const segments = resolved?.album || []
  if (segments.length === 0) return null

  const dir = path.join(process.cwd(), 'public', 'pictures', ...segments)

  let entries: fs.Dirent[] = []
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch (e) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Album not found</h1>
        <p className="text-sm text-gray-500">Could not read album: {segments.join('/')}</p>
      </div>
    )
  }

  const subdirs = entries.filter((e) => e.isDirectory()).map((d) => d.name).sort().reverse()
  const imageFiles = entries.filter((e) => e.isFile() && /\.(jpe?g|png|webp|gif)$/i.test(e.name)).map((f) => f.name).sort().reverse()

  const title = segments.map((s) => s.replace(/[-_]/g, ' ')).join(' / ')

  // If this folder contains subfolders, show them as album cards (like /pictures)
  if (subdirs.length > 0) {
    const albums = subdirs.map((sub) => {
      const subdirPath = path.join(dir, sub)
      let cover = '/pictures/placeholder.jpg'
      try {
        const subEntries = fs.readdirSync(subdirPath).filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f)).sort().reverse()
        if (subEntries.length > 0) cover = `/pictures/${[...segments, sub].join('/')}/${subEntries[0]}`
      } catch (e) {
        // ignore — use placeholder if no images or can't read
      }

      return {
        title: tidyTitle(sub),
        href: `/pictures/${[...segments, sub].join('/')}`,
        cover,
        description: `${tidyTitle(sub)} — album`,
      }
    })

    return (
      <div className="space-y-8">
        <section className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">Albums inside {title}.</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Link key={album.href} href={album.href} className="group block">
              <div className="relative aspect-video w-full rounded-lg mb-3 overflow-hidden transition-transform group-hover:scale-[1.02]">
                <Image src={album.cover} alt={album.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
              </div>
              <h3 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{album.title}</h3>
              <p className="text-sm text-gray-500">{album.description}</p>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Otherwise render the images in this folder
  const pictures = imageFiles.map((file, i) => ({
    id: i + 1,
    title: tidyTitle(file),
    date: '2024',
    src: `/pictures/${segments.join('/')}/${file}`,
  }))

  const LightboxGallery = (await import('../../components/lightbox-gallery')).default

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">A collection of photos from {title}.</p>
      </section>

      <LightboxGallery images={pictures} />
    </div>
  )
}
