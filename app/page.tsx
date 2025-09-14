import Contact from './components/contact'
import Skills from './components/skills'
import Projects from './components/projects'

export default function Page() {
  const showContact = false;
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
              <li>Gained expertise in full-stack software development working in a greenfield distributed microservice project</li>
              <li>Diagnosed slow MongoDB queries causing timeouts and immense DB scaling fees, wrote query optimizations reducing the daily usage from ~3 days of compute per day to just minutes, saving an estimated $15,000 per month</li>
              <li>Mentored new interns, taught company best practices, guided them through solving bugs and implementing features</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-medium">Software Developer</h3>
            <p className="text-gray-600 dark:text-gray-400">Dayforce | January 2024 - November 2024</p>
            <ul className="mt-2 list-disc list-inside text-gray-600 dark:text-gray-400">
              <li>Designed, led development, and implemented a draft application feature epic within 2 sprints, including full-stack React and .NET implementation, Kafka messaging, 90%+ unit/functional test coverage, REST API, with no regressions to date</li>
              <li>Led technical initiatives to improve backend logging and monitoring, saving 20 hours per sprint in bug triaging</li>
              <li>Developed frontend (Next.js) and backend (C# .NET) microservice features and bug fixes, working with Kafka, MongoDB, Docker, and Kubernetes</li>
              <li>Wrote comprehensive unit, functional, and end-to-end tests for both UI and backend using Cypress, Jest, NUnit, and others</li>
              <li>Wrote and groomed user stories outlining requirements of new features for the project</li>
              <li>Participated in and led scrum ceremonies such as Standup, Sprint Planning, Sprint Retrospectives, and Story Grooming</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-medium">Software Developer Intern</h3>
            <p className="text-gray-600 dark:text-gray-400">Dayforce | April 2023 - December 2023</p>
          </div>
          <div>
            <h3 className="text-xl font-medium">Software Developer Intern</h3>
            <p className="text-gray-600 dark:text-gray-400">Dayforce | April 2022 - August 2022</p>
          </div>
          <div>
            <h3 className="text-xl font-medium">Software Developer in Test Intern</h3>
            <p className="text-gray-600 dark:text-gray-400">Dayforce | April 2021 - April 2022</p>
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Education</h2>
        <div>
          <h3 className="text-xl font-medium">Honours Bachelor of Arts Computer Science, Minor Music</h3>
          <p className="text-gray-600 dark:text-gray-400">York University, Lassonde School of Engineering | Toronto, Ontario</p>
          <p className="text-gray-600 dark:text-gray-400">September 2018 - December 2023</p>
        </div>
      </section>

      {/* Projects Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Featured Projects</h2>
        <div className="my-8">
          <Projects />
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
      {showContact && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Contact</h2>
          <div className="my-8">
            <Contact />
          </div>
        </section>
      )}
    </div>
  )
}
