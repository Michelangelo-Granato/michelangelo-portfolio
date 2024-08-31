'use client';
import { useState } from 'react';

const Contact: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <details>
          <summary onClick={() => setIsOpen(!isOpen)} className='text-2xl font-semibold tracking-tighter' style={{ borderBottom: '1px solid #333', width: '100%', display: 'block', padding: '5px' }}>
            Contact <span className='justify-end text-xl'>{isOpen ? '▼' : '▶'}</span>
          </summary>
          <div style={{ padding: '10px' }}></div>
    <div className="max-w-lg mx-auto p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Contact Me</h1>
      <form className="space-y-4">
        <div className="flex flex-col">
          <label htmlFor="name" className="text-sm font-semibold text-gray-600 mb-1">Name:</label>
          <input type="text" id="name" name="name" className="px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="email" className="text-sm font-semibold text-gray-600 mb-1">Email:</label>
          <input type="email" id="email" name="email" className="px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="message" className="text-sm font-semibold text-gray-600 mb-1">Message:</label>
          <textarea
            id="message"
            name="message"
            className="px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={6}
          ></textarea>
        </div>
        <div className="flex flex-col">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
              Send
          </button>
        </div>
      </form>
    </div>
  </details>

  );
};

export default Contact;