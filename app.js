//# Kowabi
const Kowabi = document.getElementById('kowabi')
Kowabi.toggle = () => {
	const msg = Kowabi.querySelector('#msg')
	msg.classList.toggle('hidden')
	if (msg.classList.contains('hidden'))
		clearTimeout(Steptext.timeout)
	else
		Steptext.step()
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
player.title = player.panel.querySelector('#title')
player.playlist = player.panel.querySelector('#playlist #list')
player.setTitle = (string) => player.title.textContent = string
player.toggleIcon = () => {
	player.iconOn.classList.toggle('hidden')
	player.iconOff.classList.toggle('hidden')
}
player.togglePanel = () => player.panel.classList.toggle('hidden')
player.togglePlaylist = () => player.playlist.parentElement.classList.toggle('open')
player.updatePlaylist = () => {
	Array.from(player.playlist.children).forEach(e => e.remove())
	for (const song of Playlist.playlist.filter(e => e.unlocked)) {
		const listing = document.createElement('div')
		// listing.textContent = song.title
		listing.innerHTML = `<div>${song.title}</div><div>${(song.howl.duration()/60).toFixed()}:${(song.howl.duration()%60).toFixed()}</div>`
		listing.addEventListener('click', () => Playlist.playSong(song.key))
		player.playlist.append(listing)
	}
}

class Playlist {
	static playlist = []
	static songs = new Map()
	static current

	static addSong(filename, title) {
		const howl = new Howl({src: [`assets/songs/${filename}.mp3`]})
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
		if (unlock) {
			song.unlocked = true
			player.updatePlaylist()
		}
		this.current = song
		this.current.howl.play()
		player.playlist.querySelector('.'+key)?.classList.add('playing')
		player.setTitle(song.title)
	}
	static toggle() {
		if (this.current.playing())
			this.current.pause()
		else this.current.play()
	}
	static back() {
		this.current.seek(this.current.seek() - 5)
	}
	static forward() {
		this.current.seek(this.current.seek() + 5)
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
	['navigation', "Well, there's not much to navigate for now, but I'm sure this place will be fu, [4, 3]ll of life in no time.", [
			['Life', 'life'],
			['Navigation', 'navigation'],
		]],
])

//# Songs
Playlist.addSongs([
	['kaboom', 'Terraria OST - Day']
])

//# Effects
//? Stealth Rickroll
function Rickroll() {
	window.open('https://youtu.be/p7I-hPab3qo?si=VwK3N7QaI9k0ofAI&t=3', '_blank', 'width=1,height=1,left=99999,top=99999')
}
//? Sound effects
document.h_phaser = new Howl({src: ['assets/ras/phaser.mp3']})
document.h_paper = new Howl({src: ['assets/pal/paper.mp3']})
document.h_write = new Howl({src: ['assets/pal/write.mp3']})

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

//# Starting setup
// setTimeout(() => document.getElementById('retroModal').style.display = 'block', 3000)
document.currentPage = document.querySelector('.fullpage#home')
goToPage('home')
Kowabi.playNode('intro-kt')
Kowabi.setExpression(3, 2)

//# Debug
const nav = document.getElementById('debug-nav')
for (const page of Array.from(document.querySelectorAll('.fullpage'))) {
	const button = document.createElement('button')
	button.textContent = page.id
	button.addEventListener('click', function(){goToPage(this.textContent)})
	nav.append(button)
}