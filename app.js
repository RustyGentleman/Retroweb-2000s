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
let panelOpened = false
player.togglePanel = () => {
	player.panel.classList.toggle('hidden')
	if (!panelOpened) {
		document.querySelectorAll('marquee').forEach(e => e.start())
		panelOpened = true
	}
}
player.togglePlaylist = () => {
	player.playlist.parentElement.classList.toggle('open')
	if (player.playlist.parentElement.classList.contains('open'))
		player.playlist.parentElement.style.top = `calc(-.5rem - 1rem * ${Math.max(player.playlist.children.length,3)})`
	else
		player.playlist.parentElement.style.top = ''
}
player.updatePlaylist = () => {
	let saved = getSavedData('songsUnlocked').data
	if (saved.length <= 0) return
	for (const key of saved) {
		const song = Playlist.playlist.find(e => e.key === key)
		const existing = player.playlist.querySelector('.'+key)
		Playlist.unlockSong(key)
		if (existing) continue
		const listing = document.createElement('div')
		listing.setAttribute('data-key', key)
		listing.classList.add(key)
		listing.style.order = Playlist.playlist.indexOf(song)+1
		listing.innerHTML = `<div>${song.title}</div><div>?:??</div>`
		listing.addEventListener('click', () => Playlist.playSong(key))
		player.playlist.append(listing)
		if (song.title.length > 30)
			listing.firstChild.outerHTML = listing.firstChild.outerHTML.replaceAll('div>', 'marquee>')
		player.playlist.append(listing)
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
			this.unlockSong(key)
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
	static unlockSong(key) {
		const song = this.songs.get(key)
		song.unlocked = true
		getSavedData('songsUnlocked')
			.push(key)
			.save()
player.updatePlaylist()
	}
	static setVolume(volume) {
		this.playlist.forEach(e => e.howl.volume(volume))
	}
	static play() {
		if (!this.current) {
			const unlocked = this.playlist.filter(e => e.unlocked == true)
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
Kowabi.addNodes([
	//* Kitsunish intro
	['intro-kt', `~Haine!~ _**Kowabi**_ maibe made, done maiyunama miremoyekai madeda!`, [3, 2], [
			['What?', null, () => {
				Kowabi.setToNeutral()
				Kowabi.setExpression(5, 3)
			}],
			[`Sorry, I don't speak Japanese`, null, () => {
				Kowabi.setToNeutral()
				Kowabi.setExpression(2, 3)
			}],
		]],
	//* After universal translator
	['intro-en', `I said... ~Greetings...~ I am _**Kowabi**_, and I will be your guide.`, [3, 1], [
			['Oh, okay', 'assistance'],
		]],
	['assistance', 'Would your _~stupid~_ self like some assistance?', [1, 1], [
			['Yes', 'assistance1', () => getSavedData('Kowabi-flags').push('intro-done').save()],
			['Of course', 'assistance2', () => getSavedData('Kowabi-flags').push('intro-done').save()],
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
	['assistance0', 'Welcome back! Need any help?', [1, 1], [
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
			['End', null, () => {Kowabi.setToEmpty(); getSavedData('Kowabi-flags').push('kaboom-intro-done').save()}],
		]],
])

//# Playlist songs
Playlist.addSongs([
	['kaboom', 'Terraria OST - Day'],
	['leafy', 'Pokemon Blue/Red OST - Celadon City'],
	['pal', 'Jonah Senzel - The Temple of Magicks'],
	['gobdance', 'Sam Westphalen - The Goblin Dance'],
	['ent', 'Russell Watson - Where My Heart Will Take Me'],
])

//# Slimes
const slimeSteptext = new Steptext(document.querySelector('#kaboom #slime-dialogue .text'), {
	stepInterval: 40,
	soundStepInterval: 2,
	soundPlayFunction: () => document.h_slimespeak.play(),
	onFinished: (st, target) => {
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
		`_You see Flint sweat intensely...\nPossibly from the fire, possibly from the stress...\nAs he wobbles away to get to work on the Slime 1040s and Slime W-2s, his sweat coalesces into **a blob of grey slime**._`]},
	pepper	: {cur: 0, trig: 1, color: 'black', dialogue: [
		`U-u-uhm... h.. _h-hi there..._ goblin lady...`,
		`I-It's.. uhm... uhh... a-a pleasure to m-meet you...`,
		`Y-Y.. Y-You aren't... gonna e-eat me are you..? I... I heard people put _!!Pepper!!_... o-on their food...`,
		`I don't w-want to get put on food...`,
		`Y-You won't..? Y.. You ~promise~..?`,
		`Uhm... t-then.. h-here, have some slime... W-We're friends now...`,
		`_Pepper nervously hands you **a blob of black slime**._`]},
}
{
	const save = getSavedData('slimeCounter',{
		initial: {},
		pack: (data) => JSON.stringify(data),
		unpack: (data) => JSON.parse(data)
	})
	document.querySelectorAll('#kaboom #field .slime').forEach((slime) => {
		//* Set up counter
		if (save.data[slime.id])
			slimeInfo[slime.id].cur = save.data[slime.id]

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
			save.data[slime.id] = slimeInfo[slime.id].cur

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
		{ingredients: ['Heartgleam'], result: () => teaBrewed(cauldron)},
		{ingredients: ['Crimson Regalia'], result: () => teaBrewed(cauldron)},
		{ingredients: ['Moonlace'], result: () => teaBrewed(cauldron)},
		{ingredients: ["Sun's Favor"], result: () => teaBrewed(cauldron)},
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
			const spentIngredients = getSavedData('ingredients-spent')
			for (const ingredient of this.matchedRecipe.ingredients)
				spentIngredients.push(ingredient)
			spentIngredients.save()
			this.matchedRecipe = undefined
		} else {
			puff.classList.add('black')
			let hasNonSlime = false
			for (const ingredient of this.picked) {
				this.ingredients.querySelector(`[alt="${ingredient}"]`).parentElement.style.display = ''
				if (!ingredient.match('slime'))
					hasNonSlime = true
			}
			if (!hasNonSlime) {
				const splat = document.createElement('div')
				splat.className = 'splat'
				document.body.prepend(splat)
				setTimeout(() => document.h_splat.play(), 50)
				setTimeout(() => splat.remove(), 3000)
			}
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

//# Owl
document.querySelectorAll('#pal .owl').forEach(e => {
	e.addEventListener('click', () => {
		e.classList.add('flying')
		e.classList.add('flyaway')
		document.h_takeoff.play()
		setTimeout(() => owlLand(e), 2000)
	})
})
function owlLand(not) {
	console.log('Owl land')
	const owls = Array.from(document.querySelectorAll('#pal .owl')).filter(e => e !== not)
	const picked = owls[Math.floor(Math.random() * owls.length)]
	picked.classList.remove('flying')
	picked.classList.add('flyin')
	picked.classList.remove('flyaway')
	setTimeout(() => picked.classList.remove('flyin'), 1000)
}

//# Pokémon
let pokemonTimeoutID
{
	const numberOfTallGrasses = 30
	const tilesX = 10
	const tilesY = 5
	const tileSize = 10

	const coordSet = new Set()
	const lef = document.getElementById('lef')
	while (coordSet.size < numberOfTallGrasses) {
		const x = Math.floor(Math.random() * tilesX)
		const y = Math.floor(Math.random() * tilesY)
		coordSet.add(`${x},${y}`)
	}
	Array.from(coordSet).map(str => {
		const [x, y] = str.split(',')
		return {x: +x, y: +y}
	}).forEach(e => {
		const grass = document.createElement('div')
		grass.className = 'tall-grass'
		grass.style.zIndex = e.y+5
		grass.style.transform = `translate(${(e.x-5)*tileSize+(e.y*(e.x-5))}vmin, ${(e.y)*tileSize}vmin) translateZ(${e.y}rem) scale(${1 + e.y*.08})`
		const img = document.createElement('img')
		img.src = 'assets/lef/tallgrass.png'
		grass.append(img)
		lef.append(grass)
	})
const tallgrasses = document.getElementById('lef').querySelectorAll('.tall-grass')
const catchChance = .3
	const pokemons = [
		'ampharos',
		'furret',
		'glameow',
		'leafeon',
		'skitty',
		'tailmon',
	]
function spawnPokemon() {
	const grass = tallgrasses[Math.floor(Math.random()*tallgrasses.length)]
	const pokemon = document.createElement('div')
const caught = getSavedData('Pokemon-caught')
		const notCaught = pokemons.filter(e => !caught.find(e))
		const picked = notCaught[Math.floor(Math.random()*notCaught.length)]
	pokemon.className = `pokemon ${picked}`
		pokemon.addEventListener('click', () => attemptToCatch(pokemon), {once: true})
		pokemon.dataset.name = picked
		grass.append(pokemon)
	setTimeout(() => pokemon.classList.add('popup'), 10)
	setTimeout(() => {
		pokemon.classList.remove('popup')
		setTimeout(() => pokemon.remove(), 600)
	}, 3000)
	pokemonTimeoutID = setTimeout(spawnPokemon, Math.random() * 4000 + 1000)
}
	async function attemptToCatch(element) {
		const throwball = document.getElementById('throwball')
		const rect = element.getBoundingClientRect()
		throwball.classList.add('thrown')
		await new Promise(r => setTimeout(r, 1))
		throwball.style.top = rect.top+'px'
		throwball.style.left = (rect.left + rect.width/2)+'px'
		await new Promise(r => setTimeout(r, 500))
		throwball.style.top = ''
		throwball.style.left = ''
		throwball.classList.remove('thrown')
		element.remove()
		const ui = document.getElementById('catch-attempt')
		const ball = ui.querySelector('.pokeball')
		ui.removeAttribute('onclick')
		ui.classList.remove('hidden')
		ball.classList.add('closed')
		await new Promise(r => setTimeout(r, 300))
		ball.classList.remove('closed')
		if (Math.random() < catchChance) { //? Success
			ball.classList.add('wiggle')
			for (let i=0; i<3; i++) {
				document.h_wiggle.play()
				await new Promise(r => setTimeout(r, 1000))
			}
			ball.classList.remove('wiggle')
			document.h_caught.play()
			console.log(`Click! Caught a ${element.dataset.name}`)
			ui.setAttribute('onclick', "this.classList.add('hidden')")
		} else { //? Fail
			const wiggles = Math.floor(Math.random() * 3)
			ball.classList.add('wiggle')
			for (let i=0; i<wiggles; i++) {
				document.h_wiggle.play()
				await new Promise(r => setTimeout(r, 1000))
			}
			ball.classList.remove('wiggle')
			ball.classList.add('open')
			await new Promise(r => setTimeout(r, 750))
			ball.classList.remove('open')
			ui.classList.add('hidden')
		}
	}
}

//# Ras quest
const rasSteptext = new Steptext(document.querySelector('#ras-dialogue .text'), {
	stepInterval: 40,
	soundStepInterval: 2,
	soundPlayFunction: () => document.h_slimespeak.play,
		onFinished: (st, target) => {
			target.nextElementSibling.classList.remove('hidden')
			st.pause()
}})
const herbs = document.getElementById('ras2').querySelectorAll('.herb')
{
	const page = document.getElementById('ras2')
	const ras = page.querySelector('.ras')
	const dialogue = document.getElementById('ras-dialogue')
	const button = dialogue.querySelector('.message button')
	const nodes = {
		intro: {
			lines: [
				{expression: 'laugh-open', text: `~Ahh, my liege!~ I've been expecting you.`},
				{expression: 'smile-open', text: `How have your travels been so far, ~mm?~ We've thrown you into _quite_ a fetch quest, have we not?`},
				{expression: 'smile-closed', text: `You may consider your stay at my abode a brief respite, if you wish.`},
				{expression: 'think', text: `~Although...~`},
				{expression: 'smirk', text: `T'would be a shame to pass up the opportunity to make you do some ~chores~ for me, would it not?`},
				{expression: 'laugh-closed', text: `That was an amusing face...`},
				{expression: 'smile-halfopen', text: `But if you wouldn't mind _indulging_ me with your ~royal hands...~`},
				{expression: 'smile-closed', text: `Would you pick something from my garden and brew me some tea?`},
			], endtrigger: () => {
				getSavedData('Ras-flags').push('intro').save()
				document.querySelector("#ras2 .ras").setAttribute("onclick", "")
				herbs.forEach(e => e.classList.remove('locked'))
			}
		}, tea1: {
			lines: [
				{expression: 'disgusted', text: `##Oh dear##... I'll need something else to recover from the taste of _that_... Maybe pick something else?`}
			], endtrigger: () => {
				getSavedData('Ras-flags').push('tea1').save()
				document.querySelector("#ras2 .ras").setAttribute("onclick", "")
				const herbsPicked = getSavedData('herbs-picked')
				herbs.forEach(e => {
					if (!herbsPicked.find(e.querySelector('img').alt))
						e.classList.remove('locked')
				})
			}
		}, tea2: {
			lines: [
				{expression: 'disgusted', text: `..I'm _starting_ to feel as though this might've been a mistake. Could you ##please## try to pick something nicer?`}
			], endtrigger: () => {
				getSavedData('Ras-flags').push('tea2').save()
				document.querySelector("#ras2 .ras").setAttribute("onclick", "")
				const herbsPicked = getSavedData('herbs-picked')
				herbs.forEach(e => {
					if (!herbsPicked.find(e.querySelector('img').alt))
						e.classList.remove('locked')
				})
			}
		}, tea3: {
			lines: [
				{expression: 'disgusted', text: `You've _somehow_ brewed something that tastes like ##harpy##. I'm **not** certain this is a good idea anymore, but, please, pick ~something else~, mm?\nAnd don't ask...`}
			], endtrigger: () => {
				getSavedData('Ras-flags').push('tea3').save()
				document.querySelector("#ras2 .ras").setAttribute("onclick", "")
				const herbsPicked = getSavedData('herbs-picked')
				herbs.forEach(e => {
					if (!herbsPicked.find(e.querySelector('img').alt))
						e.classList.remove('locked')
				})
			}
		}, goodtea: {
			lines: [
				{expression: 'laugh-open', text: `~Ahh...~ That's much better.`},
				{expression: 'smile-open', text: `Thank you, sweetheart. I hope it wasn't _too_ much trouble...`},
				{expression: 'laugh-closed', text: `For your troubles, I've hidden ~a present~ for you in the garden!`},
				{expression: 'smirk', text: `You must only _lift_ that rock...`},
				{expression: 'smile-closed', text: `**~Remember:~** Lift with your _legs_, not your _back!_`},
			], endtrigger: () => {
				getSavedData('Ras-flags').push('goodtea').save()
			}
		}
	}
	page.addEventListener('wheel', function(e) {
		e.preventDefault()
		page.scrollLeft += e.deltaY
	})
	ras.setAttribute('onclick', "rasDialogue('intro')")
	page.querySelector('.moon').addEventListener('click', faith)
	function rasDialogue(name) {
		const lines = []
		const expressions = []
		const node = nodes[name]
		for (const line of node.lines) {
			lines.push(line.text)
			expressions.push(line.expression)
		}
		button.dataset.dialogue = lines.join('|')
		button.dataset.portrait = expressions.join('|')
		button.dataset.endtrigger = '('+(node.endtrigger).toString()+')()'
		dialogue.classList.remove('hidden')
		button.click()
	}
	function pickHerb(herb) {
		getSavedData('herbs-picked').push(herb.alt).save()
		addCollectible(herb, herb.alt)
		herbs.forEach(e => e.classList.add('locked'))
	}
	function teaBrewed() {
		const cauldron = document.getElementById('pal').querySelector('#cauldron-clickbox')
		const wrapper = document.createElement('div')
		const tea = document.createElement('img')
		tea.src = 'assets/ras2/tea.png'
		tea.style.height = '100%'
		wrapper.style.height = '20%'
		wrapper.style.position = 'absolute'
		wrapper.style.left = '50%'
		wrapper.style.top = '30%'
		wrapper.style.transform = 'translateX(-50%)'
		wrapper.append(tea)
		cauldron.append(wrapper)
		setTimeout(() => {
			toScreenCenter(tea)
			wrapper.remove()
		}, 10)
		const herbsPicked = getSavedData('herbs-picked').data
		if (herbsPicked.length >= 3)
			ras.setAttribute('onclick', "rasDialogue('goodtea')")
		else
			ras.setAttribute('onclick', `rasDialogue('tea${herbsPicked.length}')`)
	}
	async function faith() {
		const nx01 = document.createElement('img')
		nx01.src = 'assets/ras2/nx01.png'
		nx01.className = 'nx01'
		document.h_faith.play()
		await new Promise(r => setTimeout(r, 2500))
		page.append(nx01)
		Playlist.unlockSong('ent')
		await new Promise(r => setTimeout(r, 5000))
		nx01.remove()
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
document.h_boing = new Howl({src: ['assets/kaboom/boing.mp3'], volume: .4})
document.h_sploop = new Howl({src: ['assets/pal/sploop.mp3']})
document.h_puff = new Howl({src: ['assets/pal/puff.mp3']})
document.h_splat = new Howl({src: ['assets/pal/splat.mp3']})
document.h_gobdance = new Howl({src: ['assets/songs/gobdance.mp3'], volume: 0, loop: true})
document.h_slimespeak = new Howl({src: ['assets/kaboom/slimespeak.mp3'], volume: .1, loop: false})
document.h_takeoff = new Howl({src: ['assets/pal/takeoff.mp3']})
document.h_amethyst = [
	new Howl({src: ['assets/ras2/Amethyst_step1.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step2.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step3.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step4.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step5.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step6.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step7.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step8.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step9.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step10.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step11.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step12.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step13.ogg']}),
	new Howl({src: ['assets/ras2/Amethyst_step14.ogg']}),
]
document.h_faith = new Howl({src: ['assets/ras2/faith.mp3']})
document.h_wiggle = new Howl({src: ['assets/lef/wiggle.mp3']})
document.h_caught = new Howl({src: ['assets/lef/caught.mp3']})
//? Goblin dance
const home = document.getElementById('home')
const bottom = window.visualViewport.height * 7
document.getElementById('home').addEventListener('scroll', () => {
	if (home.scrollTop / bottom < .25) {
		document.h_gobdance.pause()
		return
	} else {
		if (!document.h_gobdance.playing())
			document.h_gobdance.play()
		document.h_gobdance.volume(logVolume((home.scrollTop - bottom * .25) / (bottom * .75)))
		if (document.h_gobdance.volume() > .8) {
			Playlist.unlockSong('gobdance')
			player.updatePlaylist()
		}
	}
})

//# Starting setup
//? Trigger first visitor popup
// setTimeout(() => document.getElementById('retroModal').style.display = 'block', 3000)
//? Start on home page
goToPage('lef', true)
//? Trigger Kowabi's intro
if (getSavedData('Kowabi-flags').find('intro-done'))
	Kowabi.playNode('assistance0')
else
	Kowabi.playNode('intro-kt')
Kowabi.setExpression(3, 2)
//? First playlist update
setTimeout(() => player.updatePlaylist(), 1000)
//? Retrieve saved ingredients
{
	const spentIngredients = getSavedData('ingredients-spent')
	getSavedData('collectibles', {
		pack: (data) => JSON.stringify(data),
		unpack: (data) => JSON.parse(data)
	}).data
		.filter(e => !!e.html.match(/class="[^"]*?ingredient[^"]*?"/) && !spentIngredients.find(e.key))
		.forEach(e => {
			const surrogate = document.createElement('div')
			surrogate.innerHTML = e.html
			surrogate.firstElementChild.firstElementChild.setAttribute('onclick', 'Alchemy.add(this)')
			ingredients.append(surrogate.firstElementChild)
		})
}

//# Debug
const nav = document.getElementById('debug-nav')
setTimeout(() => {
	for (const page of Array.from(document.querySelectorAll('.fullpage'))) {
		const button = document.createElement('button')
		button.textContent = page.id
		button.addEventListener('click', function(){goToPage(this.textContent)})
		nav.append(button)
	}
}, 500)
// Steptext.instances.forEach(st => st.stepInterval = 1)

//# Functions
function goToPage(id, skipAnimation=false) {
	const animationLength = 2
	let previous
	if (!document.currentPage)
		document.currentPage = document.querySelector(`.fullpage#${id}`)
	else
		previous = document.currentPage
	document.currentPage = document.querySelector(`.fullpage#${id}`)
	document.currentPage.classList.remove('hidden')
	if (skipAnimation) {
		previous?.classList.add('hidden')
	} else {
		document.currentPage.classList.add('turning')
		setTimeout(() => {
			document.currentPage.classList.remove('turning')
			previous?.classList.add('hidden')
	}, 1000 * animationLength + 100)
	}
	//? State management
	if (previous?.id === 'home' && document.h_gobdance.playing())
		document.h_gobdance.pause()
	if (document.currentPage.id === 'home')
		document.currentPage.dispatchEvent(new Event('scroll'))
	if (document.currentPage.id === 'lef')
		pokemonTimeoutID = setTimeout(spawnPokemon, Math.random() * 4000 + 1000)
	else
		clearTimeout(pokemonTimeoutID)
	//? Nav triggers
	if (document.currentPage.id === 'kaboom') {
		Playlist.playSong('kaboom', true)
		if (!getSavedData('Kowabi-flags').find('kaboom-intro-done'))
			Kowabi.playNode('intro-kaboom')
	}
	if (document.currentPage.id === 'pal')
		Playlist.playSong('pal', true)
	if (document.currentPage.id === 'lef')
		Playlist.playSong('leafy', true)
}
function addCollectible(element, key) {
	toScreenCenter(element)
	const collectibles = getSavedData('collectibles', {
		pack: (data) => JSON.stringify(data),
		unpack: (data) => JSON.parse(data)
	})
	if (!collectibles.data.find(e => e.key == key))
		collectibles
			.push({key: key, html: element.parentElement.outerHTML})
			.save()
	if (element.classList.contains('ingredient')) {
		const clone = element.parentElement.cloneNode(true)
		clone.firstElementChild.setAttribute('onclick', 'Alchemy.add(this)')
		document.querySelector('#pal #ingredients').append(clone)
	}
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
function dialogueAdvance(button, type='slime') {
	button.previousElementSibling.innerHTML = ''
	let info
	let steptext
	if (type == 'slime') {
		info = slimeInfo[button.parentElement.previousElementSibling.id]
		steptext = slimeSteptext
	} else if (type == 'ras')
		steptext = rasSteptext
	const dialogue = button.dataset.dialogue?.split('|')
	steptext.reset()
	steptext.queue(dialogue.shift())
	button.classList.add('hidden')
	if (dialogue?.length == 0) {
		if (type == 'slime')
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
				blob.innerHTML = `<img src="assets/kaboom/slime-droplet.png" class="ingredient" alt="A blob of ${info.color} slime" onclick="addCollectible(this,'a blob of ${info.color} slime');const dialogue=document.querySelector('#kaboom #slime-dialogue');dialogue.classList.add('hidden');dialogue.firstElementChild.remove();this.parentElement.remove()"><span class="tooltip">A blob of ${info.color} slime</span>`
				button.before(blob)
			}
		if (type == 'ras') {
			button.parentElement.previousElementSibling.className = 'portrait '+button.dataset.portrait
			button.dataset.portrait = ''
			if (!button.dataset.closing)
				button.addEventListener('click', () => {
					button.parentElement.parentElement.classList.add('hidden')
					button.dataset.closing = ''
					const triggerer = document.createElement('button')
					triggerer.setAttribute('onclick', button.dataset.endtrigger)
					triggerer.click()
				}, {once: true})
				button.dataset.closing = 1
		}
	} else {
		button.dataset.dialogue=dialogue.join('|')
		if (type == 'ras') {
			const portraits = button.dataset.portrait.split('|')
			button.parentElement.previousElementSibling.className = 'portrait '+portraits.shift()
			if (portraits.length > 0)
				button.dataset.portrait = portraits.join('|')
			else
				button.dataset.portrait = ''
		}
	}
}
function resetUnlockedSongs() {
	window.localStorage.removeItem('songsUnlocked')
}
function resetSlimes() {
	window.localStorage.removeItem('slimeCounter')
}
function resetCollectibles() {
	window.localStorage.removeItem('collectibles')
}
function resetAlchemy() {
	window.localStorage.removeItem('ingredients-spent')
}
function resetDialogues() {
	window.localStorage.removeItem('Kowabi-flags')
	window.localStorage.removeItem('Ras-flags')
	window.localStorage.removeItem('herbs-picked')
}
function logVolume(x) {
	x = Math.min(Math.max(x, 0), 1)
	return x* x * x * x
}
function getSavedData(key, options={initial:[], unpack:(data)=>data.split(';'), pack:(data)=>data.join(';')}) {
	let data = window.localStorage.getItem(key)
	if (data == null)
		data = options.initial || []
	else
		data = options.unpack? options.unpack(data) : data.split(';')
	return {
		key,
		data,
		pack: options.pack || ((data) => data.join(';')),
		unpack: options.unpack || ((data) => data.split(';')),
		push: function(element){if (!this.find(element)) this.data.push(element); return this},
		find: function(element){return this.data.find(e => e === element)},
		save: function(){window.localStorage.setItem(this.key, (this.pack(this.data)));return this},
		clear: function(){window.localStorage.removeItem(this.key); return this},
	}
}