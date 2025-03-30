import Contact from './components/contact'
import Skills from './components/skills'

export default function Page() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Michelangelo Granato
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Software Developer II at Dayforce
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Full-stack developer specializing in React, .NET, and distributed systems
        </p>
      </section>

      {/* About Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">About Me</h2>
        <p className="text-gray-600 dark:text-gray-400">
          I'm a passionate software developer with expertise in full-stack development and distributed systems. 
          Currently working at Dayforce, I focus on building scalable microservices and optimizing database performance. 
          I have a strong track record of mentoring, leading technical initiatives, and delivering high-quality software solutions.
        </p>
      </section>

      {/* Experience Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Experience</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-medium">Software Developer II</h3>
            <p className="text-gray-600 dark:text-gray-400">Dayforce | November 2024 - Present</p>
            <ul className="mt-2 list-disc list-inside text-gray-600 dark:text-gray-400">
              <li>Optimized MongoDB queries reducing daily compute time from 3 days to minutes, saving $15,000 monthly</li>
              <li>Mentored interns in company best practices and development methodologies</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-medium">Software Developer</h3>
            <p className="text-gray-600 dark:text-gray-400">Dayforce | January 2024 - November 2024</p>
            <ul className="mt-2 list-disc list-inside text-gray-600 dark:text-gray-400">
              <li>Led development of draft application feature with 90%+ test coverage</li>
              <li>Improved backend logging and monitoring, saving 20 hours per sprint in bug triaging</li>
              <li>Developed full-stack features using Next.js, C# .NET, Kafka, and MongoDB</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Skills</h2>
        <div className="my-8">
          <Skills />
        </div>
      </section>

      {/* Contact Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Contact</h2>
        <div className="my-8">
          <Contact />
        </div>
      </section>
    </div>
  )
}
