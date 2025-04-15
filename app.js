//# Kowabi
const Kowabi = document.getElementById('kowabi')
Kowabi.toggle = () => {
	const msg = Kowabi.querySelector('#msg')
	if (!msg.classList.contains('hidden')) {
		clearTimeout(Steptext.timeout)
		msg.classList.toggle('hidden')
		setTimeout(() => Kowabi.querySelector('#msg').style.display = 'none', 300)
	} else {
		Kowabi.querySelector('#msg').style.display = ''
		setTimeout(() => msg.classList.toggle('hidden'))
		Steptext.step()
	}
}
Kowabi.text = Kowabi.querySelector('#text')
Steptext.element = Kowabi.text
Kowabi.options = Kowabi.querySelector('#options')
Kowabi.expression = Kowabi.querySelector('#expression')
Kowabi.setText = (string) => {
	Kowabi.text.textContent = ''
	Steptext.queue = string
	if (Kowabi.querySelector('#msg').classList.contains('hidden'))
		Kowabi.toggle()
}
Kowabi.resetOptions = () => Array.from(Kowabi.options.children).forEach(e => e.remove())
Kowabi.addOption = (text, nextKey=null, callback=null, condition=null) => {
	if (condition && !condition()) return
	const button = document.createElement('button')
	button.textContent = text
	button.addEventListener('click', () => {
		if (nextKey)
			Kowabi.playNode(nextKey)
		if (callback)
			callback()
	})
	Kowabi.options.append(button)
}
Kowabi.addOptions = (...options) => {
	for (const option of options)
		for (const [text, nextKey, callback, condition] of option)
			Kowabi.addOption(text, nextKey, callback, condition)
}
Kowabi.dialogueNodes = {}
Kowabi.addNode = (key, text, expression, ...options) => {
	Kowabi.dialogueNodes[key] = {text, expression, options}
}
Kowabi.addNodes = (...nodes) => {
	for (const node of nodes)
		for (const [key, text, expression, options] of node)
			Kowabi.addNode(key, text, expression, options)
}
Kowabi.playNode = (key) => {
	const node = Kowabi.dialogueNodes[key]
	if (!node) return console.warn(`Dialogue node "${key}" not found.`)

	Steptext.queue = ''
	Steptext.close = []
	Kowabi.setText(node.text)
	Kowabi.setExpression(...node.expression)
	Kowabi.resetOptions()
	Kowabi.addOptions(...node.options)
}
Kowabi.setExpression = (col, row) => Kowabi.expression.className = `col-${col} row-${row}`

//# Music player
const player = document.getElementById('music-player')
player.iconOn = player.querySelector('#icon img:first-of-type')
player.iconOff = player.querySelector('#icon img:last-of-type')
player.panel = player.querySelector('#panel')
player.songinfo = player.panel.querySelector('#title')
player.playlist = player.panel.querySelector('#playlist #list')
player.setTitle = (string) => player.songinfo.firstChild.textContent = string
player.setPlaytime = (string) => player.songinfo.lastChild.textContent = string
player.toggleIcon = (state=true) => {
	if (state) {
		player.iconOn.classList.remove('hidden')
		player.iconOff.classList.add('hidden')
	} else {
		player.iconOn.classList.add('hidden')
		player.iconOff.classList.remove('hidden')
	}
}
player.togglePanel = () => player.panel.classList.toggle('hidden')
player.togglePlaylist = () => {
	player.playlist.parentElement.classList.toggle('open')
	if (player.playlist.parentElement.classList.contains('open'))
		player.playlist.parentElement.style.top = `calc(-.5rem - 1rem * ${Math.max(player.playlist.children.length,3)})`
	else
		player.playlist.parentElement.style.top = ''
}
player.updatePlaylist = () => {
	for (const song of Playlist.playlist/*.filter(e => e.unlocked)*/) {
		const existing = player.playlist.querySelector('.'+song.key)
		if (existing) continue
		const listing = document.createElement('div')
		listing.setAttribute('data-key', song.key)
		listing.classList.add(song.key)
		listing.style.order = Playlist.playlist.indexOf(song)+1
		listing.innerHTML = `<div>${song === Playlist.current? '→':''}${song.title}</div><div>?:??</div>`
		listing.addEventListener('click', () => Playlist.playSong(song.key))
		player.playlist.append(listing)
		if (listing.scrollWidth > listing.clientWidth)
			listing.firstChild.outerHTML = listing.firstChild.outerHTML.replaceAll('div>', 'marquee>')
	}
}

class Playlist {
	static playlist = []
	static songs = new Map()
	static current
	static playtimeUpdateInterval

	static addSong(filename, title) {
		const howl = new Howl({
			src: [`assets/songs/${filename}.mp3`],
			loop: true,
			onload: () => {
				player.playlist.querySelector('.'+filename).children[1].textContent = secondsToTime(song.howl.duration())
			}
		})
		const song = {key: filename, title, unlocked: false, howl}
		this.playlist.push(song)
		this.songs.set(filename, song)
	}
	static addSongs(...songinfo) {
		for (const song of songinfo)
			for (const [filename, title] of song)
				this.addSong(filename, title)
	}
	static playSong(key, unlock=false) {
		const song = this.songs.get(key)
		if (!song)
			return console.warn(`Song with key "${key}" not found.`)
		this.current?.howl.stop()
		if (this.current)
			player.playlist.querySelector('.'+this.current.key).classList.remove('playing')
		if (unlock)
			song.unlocked = true
		this.current = song
		this.current.howl.play()
		player.playlist.querySelector('.'+key)?.classList.add('playing')
		player.setTitle(song.title)
		if (this.playtimeUpdateInterval)
			clearInterval(this.playtimeUpdateInterval)
		this.playtimeUpdateInterval = setInterval(() => 
			player.setPlaytime(' | '+secondsToTime(song.howl.seek())+' / '+secondsToTime(song.howl.duration())
		))
		player.updatePlaylist()
		player.toggleIcon(true)
	}
	static setVolume(volume) {
		this.playlist.forEach(e => e.howl.volume(volume))
	}
	static play() {
		if (!this.current) {
			const unlocked = this.playlist.filter(e => e.unlocked = true)
			if (unlocked.length === 0) return
			this.playSong(unlocked[0].key)
			return
		}
		if (this.current.howl.playing()) {
			this.current.howl.pause()
			player.toggleIcon(false)
		} else {
			this.current.howl.play()
			player.toggleIcon(true)
		}
	}
	static back() {
		this.current.howl.seek(this.current.howl.seek() - 5)
	}
	static fwrd() {
		this.current.howl.seek(this.current.howl.seek() + 5)
	}
	static prev() {
		const unlocked = this.playlist.filter(e => e.unlocked = true)
		const curIndex = unlocked.indexOf(this.current)
		if (curIndex == 0)
			this.playSong(unlocked.at(-1).key)
		else
			this.playSong(unlocked[curIndex-1].key)
	}
	static next() {
		const unlocked = this.playlist.filter(e => e.unlocked = true)
		const curIndex = unlocked.indexOf(this.current)
		if (curIndex == unlocked.length-1)
			this.playSong(unlocked[0].key)
		else
			this.playSong(unlocked[curIndex+1].key)
	}
}

//# Kowabi dialogues
//* Main page
Kowabi.addNodes([
	['intro-kt', `~Haine!~ _**Kowabi**_ maibe made, done maiyunama miremoyekai madeda!`, [3, 2], [
			['What?', null, () => {
				Kowabi.setText('')
				Kowabi.resetOptions()
				Kowabi.setExpression(5, 3)
			}]
		]],
	['intro-en', `I said... ~Greetings...~ I am _**Kowabi**_, and I will be your guide.`, [3, 1], [
			['Oh, okay', 'assistance'],
		]],
	['assistance', 'Would your _~stupid~_ self like some assistance?', [1, 1], [
			['Yes', 'assistance1-0'],
			['Of course', 'assistance1-1'],
		]],
	['assistance1-0', 'Of course. What do you need help with?', [4, 2], [
			['Life', 'life'],
			['Navigation', 'navigation'],
		]],
	['assistance1-1', '_Of !!course!!..._ Of _course_. What do you need help with?', [6, 2], [
			['Life', 'life'],
			['Navigation', 'navigation'],
		]],
	['life', "_~Don't we all...~_", [1, 4], [
			['Life', 'life'],
			['Navigation', 'navigation'],
		]],
	['navigation', "Well, there's not much to navigate for now, but I'm sure this place will be full of life in no time.", [
			['Life', 'life'],
			['Navigation', 'navigation'],
		]],
])

//# Songs
Playlist.addSongs([
	['kaboom', 'Terraria OST - Day'],
	['leafy', 'Pokemon Blue/Red OST - Celadon City'],
	['pal', 'Jonah Senzel - The Temple of Magicks'],
])

//# Effects
//? Stealth Rickroll
function Rickroll() {
	window.open('https://youtu.be/p7I-hPab3qo?si=VwK3N7QaI9k0ofAI&t=3', '_blank', 'width=1,height=1,left=99999,top=99999')
}
//? Sound effects
document.h_phaser = new Howl({src: ['assets/ras/phaser.mp3'], onload: player.updatePlaylist})
document.h_paper = new Howl({src: ['assets/pal/paper.mp3'], onload: player.updatePlaylist})
document.h_write = new Howl({src: ['assets/pal/write.mp3'], onload: player.updatePlaylist})

//# Functions
function goToPage(id) {
	if (document.currentPage)
		document.currentPage.classList.add('hidden')
	document.currentPage = document.querySelector(`.fullpage#${id}`)
	document.currentPage.classList.remove('hidden')
}
function addCollectible(key) {
	let collectibles = window.localStorage.getItem('collectibles')
	if (collectibles == null)
		collectibles = []
	else if (typeof(collectibles) == 'string')
		collectibles = collectibles.split(';')
	if (collectibles.includes(key))
		return
	collectibles.push(key)
	window.localStorage.setItem('collectibles', collectibles.join(';'))
}
function secondsToTime(seconds) {
	return Math.floor(seconds/60) + ':' + (''+Math.floor(seconds%60)).padStart(2, '0')
}

//# Starting setup
// setTimeout(() => document.getElementById('retroModal').style.display = 'block', 3000)
document.currentPage = document.querySelector('.fullpage#home')
goToPage('home')
Kowabi.playNode('intro-kt')
Kowabi.setExpression(3, 2)
setTimeout(() => player.updatePlaylist(), 1000)

//# Debug
const nav = document.getElementById('debug-nav')
for (const page of Array.from(document.querySelectorAll('.fullpage'))) {
	const button = document.createElement('button')
	button.textContent = page.id
	button.addEventListener('click', function(){goToPage(this.textContent)})
	nav.append(button)
}