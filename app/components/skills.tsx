'use client';
import React, { useState } from 'react';

const Skills = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <section>
            <details>
                <summary onClick={() => setIsOpen(!isOpen)} className='text-2xl font-semibold tracking-tighter' style={{ borderBottom: '1px solid #333', width: '100%', display: 'block', padding: '5px' }}>
                    Skills and Education <span className='justify-end text-xl'>{isOpen ? '▼' : '▶'}</span>

                </summary>
                <div style={{ padding: '10px' }}>
                    <div >
                        <h2 className="mb-4 text-xl font-semibold tracking-tighter">Skills</h2>
                        <ul className="list-disc list-inside">
                            <li>Full Stack Development</li>
                            <li>Frontend Technologies (e.g., HTML, CSS, JavaScript)</li>
                            <li>Backend Technologies (e.g., Node.js, Python)</li>
                            <li>Database Management (e.g., SQL, MongoDB)</li>
                            <li>Version Control (e.g., Git)</li>
                        </ul>
                    </div>
                    <div className="my-8">
                        <h2 className="mb-4 text-xl font-semibold tracking-tighter">Education</h2>
                        <p>Honours Bachelor's Degree in Computer Science (With Minor in Music :D)</p>
                        <p>York University, Lassonde School of Engineering</p>
                    </div>
                </div>
            </details>
        </section>
    );
}

export default Skills;
