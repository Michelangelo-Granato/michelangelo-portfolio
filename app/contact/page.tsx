
import Contact from '../components/contact'

export default function Page() {
    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    Get in touch with me.
                </p>
            </section>

            <div className="my-8">
                <Contact />
            </div>
        </div>
    )
}
