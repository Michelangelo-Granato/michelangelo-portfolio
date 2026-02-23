import MusicPlayer from '../components/musicPlayer'

export default function Page() {
	return (
		<main className="min-h-screen p-6">
			<h1 className="text-3xl font-bold">Music</h1>
			<p className="mt-2 text-gray-600">Play demos and streamed tracks from your Navidrome server.</p>
			<MusicPlayer />
		</main>
	)
}
