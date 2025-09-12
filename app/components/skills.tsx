'use client';
import React from 'react';

const Skills = () => {
  const skills = {
    'Programming Languages': ['C#', 'TypeScript', 'JavaScript', 'Java', 'Python', 'C', 'C++', 'XML', 'JSON', 'Ajax'],
    'Frontend': ['HTML', 'CSS', 'React', 'Next.js'],
    'Backend': ['.NET Core', 'REST APIs', 'MongoDB', 'MySQL', 'Kafka'],
    'Testing & Quality': ['Jest', 'Cypress', 'NUnit', 'Unit Testing', 'E2E Testing'],
    'DevOps & Tools': ['Docker', 'Kubernetes', 'Git', 'Azure DevOps', 'Grafana', 'Postman', 'Swagger'],
    'Software & Applications': ['Visual Studio', 'VS Code', 'Jira', 'Confluence', 'MS Excel']
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(skills).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-lg font-medium">{category}</h3>
          <div className="flex flex-wrap gap-2">
            {items.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skills;
