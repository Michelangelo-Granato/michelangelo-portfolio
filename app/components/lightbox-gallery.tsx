"use client"

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

type ImageItem = { id: number; title: string; src: string; date?: string }

export default function LightboxGallery({ images }: { images: ImageItem[] }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const openAt = useCallback((i: number) => {
    setIndex(i)
    setOpen(true)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, prev, next])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => openAt(i)}
            className="group cursor-pointer text-left"
            aria-label={`Open ${img.title}`}
          >
            <div className="relative aspect-video w-full rounded-lg mb-3 overflow-hidden transition-transform group-hover:scale-[1.02]">
              <Image src={img.src} alt={img.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
            </div>
            <h3 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{img.title}</h3>
            {img.date && <p className="text-sm text-gray-500">{img.date}</p>}
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={close}>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Previous"
          >
            ‹
          </button>

          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[index].src}
              alt={images[index].title}
              width={1600}
              height={900}
              className="object-contain max-h-[90vh] max-w-[90vw]"
              sizes="90vw"
            />
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Next"
          >
            ›
          </button>

          <button
            className="absolute top-4 right-4 rounded bg-white/10 px-3 py-1 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              close()
            }}
            aria-label="Close"
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}
