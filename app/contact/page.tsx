
import Contact from '../components/contact'

export default function Page() {
    return (
        <div className="space-y-10 md:space-y-14">
            <section className="surface-panel rounded-[40px] px-6 py-8 md:px-10 md:py-12">
                <p className="retro-label mb-4">Contact</p>
                <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] md:text-6xl">Get in touch</h1>
                <div className="accent-rule my-6"></div>
                <p className="max-w-2xl text-xl text-[var(--ink)]">
                    Get in touch with me.
                </p>
            </section>

            <div className="my-8">
                <Contact />
            </div>
        </div>
    )
}
