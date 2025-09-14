import Contact from '../components/contact'

export const metadata = {
  title: 'Contact - Michelangelo Granato',
  description: 'Get in touch!'
}

export default function Page() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Contact</h1>
      <div className="my-8">
        <Contact />
      </div>
    </section>
  )
}
