import React from 'react';

const Skills = () => {
  const skills = {
    'Programming Languages': ['C#', 'TypeScript', 'JavaScript', 'Java', 'Python', 'C', 'C++', 'XML', 'JSON', 'Ajax'],
    'Frontend': ['HTML', 'CSS', 'React', 'Next.js'],
    'Backend': ['.NET Core', 'REST APIs', 'MongoDB', 'SQL', 'Kafka'],
    'Testing & Quality': ['Jest', 'Cypress', 'NUnit', 'Unit Testing', 'E2E Testing'],
    'DevOps & Tools': ['Docker', 'Kubernetes', 'Git', 'Azure DevOps', 'Grafana', 'Postman', 'Swagger'],
    'Software & Applications': ['Visual Studio', 'VS Code', 'Jira', 'Confluence', 'MS Excel']
  };

  let runningSkillIndex = 0

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {Object.entries(skills).map(([category, items], index) => {
        const accentColors = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-yellow)']
        const accentColor = accentColors[index % accentColors.length]

        return (
        <div key={category} className="surface-card rounded-[28px] p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ink-strong)]">{category}</h3>
            <span
              className="accent-dot"
              style={{ color: accentColor }}
            ></span>
          </div>
          <div className="flex flex-wrap gap-2">
            {items.map((skill) => {
              const skillAccent = accentColors[runningSkillIndex % accentColors.length]
              runningSkillIndex += 1

              return (
                <span
                  key={skill}
                  className="rounded-full px-3 py-1.5 text-sm text-[var(--ink-strong)]"
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `color-mix(in srgb, ${skillAccent} 42%, var(--line))`,
                    background: `color-mix(in srgb, ${skillAccent} 22%, transparent)`,
                  }}
                >
                  {skill}
                </span>
              )
            })}
          </div>
        </div>
        )
      })}
    </div>
  );
}

export default Skills;
