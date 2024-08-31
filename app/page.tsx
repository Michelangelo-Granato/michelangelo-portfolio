import Contact from './components/contact'
import Skills from './components/skills'

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        Michelangelo Granato
      </h1>
      <p className="mb-4 text-center">
        {`Under Construction`}
      </p>
      <div className="my-8">
        <Skills />
      </div>
      <div className="my-8">
        <Contact />
      </div>
    </section>
  )
}
