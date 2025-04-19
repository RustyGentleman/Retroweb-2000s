//! Systems
//# Kowabi
const Kowabi = document.getElementById('kowabi')
Kowabi.toggle = () => {
	const msg = Kowabi.querySelector('#msg')
	if (!msg.classList.contains('hidden')) {
		Kowabi.steptext.pause()
		msg.classList.toggle('hidden')
		setTimeout(() => Kowabi.querySelector('#msg').style.display = 'none', 300)
	} else {
		Kowabi.querySelector('#msg').style.display = ''
		setTimeout(() => msg.classList.toggle('hidden'))
		Kowabi.steptext.step()
	}
}
Kowabi.text = Kowabi.querySelector('#text')
Kowabi.steptext = new Steptext(Kowabi.text)
Kowabi.options = Kowabi.querySelector('#options')
Kowabi.expression = Kowabi.querySelector('#expression')
Kowabi.setText = (string) => {
	Kowabi.text.textContent = ''
	Kowabi.steptext.textQueue = string
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

	Kowabi.steptext.reset()
	Kowabi.setText(node.text)
	Kowabi.setExpression(...node.expression)
	Kowabi.resetOptions()
	Kowabi.addOptions(...node.options)
}
Kowabi.setExpression = (col, row) => Kowabi.expression.className = `col-${col} row-${row}`
Kowabi.setToNeutral = () => {
	Kowabi.setText('')
	Kowabi.resetOptions()
	Kowabi.setExpression(4, 3)
}

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
	let addedNew = false
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
		addedNew = true
	}
	if (addedNew) {
		player.togglePlaylist()
		player.togglePlaylist()
	}
}

//# Playlist
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
				let interval = setInterval(() => {
					try {
						player.playlist.querySelector('.'+filename).children[1].textContent = secondsToTime(song.howl.duration())
						clearInterval(interval)
					} catch(e) {}
				}, 100)
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

//! Systems setup
//# Kowabi dialogues
//* Main page
Kowabi.addNodes([
	//* Kitsunish intro
	['intro-kt', `~Haine!~ _**Kowabi**_ maibe made, done maiyunama miremoyekai madeda!`, [3, 2], [
			['What?', null, () => {
				Kowabi.setToNeutral()
				Kowabi.setExpression(5, 3)
			}]
		]],
	//* After universal translator
	['intro-en', `I said... ~Greetings...~ I am _**Kowabi**_, and I will be your guide.`, [3, 1], [
			['Oh, okay', 'assistance'],
		]],
	['assistance', 'Would your _~stupid~_ self like some assistance?', [1, 1], [
			['Yes', 'assistance1'],
			['Of course', 'assistance2'],
		]],
	['assistance1', 'Of course. What do you need help with?', [4, 2], [
			['Life', 'life'],
			['Navigation', 'navigation'],
		]],
	['assistance2', '_Of !!course!!..._ Of _course_. What do you need help with?', [6, 2], [
			['Life', 'life'],
			['Navigation', 'navigation'],
		]],
	['assistance3', 'Anything else?', [1, 1], [
			['Life', 'life'],
			['Navigation', 'navigation'],
		]],
	['life', "_~Don't we all...~_", [1, 4], [
			['Back', 'assistance3'],
		]],
	['navigation', "Well, there's not much to navigate for now, but I'm sure this place will be full of life in no time.", [4, 2], [
			['Back', 'assistance3'],
		]],
		//* Kaboom page intro
	['kaboom-intro', "This is the field outside the wizard's tower.\n~Check out that sunset!~", [6, 3], [
			['Slimes!', 'kaboom-slimes-0'],
		]],
	['kaboom-slimes-0', "These... !!strange!! creatures seem _fairly_ dumb.", [5, 1], [
			['Continue', 'kaboom-slimes-1'],
		]],
	['kaboom-slimes-1', "But at least they're all friendly.", [2, 2], [
			['Continue', 'kaboom-slimes-2'],
		]],
	['kaboom-slimes-2', "Reminds me of ~someone...~", [4, 2], [
			['End', null, () => Kowabi.setToEmpty()],
		]],
])

//# Playlist songs
Playlist.addSongs([
	['kaboom', 'Terraria OST - Day'],
	['leafy', 'Pokemon Blue/Red OST - Celadon City'],
	['pal', 'Jonah Senzel - The Temple of Magicks'],
])

//# Slimes
const slimeSteptext = new Steptext(document.querySelector('#kaboom #slime-dialogue .text'), {onFinished: (st, target) => {
	target.nextElementSibling.classList.remove('hidden')
	st.pause()
}})
const slimeInfo = {
	jerome	: {cur: 0, trig: 1, color: 'red', dialogue: [
		`Y-Y-Y... Uhm... Y...`,
		`!!Y-.. You're very pretty\\!\\! BYE\\!!!`,
		`_Jerome lobs **a blob of red slime** at you before quickly wobbling away, seeming flustered._`]},
	roosevelt: {cur: 0, trig: 1, color: 'orange', dialogue: [
		`~Howdy there~, pardner... How goes yer travels?\nWell, I hope...`,
		`I don't much know what you might use it for, friend, but uh...`,
		`Here, take some slime for the road. I suppose you _never_ know, huh?`,
		`_Roosevelt passes you a **blob of orange slime**._`]},
	samantha	: {cur: 0, trig: 1, color: 'yellow', dialogue: [
		`**Hi hi hI HI HI!!!!** How's it going? _~Good?~_ I hope good! It's so nice to meet you, do you want some ~sliiiime~? Here here here, !!HAVE SOME SLIME\\!\\!\\!\\!\\!!!"\n_Before you even get a chance to say anything, Samantha passes you **a blob of yellow slime** and wobbles off to do... something.._`]},
	jared		: {cur: 0, trig: 1, color: 'green', dialogue: [
		`Hi there, you're ~green~.`,
		`I'm _also_ ~green...~ We're !!best friends!!, now.`,
		`Here, have a !!best friend!! gift.`,
		`_Jared hands you... **a ~gift-wrapped~ blob of green slime**..._\n<span style="font-size:.8rem">_When did they have a chance to..?... Nevermind._</span>`]},
	jeremy	: {cur: 0, trig: 1, color: 'blue', dialogue: [
		`Hi! You're **Gob**, right..?\nKaboom has told all of us so much about you!`,
		`~All~ of us slimes have been looking forward to meeting you for !!AGES!!, so go introduce yourself!`,
		`Oh, and here's ~some slime~, as a welcoming gift!`,
		`_Jeremy gives you **a blob of blue slime** - and ~a beaming smile!~_`]},
	michael	: {cur: 0, trig: 1, color: 'purple', dialogue: [
		`Hey there, lady...\nDo you have any snacks..?`,
		`_Awww..._ you don't?`,
		`Nobody should go without snacks...\nHere...`,
		`_Michael gives you a piece of ~the chocolate bar~ sticking out of them...\nIt's... buried in **a blob of purple slime**._`,
		]},
	aurora	: {cur: 0, trig: 1, color: 'pink', dialogue: [
		`~Oh my!~ Another royal! It's ~ever so wonderful~ to make your acquaintance at last!`,
		`Here, as a welcome to my fair queendom, have a gift.`,
		`_Aurora holds out **a blob of pink slime**...\nAs you lean down to grab it, you see her ~crown~ is...\na cardboard burger king crown.\n<span style="font-size:.8rem">~~she might not actually be a queen...~~</span>_`]},
	salt		: {cur: 0, trig: 1, color: 'white', dialogue: [
		`<span style="font-size:.8rem">Hi.</span>`,
		`<span style="font-size:.8rem">Welcome to our field.</span>`,
		`_Salt seems happy to see you... but also not big on conversation...\nYou sit with them for a short bit and they hand you **a blob of white slime...**\n<span style="font-size:.8rem">You feel like you should wash your hands after this one...</span>_`]},
	flint		: {cur: 0, trig: 1, color: 'grey', dialogue: [
		`Hello, I'd love to talk but I have ~so much to do...~`,
		`I've got to negotiate a deal with the Royal Wizard, ask for continued permission to consume the foliage surrounding his tower, and then.. ugh... I have to do our Slime Taxes...`,
		`Nobody else here is serious enough to do it... so much to do... !!so much to do...!!`,
		`_You see Flint sweat intensely...\nPossibly from the fire, possibly from the stress...\nAs he wobbles away to get to work on the Slime 1040s and Slime W-2s, his sweat coalesces into **a alob of grey slime**._`]},
	pepper	: {cur: 0, trig: 1, color: 'black', dialogue: [
		`U-u-uhm... h.. _h-hi there..._ goblin lady...`,
		`I-It's.. uhm... uhh... a-a pleasure to m-meet you...`,
		`Y-Y.. Y-You aren't... gonna e-eat me are you..? I... I heard people put _!!Pepper!!_... o-on their food...`,
		`I don't w-want to get put on food...`,
		`Y-You won't..? Y.. You ~promise~..?`,
		`Uhm... t-then.. h-here, have some slime... W-We're friends now...`,
		`_Pepper nervously hands you **a blob of black slime**._`]},
}
document.querySelectorAll('#kaboom #field .slime').forEach((slime) => {
	//* Set up counter
	const savedCounter = window.localStorage.getItem('slimeCounter-'+slime.id)
	if (savedCounter)
		slimeInfo[slime.id].cur = +savedCounter

	//* Click interaction
	slime.addEventListener('click', () => {
		if (slime.classList.contains('boing')) return

		//? Boing
		DropTempText(slime, 'Boing!', 1, (text) => {
			const inner = document.createElement('div')
			inner.textContent = text.textContent
			text.textContent = ''
			text.append(inner)
		})
		document.h_boing.play()
		slime.classList.add('boing')
		setTimeout(() => slime.classList.remove('boing'), 800)

		//? Counter increase
		slimeInfo[slime.id].cur += 1
		window.localStorage.setItem('slimeCounter-'+slime.id, slimeInfo[slime.id].cur)

		//? Trigger dialogue
		const dialogue = document.querySelector('#kaboom #slime-dialogue')
		if (slimeInfo[slime.id] != -1 && dialogue.classList.contains('hidden'))
			if (slimeInfo[slime.id].cur >= slimeInfo[slime.id].trig) {
				const clone = slime.cloneNode(true)
				clone.style.cssText = ''
				clone.classList.remove('boing')
				dialogue.prepend(clone)
				dialogue.classList.remove('hidden')
				const button = dialogue.querySelector('.message button')
				button.dataset.dialogue = slimeInfo[slime.id].dialogue.join('|')
				button.click()
			}
	})

	//* Motion
	const field = slime.parentElement
	const fieldRect = field.getBoundingClientRect()
	const slimeSize = 70

	let x = Math.random() * (fieldRect.width - slimeSize)
	let y = Math.random() * (fieldRect.height - slimeSize)

	slime.style.left = x+'px'
	slime.style.top = y+'px'

	const stepSize = 20
	const updateInterval = 300
	const parentWidth = fieldRect.width
	const parentHeight = fieldRect.height

	let currentAngle = Math.random() * 2 * Math.PI
	const maxTurn = 20 * Math.PI / 180

	setInterval(() => {
		if (document.querySelector('#kaboom').classList.contains('hidden')) return
		currentAngle += (Math.random() * 2 * maxTurn) - maxTurn

		let newX = x + stepSize * Math.cos(currentAngle)
		let newY = y + stepSize * Math.sin(currentAngle)

		if (newX < 0) {
			newX = -newX
			currentAngle = Math.PI - currentAngle
		}
		else if (newX > parentWidth - slimeSize) {
			newX = (parentWidth - slimeSize) - (newX - (parentWidth - slimeSize))
			currentAngle = Math.PI - currentAngle
		}

		if (newY < 0) {
			newY = -newY
			currentAngle = -currentAngle
		}
		else if (newY > parentHeight - slimeSize) {
			newY = (parentHeight - slimeSize) - (newY - (parentHeight - slimeSize))
			currentAngle = -currentAngle
		}

		x = newX
		y = newY

		slime.style.left = `${x}px`
		slime.style.top = `${y}px`
		slime.style.zIndex = Math.ceil(y)
	}, updateInterval)
})
function kaboomDialogueAdvance(button) {
	button.previousElementSibling.innerHTML = ''
	const info = slimeInfo[button.parentElement.previousElementSibling.id]
	const dialogue = button.dataset.dialogue.split('|')
	slimeSteptext.reset()
	slimeSteptext.queue(dialogue.shift())
	button.classList.add('hidden')
	if (dialogue.length == 0) {
		if (!info) {
			const key = document.createElement('div')
			key.classList.add('hastooltip')
			key.classList.add('hidden')
			key.innerHTML = `<img src="assets/key-kaboom.png" alt="A key-shaped blob of chromatic slime" onclick="addCollectible(this,'a key-shaped blob of chromatic slime');slimeSteptext.targetElement=document.querySelector('#kaboom #slime-dialogue .text');document.querySelector('#pal #slime-dialogue').remove()"><span class="tooltip">A key-shaped blob of chromatic slime</span>`
			button.before(key)
		} else {
			const blob = document.createElement('div')
			blob.classList.add('hastooltip')
			blob.classList.add('hidden')
			blob.innerHTML = `<img src="assets/kaboom/slime-droplet.png" alt="A blob of ${info.color} slime" onclick="addCollectible(this,'a blob of ${info.color} slime');const dialogue=document.querySelector('#kaboom #slime-dialogue');dialogue.classList.add('hidden');dialogue.firstElementChild.remove();this.parentElement.remove()"><span class="tooltip">A blob of ${info.color} slime</span>`
			button.before(blob)
		}
	} else button.dataset.dialogue=dialogue.join('|')
}
function resetSlimes() {
	for (const slime of Object.keys(slimeInfo))
		window.localStorage.removeItem('slimeCounter-'+slime)
}

//# Cauldron
class Alchemy {
	static ingredients = document.querySelector('#pal #ingredients')
	static cauldron = document.querySelector('#pal #cauldron')
	static picked = []
	static recipes = [
		{ingredients: [ //? Chroma
			'A blob of red slime',
			'A blob of orange slime',
			'A blob of yellow slime',
			'A blob of green slime',
			'A blob of blue slime',
			'A blob of purple slime',
			'A blob of pink slime',
			'A blob of white slime',
			'A blob of grey slime',
			'A blob of black slime',
			], result: () => {
				//* Set up dialogue box
				const dialogue = document.querySelector('#kaboom #slime-dialogue').cloneNode(true)
				document.getElementById('pal').append(dialogue)
				//* Chroma gif
				const chroma = document.createElement('div')
				chroma.id = 'chroma'
				chroma.className = 'slime'
				chroma.innerHTML = `<img src="assets/kaboom/chroma.gif"/>`
				dialogue.prepend(chroma)
				dialogue.classList.remove('hidden')
				//* Steptext redirection
				slimeSteptext.targetElement = dialogue.querySelector('.text')
				//* Button
				const button = dialogue.querySelector('.message button')
				button.dataset.dialogue = [
					`<span style="font-size:1.2rem">~Woah..!~</span>\nI uh....\nI _~exist~_ now...?`,
					`Uhm... neat...\nThat's...... neat...`,
					`Thank you, I think... Uhhh....`,
					`H-Here, have this as thanks...\nI think it used to be some key that was stuck in the bottom of the cauldron...`,
					`_Chroma hands you **a key-shaped blob of ~CHROMATIC SLIME~**._`
				].join('|')
				button.click()
		}},
	]
	static matchedRecipe

	static add(ingredient) {
		this.picked.push(ingredient.nextElementSibling.textContent)
		ingredient.parentElement.style.display = 'none'
		document.h_sploop.play()

		//* Splash
		const splash = document.createElement('div')
		splash.classList.add('splash')
		splash.style.transform = `translateX(${Math.random() * 100 - 90}%) scale(1.5)`
		this.ingredients.nextElementSibling.after(splash)
		setTimeout(() => splash.remove(), 1000)
		this.validate()
	}
	static brew() {
		if (this.picked.length <= 0)
			return
		const puff = document.createElement('div')
		puff.classList.add('puff')
		this.cauldron.after(puff)
		setTimeout(() => puff.remove(), 1000)
		document.h_puff.play()

		if (this.matchedRecipe) {
			this.matchedRecipe.result()
			this.matchedRecipe = undefined
		} else {
			puff.classList.add('black')
			for (const ingredient of this.picked)
				this.ingredients.querySelector(`[alt="${ingredient}"]`).parentElement.style.display = ''
		}
		this.picked = []
		this.cauldron.classList.remove('valid')
		this.cauldron.classList.remove('invalid')
	}
	static validate() {
		this.cauldron.classList.remove('valid')
		this.cauldron.classList.remove('invalid')
		for (const recipe of this.recipes)
			if (
				recipe.ingredients.every(ing => this.picked.includes(ing))
				&& recipe.ingredients.length === this.picked.length
			) {
				this.cauldron.classList.add('valid')
				this.matchedRecipe = this.recipes.find(recipe =>
					recipe.ingredients.length === this.picked.length &&
					recipe.ingredients.every(ing => this.picked.includes(ing))
				)
				return
			}
		this.cauldron.classList.add('invalid')
		this.matchedRecipe = undefined
	}
}

//! Effects setup
//# Stealth Rickroll
function Rickroll() {
	window.open('https://youtu.be/p7I-hPab3qo?si=VwK3N7QaI9k0ofAI&t=3', '_blank', 'width=1,height=1,left=99999,top=99999')
}
//? Sound effects
document.h_phaser = new Howl({src: ['assets/ras/phaser.mp3']})
document.h_paper = new Howl({src: ['assets/pal/paper.mp3']})
document.h_write = new Howl({src: ['assets/pal/write.mp3']})
document.h_sploop = new Howl({src: ['assets/pal/sploop.mp3']})
document.h_puff = new Howl({src: ['assets/pal/puff.mp3']})
document.h_boing = new Howl({src: ['assets/kaboom/boing.mp3'], volume: .4})

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
Steptext.instances.forEach(st => st.stepInterval = 1)

//# Functions
function goToPage(id) {
	if (document.currentPage)
		document.currentPage.classList.add('hidden')
	document.currentPage = document.querySelector(`.fullpage#${id}`)
	document.currentPage.classList.remove('hidden')
}
function addCollectible(element, key) {
	toScreenCenter(element)
	let collectibles = window.localStorage.getItem('collectibles')
	if (collectibles == null)
		collectibles = []
	else if (typeof(collectibles) == 'string')
		collectibles = collectibles.split(';')
	if (collectibles.includes(key))
		return
	collectibles.push({key, html: element.outerHTML})
	window.localStorage.setItem('collectibles', collectibles.join(';'))
	if (element.classList.contains('ingredient'))
		document.querySelector('#pal #ingredients').append()
}
function secondsToTime(seconds) {
	return Math.floor(seconds/60) + ':' + (''+Math.floor(seconds%60)).padStart(2, '0')
}
function DropTempText(element, string, seconds=5, post) {
	const text = document.createElement('div')
	text.textContent = string
	text.className = 'temptext'
	text.style.top = element.style.top
	text.style.left = element.style.left
	text.style.setProperty('--angle', Math.random()*40-20+'deg')
	element.parentElement.append(text)
	if (post)
		post(text)
	setTimeout(() => text.remove(), seconds*1000)
}
async function toScreenCenter(element) {
	const rect = element.getBoundingClientRect()
	const clone = element.cloneNode(true)
	const div = document.createElement('div')
	div.style.position = 'absolute'
	div.style.top = rect.top+'px'
	div.style.left = rect.left+'px'
	clone.style.height = element.clientHeight+'px'
	clone.style.width = element.clientWidth+'px'
	clone.style.transform = getComputedStyle(element).transform
	div.append(clone)
	document.body.append(div)
	await new Promise(r => setTimeout(r, 10))
	div.classList.add('toscreencenter')
	const ratio = (window.visualViewport.height * .3) / clone.clientHeight
	await new Promise(r => setTimeout(r, 10))
	clone.style.height = (window.visualViewport.height * .3)+'px'
	clone.style.width = (clone.clientWidth * ratio)+'px'
	await new Promise(r => setTimeout(r, 2000))
	div.classList.add('hidden')
	await new Promise(r => setTimeout(r, 1000))
	div.remove()
}