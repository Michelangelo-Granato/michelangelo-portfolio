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
        <div className="space-y-10 md:space-y-14">
            <section className="surface-panel rounded-[40px] px-6 py-8 md:px-10 md:py-12">
                <p className="retro-label mb-4">Photography</p>
                <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] md:text-6xl">Pictures</h1>
                <div className="accent-rule my-6"></div>
                <p className="text-xl text-[var(--ink)]">A collection of memories from my travels.</p>
            </section>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {albums.map((album) => (
                    <Link key={album.href} href={album.href} className="surface-card group block rounded-[30px] p-4 transition-transform duration-200 hover:-translate-y-1">
                        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-[22px]">
                            <Image src={album.cover} alt={album.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
                        </div>
                        <h3 className="text-lg font-semibold tracking-tight text-[var(--ink-strong)]">{album.title}</h3>
                        <p className="mt-1 text-sm text-[var(--ink-soft)]">{album.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
