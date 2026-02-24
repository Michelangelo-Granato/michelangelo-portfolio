import Image from 'next/image'
import Link from 'next/link'

const albums = [
    {
        title: 'Malawi',
        href: '/pictures/malawi/disposable',
        cover: '/pictures/malawi/disposable/000094800009.webp',
        description: 'Shot on Fujifilm QuickSnap.',
    },
]

export default function Page() {
    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Pictures</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">A collection of memories from my travels.</p>
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
