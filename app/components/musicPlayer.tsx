"use client"

import { useEffect, useRef, useState } from "react";

type Track = {
  id: string;
  title: string;
  artist?: string;
  src: string;
};

type Source = {
  id: string;
  title: string;
  endpoint: string; // either API endpoint or external share URL
  expanded?: boolean;
  tracks?: Track[];
};

export default function MusicPlayer() {
  const [sources, setSources] = useState<Source[]>(() => {
    // default demo source that hits our proxy route
    return [
      { id: 'demos', title: 'Demos', endpoint: '/api/music/proxy', expanded: true, tracks: [] }
    ]
  });

  const [selected, setSelected] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadingSource, setLoadingSource] = useState<string | null>(null);
  const [artists, setArtists] = useState<any[]>([])
  const [artistView, setArtistView] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null)
  const [artworkSrc, setArtworkSrc] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // preload tracks for expanded sources
    sources.forEach(src => {
      if (src.expanded && (!src.tracks || src.tracks.length === 0)) {
        fetchSourceTracks(src.id, src.endpoint)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

    async function fetchSourceTracks(id: string, endpoint: string) {
    setLoadingSource(id)
    try {
      if (endpoint.startsWith('/api')) {
        // call proxy with Subsonic-compatible action to get shares
        const url = endpoint.includes('?') ? `${endpoint}&action=getShares` : `${endpoint}?action=getShares`
        const res = await fetch(url)
        const data = await res.json()
        // Normalize possible Navidrome Subsonic JSON structures
        let list: any[] = []
        // try common paths
        if (Array.isArray(data)) list = data
        else if (data?.shares?.share) list = data.shares.share
        else if (data['subsonic-response']?.shares?.share) list = data['subsonic-response'].shares.share
        else {
          // fallback: find first array of objects
          for (const k of Object.keys(data || {})) {
            if (Array.isArray((data as any)[k]) && (data as any)[k].length > 0 && typeof (data as any)[k][0] === 'object') {
              list = (data as any)[k]
              break
            }
          }
        }

        const tracks: Track[] = list.map((t: any, i: number) => {
          // Subsonic share object may contain .song or .id; try to extract sensible fields
          const idField = t.id ?? t.songId ?? t.song?.id ?? `t-${i}`
          const title = t.title ?? t.name ?? t.song?.title ?? t.song?.name ?? `Track ${i+1}`
          const artist = t.artist ?? t.song?.artist ?? ''
          // If share provides a `url` or `song?.path`, use proxy streamById or direct
          let src = ''
          if (t.url) {
            src = `/api/music/proxy?action=stream&url=${encodeURIComponent(t.url)}`
          } else if (t.id) {
            src = `/api/music/proxy?action=streamById&id=${encodeURIComponent(t.id)}`
          } else if (t.song?.id) {
            src = `/api/music/proxy?action=streamById&id=${encodeURIComponent(t.song.id)}`
          }
          return { id: String(idField), title, artist, src }
        })
        setSources(prev => prev.map(s => s.id === id ? { ...s, tracks } : s))
      } else {
        // external URL -> create single proxied stream track
        const src = `/api/music/proxy?action=stream&url=${encodeURIComponent(endpoint)}`
        const track: Track = { id: `${id}-ext-1`, title: endpoint, artist: '', src }
        setSources(prev => prev.map(s => s.id === id ? { ...s, tracks: [track] } : s))
      }
    } catch (e) {
      console.error('Failed to fetch source tracks', e)
      setSources(prev => prev.map(s => s.id === id ? { ...s, tracks: [] } : s))
    } finally {
      setLoadingSource(null)
    }
  }

  // Artists handling
  async function fetchArtists() {
    try {
      const res = await fetch('/api/music/proxy?action=getArtists')
      const data = await res.json()
      let list: any[] = []
      if (Array.isArray(data)) list = data
      else if (data?.artists?.index) list = data.artists.index
      else if (data['subsonic-response']?.artists?.index) list = data['subsonic-response'].artists.index
      else {
        for (const k of Object.keys(data || {})) {
          if (Array.isArray((data as any)[k])) { list = (data as any)[k]; break }
        }
      }
      const items = list.map((g: any) => ({ id: g.id ?? g.name ?? g.artistId ?? g.musicFolderId, name: g.name ?? g.title ?? g.artist }))
      setArtists(items)
    } catch (e) {
      console.error('Failed to fetch artists', e)
      setArtists([])
    }
  }

  async function fetchArtistDetail(id: string) {
    try {
      const res = await fetch(`/api/music/proxy?action=getArtist&id=${encodeURIComponent(id)}`)
      const data = await res.json()
      let artistObj: any = null
      if (data?.artist) artistObj = data.artist
      else if (data['subsonic-response']?.artist) artistObj = data['subsonic-response'].artist
      else {
        for (const k of Object.keys(data || {})) {
          const v = (data as any)[k]
          if (v && typeof v === 'object' && (v.name || v.id)) { artistObj = v; break }
        }
      }
      setSelectedArtist(artistObj)
      const songList = artistObj?.song ?? artistObj?.songs ?? artistObj?.album?.song ?? []
      const arr = Array.isArray(songList) ? songList : (songList?.song ? songList.song : [])
      const artistTracks: Track[] = []
      arr.forEach((s: any, i: number) => {
        const id = s.id ?? s.songId ?? `a-${i}`
        const title = s.title ?? s.name ?? (`Track ${i+1}`)
        const artist = s.artist ?? artistObj?.name ?? ''
        let src = ''
        if (s.id) src = `/api/music/proxy?action=streamById&id=${encodeURIComponent(s.id)}`
        else if (s.url) src = `/api/music/proxy?action=stream&url=${encodeURIComponent(s.url)}`
        artistTracks.push({ id: String(id), title, artist, src })
      })
      setSources(prev => prev.map(s => s.id === 'demos' ? { ...s, tracks: artistTracks } : s))
      const coverId = artistObj?.coverArt ?? artistObj?.album?.coverArt ?? null
      if (coverId) setArtworkSrc(`/api/music/proxy?action=getCoverArt&id=${encodeURIComponent(coverId)}`)
      else setArtworkSrc(null)
    } catch (e) {
      console.error('Failed to fetch artist detail', e)
      setSelectedArtist(null)
    }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setTime(audio.currentTime || 0);
    const onDur = () => setDuration(audio.duration || 0);
    const onEnd = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onDur);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onDur);
      audio.removeEventListener('ended', onEnd);
    };
  }, [audioRef.current]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [playing, selected]);

  function selectTrack(t: Track) {
    setSelected(t);
    setPlaying(true);
  }

  function togglePlay() {
    setPlaying(p => !p);
  }

  function seekTo(v: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = v;
    setTime(v);
  }

  function toggleSource(id: string) {
    setSources(prev => prev.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s))
    const src = sources.find(s => s.id === id)
    if (src && (!src.tracks || src.tracks.length === 0)) fetchSourceTracks(id, src.endpoint)
  }

  // Add new source from user-provided URL
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  function addSource() {
    if (!newUrl) return
    const id = `src-${Date.now()}`
    const src: Source = { id, title: newTitle || newUrl, endpoint: newUrl, expanded: true, tracks: [] }
    setSources(prev => [...prev, src])
    setNewTitle('')
    setNewUrl('')
    fetchSourceTracks(id, newUrl)
  }

  // flattened track list for prev/next navigation
  const allTracks = sources.flatMap(s => s.tracks ?? [])

  function prevTrack() {
    if (!selected) return
    const idx = allTracks.findIndex(t => t.id === selected.id)
    if (idx > 0) selectTrack(allTracks[idx - 1])
  }

  function nextTrack() {
    if (!selected) return
    const idx = allTracks.findIndex(t => t.id === selected.id)
    if (idx >= 0 && idx < allTracks.length - 1) selectTrack(allTracks[idx + 1])
  }

  return (
    <div className="mt-8">
      <div className="bg-gradient-to-br from-gray-900 via-neutral-900 to-gray-800 text-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 flex gap-6">
          {/* Left: artwork */}
          <div className="w-48 h-48 bg-black rounded-md flex items-center justify-center overflow-hidden">
            {artworkSrc ? (
              <img src={artworkSrc} alt="art" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400' }} />
            ) : selected ? (
              <img src={selected.src.endsWith('.jpg') || selected.src.endsWith('.png') ? selected.src : 'https://placehold.co/600x400'} alt="art" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400' }} />
            ) : (
              <div className="text-center text-gray-300 px-2">No artwork</div>
            )}
          </div>

          {/* Right: details and track list */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-semibold">{selected ? selected.title : 'Demos & Tracks'}</h3>
                <p className="text-sm text-gray-300">{selected?.artist ?? 'Various Artists'}</p>
              </div>
              <div className="text-sm text-gray-400">{allTracks.length} tracks</div>
            </div>

            <div className="mt-4 flex-1 overflow-auto">
              <ul className="space-y-2 pr-4">
                {allTracks.map((track, i) => (
                  <li key={track.id} className={`flex items-center justify-between p-2 rounded ${selected?.id === track.id ? 'bg-neutral-800' : 'hover:bg-neutral-900'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 text-sm text-gray-300">{i + 1}</div>
                      <button className="text-left" onClick={() => selectTrack(track)}>
                        <div className="font-medium">{track.title}</div>
                        {track.artist && <div className="text-xs text-gray-400">{track.artist}</div>}
                      </button>
                    </div>
                    <div>
                      <button className="px-3 py-1 bg-transparent border border-neutral-700 rounded text-sm" onClick={() => { setSelected(track); setPlaying(s => !s); }}>
                        {selected?.id === track.id && playing ? 'Pause' : 'Play'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-center gap-6 relative">
                <button className="text-sm text-gray-400" onClick={() => { setArtistView(v => { const next = !v; if (next) fetchArtists(); return next }) }}>{artistView ? 'Library' : 'Artists'}</button>
                <button className="text-gray-400 hover:text-white" onClick={() => { /* shuffle placeholder */ }} aria-label="Shuffle">⤨</button>
                <button className="text-gray-200 text-2xl px-3" onClick={prevTrack} aria-label="Previous">◀◀</button>
                <button className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center text-xl" onClick={() => setPlaying(p => !p)} aria-label="Play/Pause">{playing ? '▌▌' : '►'}</button>
                <button className="text-gray-200 text-2xl px-3" onClick={nextTrack} aria-label="Next">▶▶</button>
                <button className="text-gray-400 hover:text-white" onClick={() => { /* repeat placeholder */ }} aria-label="Repeat">🔁</button>
              </div>

              {artistView && (
                <div className="mt-3 border rounded p-2 bg-neutral-900">
                  <div className="text-sm font-medium mb-2">Artists</div>
                  <div className="max-h-60 overflow-auto">
                    {artists.map(a => (
                      <button key={a.id} className="block w-full text-left py-1 px-1 text-sm text-gray-300 hover:bg-neutral-800 rounded" onClick={() => fetchArtistDetail(a.id)}>{a.name}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3">
                <input type="range" min={0} max={Math.max(1, duration)} value={time} onChange={(e) => seekTo(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <div>{new Date((time || 0) * 1000).toISOString().substr(14, 5)}</div>
                  <div>{new Date((duration || 0) * 1000).toISOString().substr(14, 5)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={selected?.src ?? undefined} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} className="hidden" controls={false} />
    </div>
  )
}
