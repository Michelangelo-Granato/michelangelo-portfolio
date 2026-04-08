import Contact from '../components/contact';

export default function Page() {
    return (
        <div className="space-y-6 md:space-y-8">
            <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="retro-label mb-2">Contact</p>
                    <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] md:text-5xl">
                        Have a project in mind? Or just want to say hello? Reach out!
                    </h1>
                </div>
            </section>

            <Contact />
        </div>
    );
}
