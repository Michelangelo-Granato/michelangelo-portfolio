
export default function Page() {
    const pictures = [
        { id: 1, title: 'Malawi Trip', date: '2024', color: 'bg-blue-100 dark:bg-blue-900' },
        { id: 2, title: 'Safari Adventure', date: '2024', color: 'bg-green-100 dark:bg-green-900' },
        { id: 3, title: 'Lake Malawi', date: '2024', color: 'bg-yellow-100 dark:bg-yellow-900' },
        { id: 4, title: 'Local Market', date: '2024', color: 'bg-red-100 dark:bg-red-900' },
        { id: 5, title: 'Mountain Hike', date: '2024', color: 'bg-purple-100 dark:bg-purple-900' },
        { id: 6, title: 'Village Visit', date: '2024', color: 'bg-pink-100 dark:bg-pink-900' },
    ]

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Pictures</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    A collection of memories from my travels.
                </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pictures.map((pic) => (
                    <div key={pic.id} className="group cursor-pointer">
                        <div className={`aspect-video w-full rounded-lg ${pic.color} mb-3 transition-transform group-hover:scale-[1.02] flex items-center justify-center`}>
                            <span className="text-gray-400 dark:text-gray-500">Image Placeholder</span>
                        </div>
                        <h3 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {pic.title}
                        </h3>
                        <p className="text-sm text-gray-500">{pic.date}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
