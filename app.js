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
		Kowabi.steptext.stepTimeoutID = undefined
		Kowabi.steptext.step()
	}
}
Kowabi.text = Kowabi.querySelector('#text')
Kowabi.steptext = new Steptext(Kowabi.text, {stepInterval: 40})
Kowabi.options = Kowabi.querySelector('#options')
Kowabi.expression = Kowabi.querySelector('#expression')
Kowabi.current
Kowabi.setText = (string) => {
	Kowabi.text.textContent = ''
	Kowabi.steptext.textQueue = string

	Kowabi.querySelector('#msg').style.display = ''
	setTimeout(() => msg.classList.remove('hidden'))
	if (Kowabi.steptext.stepTimeoutID === null) {
		Kowabi.steptext.stepTimeoutID = undefined
	}
	if (!Kowabi.steptext.stepTimeoutID)
		Kowabi.steptext.step()
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
Kowabi.playNode = (key, passive=false) => {
	const node = Kowabi.dialogueNodes[key]
	if (!node) return console.warn(`Dialogue node "${key}" not found.`)

	if (passive)
		if (!(Kowabi.classList.contains('passive-ok') || Kowabi.text.textContent.length == 0))
			return false

	Kowabi.steptext.reset()
	Kowabi.setText(node.text)
	Kowabi.setExpression(...node.expression)
	Kowabi.resetOptions()
	Kowabi.addOptions(...node.options)
	if (!passive)
		Kowabi.current = key
	return true
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
player.updatePlaylist = (skipUnlock=false) => {
	let saved = getSavedData('songsUnlocked').data
	if (saved.length <= 0) return
	for (const key of saved) {
		const song = Playlist.playlist.find(e => e.key === key)
		const existing = player.playlist.querySelector('.'+key)
		if (!skipUnlock)
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
	static volume
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
	static async playSong(key, unlock=false) {
		const song = this.songs.get(key)
		if (!song)
			return console.warn(`Song with key "${key}" not found.`)
		if (this.current) {
			this.fadeVolume(0, 1000)
			console.log('Prepause')
			player.playlist.querySelector('.'+this.current.key).classList.remove('playing')
			await new Promise(r => setTimeout(r, 1000))
			console.log('Postpause')
			this.current.howl.stop()
		}
		if (unlock)
			this.unlockSong(key)
		this.current = song
		this.current.howl.volume(0)
		this.current.howl.play()
		this.fadeVolume(this.volume)
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
		player.updatePlaylist(true)
	}
	static setVolume(volume) {
		this.playlist.forEach(e => e.howl.volume(volume))
		window.localStorage.setItem('player-volume', volume)
		player.querySelector('#volume').value = volume
		this.volume = volume
	}
	static fadeVolume(to, duration=500) {
		if (!this.current) return
		this.current.howl.fade(this.current.howl.volume(), to, duration)
	}
	static play() {
		if (!this.current) {
			const unlocked = this.playlist.filter(e => e.unlocked == true)
			if (unlocked.length === 0) return
			this.playSong(unlocked[0].key)
			return
		}
		if (this.current.howl.playing()) {
			this.fadeVolume(0, 1000)
			setTimeout(() => {
				this.current.howl.pause()
				player.toggleIcon(false)
			}, 1000)
		} else {
			this.current.howl.volume(0)
			this.current.howl.play()
			this.fadeVolume(this.volume, 1000)
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
			['Life', 'life', () => Kowabi.classList.add('passive-ok')],
			['Navigation', 'navigation', () => Kowabi.classList.add('passive-ok')],
		]],
	['assistance2', '_Of !!course!!..._ Of _course_. What do you need help with?', [6, 2], [
			['Life', 'life', () => Kowabi.classList.add('passive-ok')],
			['Navigation', 'navigation', () => Kowabi.classList.add('passive-ok')],
		]],
	['assistance3', 'Anything else?', [1, 1], [
			['Life', 'life', () => Kowabi.classList.add('passive-ok')],
			['Navigation', 'navigation', () => Kowabi.classList.add('passive-ok')],
		]],
	['assistance0', 'Welcome back! Need any help?', [1, 1], [
			['Life', 'life', () => Kowabi.classList.add('passive-ok')],
			['Navigation', 'navigation', () => Kowabi.classList.add('passive-ok')],
		]],
	['life', "_~Don't we all...~_", [1, 4], [
			['Back', 'assistance3', () => Kowabi.classList.add('passive-ok')],
		]],
	['navigation', "Well, see ~those books~ on the left shelf? You should take a peek at those.", [4, 3], [
			['Back', 'assistance3', () => Kowabi.classList.add('passive-ok')],
		]],
	//* Kaboom's page
	['kaboom-intro', "This is the field outside the wizard's tower.\n~Check out that sunset!~", [6, 4], [
			['Slimes!', 'kaboom-slimes-0'],
		]],
	['kaboom-slimes-0', "These... !!strange!! creatures seem _fairly_ dumb.", [5, 1], [
			['Continue', 'kaboom-slimes-1'],
		]],
	['kaboom-slimes-1', "But at least they're all friendly.", [2, 2], [
			['Continue', 'kaboom-slimes-2'],
		]],
	['kaboom-slimes-2', "Reminds me of ~someone...~", [4, 2], [
			['End', '', () => {Kowabi.setToNeutral(); getSavedData('Kowabi-flags').push('kaboom-intro-done').save()}],
		]],
	//* Pal's page
	['pal-intro', "This is ~the wizard's tower~.", [4, 3], [
			['Continue', 'pal-intro-1'],
		]],
	['pal-intro-1', "Well... I think he _was_ a paladin at some point...", [3, 4], [
			['Continue', 'pal-intro-2'],
		]],
	['pal-intro-2', "Perhaps he's had a change of profession, I suppose.", [5, 1], [
			['Continue', 'pal-intro-3'],
		]],
	['pal-intro-3', "I've a feeling you'll spend ~a fair bit of time~ here...", [4, 1], [
			['Continue', 'pal0', () => {
				getSavedData('Kowabi-flags').push('pal-intro-done').save()
				Kowabi.classList.add('passive-ok')
			}],
		]],
	['pal0', "If you need any assistance, let me know!", [1, 1], [
			['Owl', 'owl-1', () => Kowabi.classList.remove('passive-ok')],
			['Cauldron', 'cauldron-1', () => Kowabi.classList.remove('passive-ok')],
		]],
	['owl-1', "Yeah, that's uhh... a !!weird!! owl...", [3, 4], [
			['Continue', 'owl-2'],
		]],
	['owl-2', "You should ~totally~ poke it.", [4, 1], [
			['Back', 'pal0', () => Kowabi.classList.add('passive-ok')],
		]],
	['cauldron-1', "I don't know _how_ that cauldron works, exactly...", [4, 3], [
			['Continue', 'cauldron-2'],
		]],
	['cauldron-2', "But I know there's **~a lot~ of things** you can do with it!", [1, 3], [
			['Continue', 'cauldron-3'],
		]],
	['cauldron-3', "...I also know that that _~potion base~_ is really just water.", [4, 2], [
			['Back', 'pal0', () => Kowabi.classList.add('passive-ok')],
		]],
	['drawer', "_~Oh my...~_", [1, 2], [
			['Back', '', () => Kowabi.playNode(Kowabi.current || 'pal0')],
		]],
	//* Leafy's page
	['lef-intro', "Ahh, look at that ~pixely goodness!~", [4, 3], [
			['Continue', 'lef-intro-1'],
		]],
	['lef-intro-1', "Oh! And those !!cute little critters\\!!!", [5, 4], [
			['Continue', 'lef-intro-2', () => {
				Kowabi.classList.add('passive-ok')
				getSavedData('Kowabi-flags').push('lef-intro-done').save()
			}],
		]],
	['lef-intro-2', "~Gotta pet them all!!~", [3, 3], [
			['Pokedex', 'pokedex', () => Kowabi.classList.remove('passive-ok')],
		]],
	['lef0', "~Gotta pet them all!!~", [2, 2], [
			['Pokedex', 'pokedex', () => Kowabi.classList.remove('passive-ok')],
		]],
	['pokedex', "It seems any ~critters~ you **catch** will be displayed over there.", [2, 2], [
			['Back', 'lef0', () => Kowabi.classList.add('passive-ok')],
		]],
	['coolsong', "!!Op-...!! _Hah!_ That's funny.", [4, 4], [
			['Back', '', () => Kowabi.playNode(Kowabi.current || 'lef0')],
		]],
	//* Ras' page
	['ras-intro', "Oh boy... That's a bit ~laggy~, isn't it?...", [3, 4], [
			['Continue', 'ras-intro-1'],
		]],
	['ras-intro-1', "I do apologize... My master can be... ~enthusiastic~ about aesthetics...", [5, 1], [
			['Continue', 'ras-intro-2', () => {
				Kowabi.classList.add('passive-ok')
				getSavedData('Kowabi-flags').push('ras-intro-done').save()
			}],
		]],
	['ras-intro-2', "Take a whiff of that ~fresh air~, though...", [3, 3], [
			['Moon', 'moon', () => Kowabi.classList.add('passive-ok')],
		]],
	['ras0', "~Ahh... Fresh air...~", [3, 3], [
			['Moon', 'moon', () => Kowabi.classList.add('passive-ok')],
		]],
	['moon', "...Does... that _moon_ look... !!weird!! to you?", [4, 3], [
			['Back', 'ras0', () => Kowabi.classList.add('passive-ok')],
		]],
	['nx01-1', "~...What is that-...~", [5, 3], []],
	['nx01-2', "!!...!!", [6, 3], []],
	['nx01-3', "!!...I'M GOIN' WHERE MY HEART WILL TAKE ME...!!", [3, 3], [
			['...', '', () => Kowabi.playNode('nx01-4', true)],
		]],
	['nx01-4', "...I'm.. sorry... I don't know what's come over me...", [2, 4], [
			['Back', '', () => Kowabi.playNode(Kowabi.current || 'ras0')],
		]],
	['louie', "He _really_ is quite ~twisty~...", [4, 3], [
			['Back', '', () => Kowabi.playNode(Kowabi.current || 'ras0')],
		]],
	//* Other
	['gobdance-1', "Is that... **music**?...", [5, 3], []],
	['gobdance-1.5', "!!Not again...!!", [6, 3], []],
	['gobdance-2', "", [6, 3], []],
	['gobdance-3', "!!...Okay...!! ~Anyway...", [5, 1], [
		['...Okay...', '', () => Kowabi.playNode(Kowabi.current || 'ras0')],
	]],
])
//# Playlist songs
Playlist.addSongs([
	['kaboom', 'Terraria OST - Day'],
	['leafy', 'Pokemon Diamond/Pearl/Platinum OST - Route 206 (Day)'],
	['pal', 'Jonah Senzel - The Temple of Magicks'],
	['gobdance', 'Sam Westphalen - The Goblin Dance'],
	['ent', 'Russell Watson - Where My Heart Will Take Me'],
	['ras', 'Yvette Young - Odessa (Acoustic Version)'],
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
	jerome	: {cur: 0, trig: 1, color: 'red', 		post: 'H-H-Hey...', dialogue: [
		`Y-Y-Y... Uhm... Y...`,
		`!!Y-.. You're very pretty\\!\\! BYE\\!!!`,
		`_Jerome lobs **a blob of red slime** at you before quickly wobbling away, seeming flustered._`]},
	roosevelt: {cur: 0, trig: 1, color: 'orange', 	post: 'Howdy', dialogue: [
		`~Howdy there~, pardner... How goes yer travels?\nWell I hope...`,
		`I don't much know what you might use it for, friend, but uh...`,
		`Here, take some slime for the road. I suppose you _never_ know, huh?`,
		`_Roosevelt passes you a **blob of orange slime**._`]},
	samantha	: {cur: 0, trig: 1, color: 'yellow', 	post: 'YIPPEE!', dialogue: [
		`**Hi hi hI HI HI!!!!** How's it going? _~Good?~_ I hope good! It's so nice to meet you, do you want some ~sliiiime~? Here here here, !!HAVE SOME SLIME\\!\\!\\!\\!\\!!!"\n_Before you even get a chance to say anything, Samantha passes you **a blob of yellow slime** and wobbles off to do... something.._`]},
	jared		: {cur: 0, trig: 1, color: 'green', 	post: 'Friend.', dialogue: [
		`Hi there, you're ~green~.`,
		`I'm _also_ ~green...~ We're !!best friends!!, now.`,
		`Here, have a !!best friend!! gift.`,
		`_Jared hands you... **a ~gift-wrapped~ blob of green slime**..._\n<span style="font-size:.8rem">_When did they have a chance to..?... Nevermind._</span>`]},
	jeremy	: {cur: 0, trig: 1, color: 'blue', 		post: 'Happy Birthday!', dialogue: [
		`Hi! You're **Gob**, right..?\nKaboom has told all of us so much about you!`,
		`~All~ of us slimes have been looking forward to meeting you for !!AGES!!, so go introduce yourself!`,
		`Oh, and here's ~some slime~, as a welcoming gift!`,
		`_Jeremy gives you **a blob of blue slime** - and ~a beaming smile!~_`]},
	michael	: {cur: 0, trig: 1, color: 'purple', 	post: '*Nom*', dialogue: [
		`Hey there, lady...\nDo you have any snacks..?`,
		`_Awww..._ you don't?`,
		`Nobody should go without snacks...\nHere...`,
		`_Michael gives you a piece of ~the chocolate bar~ sticking out of them...\nIt's... buried in **a blob of purple slime**._`,
		]},
	aurora	: {cur: 0, trig: 1, color: 'pink', 		post: 'Oh ho ho~', dialogue: [
		`~Oh my!~ Another royal! It's ~ever so wonderful~ to make your acquaintance at last!`,
		`Here, as a welcome to my fair queendom, have a gift.`,
		`_Aurora holds out **a blob of pink slime**...\nAs you lean down to grab it, you see her ~crown~ is...\na cardboard burger king crown.\n<span style="font-size:.8rem">~~she might not actually be a queen...~~</span>_`]},
	salt		: {cur: 0, trig: 1, color: 'white', 	post: ':]', dialogue: [
		`<span style="font-size:.8rem">Hi.</span>`,
		`<span style="font-size:.8rem">Welcome to our field.</span>`,
		`_Salt seems happy to see you... but also not big on conversation...\nYou sit with them for a short bit and they hand you **a blob of white slime...**\n<span style="font-size:.8rem">You feel like you should wash your hands after this one...</span>_`]},
	flint		: {cur: 0, trig: 1, color: 'grey', 		post: 'Much to do...', dialogue: [
		`Hello, I'd love to talk but I have ~so much to do...~`,
		`I've got to negotiate a deal with the Royal Wizard, ask for continued permission to consume the foliage surrounding his tower, and then.. ugh... I have to do our Slime Taxes...`,
		`Nobody else here is serious enough to do it... so much to do... !!so much to do...!!`,
		`_You see Flint sweat intensely...\nPossibly from the fire, possibly from the stress...\nAs he wobbles away to get to work on the Slime 1040s and Slime W-2s, his sweat coalesces into **a blob of grey slime**._`]},
	pepper	: {cur: 0, trig: 1, color: 'black', 	post: 'B-bye now...', dialogue: [
		`U-u-uhm... h.. _h-hi there..._ goblin lady...`,
		`I-It's.. uhm... uhh... a-a pleasure to m-meet you...`,
		`Y-Y.. Y-You aren't... gonna e-eat me are you..? I... I heard people put _!!Pepper!!_... o-on their food...`,
		`I don't w-want to get put on food...`,
		`Y-You won't..? Y.. You ~promise~..?`,
		`Uhm... t-then.. h-here, have some slime... W-We're friends now...`,
		`_Pepper nervously hands you **a blob of black slime**._`]},
}
{
	document.querySelectorAll('#kaboom #field .slime').forEach((slime) => {
		//* Click interaction
		slime.addEventListener('click', () => {
			if (slime.classList.contains('boing')) return

			//? Boing
			DropTempText(slime, 'Boing!', 1, (text) => {
				const inner = document.createElement('div')
				inner.textContent = text.textContent
				inner.classList.add('boing')
				text.textContent = ''
				text.append(inner)
			})
			document.h_boing.play()
			slime.classList.add('boing')
			setTimeout(() => slime.classList.remove('boing'), 800)

			//? Counter increase
			if (slime.id != 'chroma') {
				const counters = getSavedData('slimeCounter',{
					initial: {},
					pack: (data) => JSON.stringify(data),
					unpack: (data) => JSON.parse(data)
				})
				if (!counters.data[slime.id])
					counters.data[slime.id] = 1
				else ++counters.data[slime.id]
				slimeInfo[slime.id].cur = counters.data[slime.id]
				counters.save()
			}

			const alreadyGotten = getSavedData('collectibles', {
				pack: (data) => JSON.stringify(data),
				unpack: (data) => JSON.parse(data)
			}).data.find(e => e.key.includes(slimeInfo[slime.id]?.color+' slime'))
			const dialogue = document.querySelector('#kaboom #slime-dialogue')

			//? Trigger post-dialogue line
			if (alreadyGotten || slime.id == 'chroma') {
				DropTempText(slime, '', 5, (text) => {
					const inner = document.createElement('div')
					inner.innerHTML = slimeInfo[slime.id]?.post || '<span class="chromatic-text">Rainbow!</span>'
					text.textContent = ''
					text.append(inner)
				})
			}
			//? Trigger dialogue
			else if (slimeInfo[slime.id] != -1 && dialogue.classList.contains('hidden'))
				if (slimeInfo[slime.id].cur >= slimeInfo[slime.id].trig) {
					if (slime.id == 'salt')
						document.h_slimespeak.volume(.4)
					else
						document.h_slimespeak.volume(1)
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
//# Alchemy
class Alchemy {
	static shelfLeft = document.getElementById('pal').querySelector('.shelf .container')
	static shelfRight = document.getElementById('pal').querySelector('.shelf:nth-child(2) .container')
	static room = document.querySelector('#pal .room:nth-child(2)')
	static cauldron = document.querySelector('#pal #cauldron')
	static picked = []
	static recipes = [
		{name: 'Chroma', ingredients: [
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
		{name: 'Heartgleam Tea', ingredients: [
			'Potion base',
			'Heartgleam'
			], result: () => teaBrewed("Heartgleam Tea")},
		{name: 'Crimson Regalia Tea', ingredients: [
			'Potion base',
			'Crimson Regalia'
			], result: () => teaBrewed("Crimson Regalia Tea")},
		{name: 'Moonlace Tea', ingredients: [
			'Potion base',
			'Moonlace'
			], result: () => teaBrewed("Moonlace Tea")},
		{name: "Sun's Favor Tea", ingredients: [
			'Potion base',
			"Sun's Favor"
			], result: () => teaBrewed("Sun's Favor Tea")},
		{name: 'Little Witch in the Woods', ingredients: [
			'Moonlace',
			'A blob of purple slime',
			'A magic-looking mushroom',
			], result: () => {
				const cauldron = document.getElementById('pal').querySelector('#cauldron-clickbox')
				const wrapper = document.createElement('div')
				const item = document.createElement('img')
				item.src = 'assets/pal/littlewitchinthewoods.png'
				item.style.height = '100%'
				wrapper.style.height = '20%'
				wrapper.style.position = 'absolute'
				wrapper.style.left = '50%'
				wrapper.style.top = '30%'
				wrapper.style.transform = 'translateX(-50%)'
				wrapper.append(item)
				cauldron.append(wrapper)
				setTimeout(() => {
					toScreenCenter(item, 'Found secret gift:', 'Little Bitch in the Woods!', 10000)
					wrapper.remove()
				}, 10)
			}},
		{name: 'Tavern Talk', ingredients: [
			'Potion base',
			'Heartgleam',
			'A magic-looking mushroom',
			], result: () => {
				const cauldron = document.getElementById('pal').querySelector('#cauldron-clickbox')
				const wrapper = document.createElement('div')
				const item = document.createElement('img')
				item.src = 'assets/pal/taverntalk.png'
				item.style.height = '100%'
				wrapper.style.height = '20%'
				wrapper.style.position = 'absolute'
				wrapper.style.left = '50%'
				wrapper.style.top = '30%'
				wrapper.style.transform = 'translateX(-50%)'
				wrapper.append(item)
				cauldron.append(wrapper)
				setTimeout(() => {
					toScreenCenter(item, 'Found secret gift:', 'Tavern Talk!', 10000)
					wrapper.remove()
				}, 10)
			}},
		{name: 'Coffee Talk', ingredients: [
			'Potion base',
			'A blob of yellow slime',
			"Sun's Favor",
			], result: () => {
				const cauldron = document.getElementById('pal').querySelector('#cauldron-clickbox')
				const wrapper = document.createElement('div')
				const item = document.createElement('img')
				item.src = 'assets/pal/coffeetalk.png'
				item.style.height = '100%'
				wrapper.style.height = '20%'
				wrapper.style.position = 'absolute'
				wrapper.style.left = '50%'
				wrapper.style.top = '30%'
				wrapper.style.transform = 'translateX(-50%)'
				wrapper.append(item)
				cauldron.append(wrapper)
				setTimeout(() => {
					toScreenCenter(item, 'Found secret gift:', 'Coffee Talk!', 10000)
					wrapper.remove()
				}, 10)
			}},
		{name: 'A Short Hike', ingredients: [
			'An owl feather',
			"Sun's Favor",
			'A blob of green slime',
			], result: () => {
				const cauldron = document.getElementById('pal').querySelector('#cauldron-clickbox')
				const wrapper = document.createElement('div')
				const item = document.createElement('img')
				item.src = 'assets/pal/ashorthike.png'
				item.style.height = '100%'
				wrapper.style.height = '20%'
				wrapper.style.position = 'absolute'
				wrapper.style.left = '50%'
				wrapper.style.top = '30%'
				wrapper.style.transform = 'translateX(-50%)'
				wrapper.append(item)
				cauldron.append(wrapper)
				setTimeout(() => {
					toScreenCenter(item, 'Found secret gift:', 'A Short Hike!', 10000)
					wrapper.remove()
				}, 10)
			}},
		{name: 'Inscryption', ingredients: [
			'An owl feather',
			'A blob of green slime',
			'A magic-looking mushroom',
			], result: () => {
				const cauldron = document.getElementById('pal').querySelector('#cauldron-clickbox')
				const wrapper = document.createElement('div')
				const item = document.createElement('img')
				item.src = 'assets/pal/inscryption.png'
				item.style.height = '100%'
				wrapper.style.height = '20%'
				wrapper.style.position = 'absolute'
				wrapper.style.left = '50%'
				wrapper.style.top = '30%'
				wrapper.style.transform = 'translateX(-50%)'
				wrapper.append(item)
				cauldron.append(wrapper)
				setTimeout(() => {
					toScreenCenter(item, 'Found secret gift:', 'Inscryption!', 10000)
					wrapper.remove()
				}, 10)
			}},
	]
	static matchedRecipe

	static add(ingredient) {
		this.picked.push(ingredient.nextElementSibling.textContent)
		ingredient.parentElement.classList.add('hidden')
		document.h_sploop.play()

		//* Splash
		const splash = document.createElement('div')
		splash.classList.add('splash')
		splash.style.transform = `translateX(${Math.random() * 100 - 90}%) scale(1.5)`
		this.cauldron.after(splash)
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

		if (this.matchedRecipe) { //? Valid recipe
			this.matchedRecipe.result()
			getSavedData('recipes-brewed').push(this.matchedRecipe.name).save()
			this.filterIngredients()
			this.matchedRecipe = undefined
		} else { //? Invalid recipe
			puff.classList.add('black')
			let hasNonSlime = false
			for (const ingredient of this.picked) {
				const ingredientElement = this.shelfLeft.querySelector(`[alt="${ingredient}"]`) || this.shelfRight.querySelector(`[alt="${ingredient}"]`)
				ingredientElement.parentElement.classList.remove('hidden')
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
		const recipesBrewed = getSavedData('recipes-brewed').data
		const unusedRecipes = Alchemy.recipes.filter(e => !recipesBrewed.includes(e.name))
		for (const recipe of unusedRecipes)
			if (
				recipe.ingredients.every(ing => this.picked.includes(ing))
				&& recipe.ingredients.length === this.picked.length
			) {
				this.cauldron.classList.add('valid')
				this.matchedRecipe = recipe
				return
			}
		this.cauldron.classList.add('invalid')
		this.matchedRecipe = undefined
	}
	static filterIngredients() {
		this.shelfLeft.querySelectorAll('.hastooltip').forEach(e => e.classList.add('hidden'))
		this.shelfRight.querySelectorAll('.hastooltip').forEach(e => e.classList.add('hidden'))
		const recipesBrewed = getSavedData('recipes-brewed').data
		const ingredientsLeft = new Set()
		Alchemy.recipes
			.filter(e => !recipesBrewed.includes(e.name))
			.forEach(unusedRecipe => unusedRecipe.ingredients.forEach(ingredient => ingredientsLeft.add(ingredient)))
		ingredientsLeft.forEach(e => {
			const ingredient = this.shelfLeft.querySelector(`[alt*="${e}"]`) || this.shelfRight.querySelector(`[alt*="${e}"]`)
			if (ingredient) ingredient.parentElement.classList.remove('hidden')
		})
	}
}
//# Owl
{
	const clues = [
		{answer: `**Moonlace** + **Blue Blob** + **Magic Mushroom**`,
			clue:`Under the **night**, through witches' flight\nadd goo so **sweet**, could make a treat\ntouch of **magic**, cure wounds tragic.`},
		{answer: `**Potion Base** + **Heartgleam** + **Magic Mushroom**`,
			clue:`Brew a **drink**, with which to dink\nherb which starts, lift patrons' **hearts**\ntouch of **shroom**, bring end all gloom.`},
		{answer: `**Potion Base** + **Yellow Blob** + **Sun's Favor**`,
			clue:`Another **drink**, which one serves,\none that could raise all one's nerves\nSlime to **energize**, makes you exercise\nHerb of the **morning**, new day aborning.`},
		{answer: `**Owl Feather** + **Sun's Favor** + **Green Slime**`,
			clue:`Chase **feather** in fine weather\nunder **sun**, through mountains, run\nAnd through **greens**, all pleasant scenes.`},
		{answer: `**Owl Feather** + **Green Blob** + **Mushroom**`,
			clue:`**Quill** in hand, cards inscribed,\ngame not quite as described.\nMeet a slime, **green** as lime;\ntwo head doctor, **mushroom** hocker.`},
	]
	let clueIndex = 0
	const dbox = document.getElementById('owl-dialogue')
	const okay = dbox.querySelector('span[onclick]')
	const what = dbox.querySelector('span[onclick]:last-of-type')
	const steptext = new Steptext(dbox.querySelector('.text'), {stepInterval: 32, onFinished: () => {
		okay.classList.remove('hidden')
		what.classList.remove('hidden')
	}})
	Steptext.encodings.set('\\+\\+', ['fadein', 2])
	Steptext.tagsWithWrappedChars.push('fadein')
	okay.addEventListener('click', () => {
		dbox.classList.add('hidden')
		okay.classList.add('hidden')
		what.classList.add('hidden')
		what.style.display = ''
		steptext.targetElement.innerHTML = ''
	})
	what.addEventListener('click', () => {
		okay.classList.add('hidden')
		what.style.display = 'none'
		steptext.queue('\n\n++' + clues[clueIndex].answer + '++')
	})
	let owlClicked = +(window.localStorage.getItem('owl-clicked') || 0)
	document.querySelectorAll('#pal .owl').forEach(owl => {
		owl.addEventListener('click', () => {
			owl.classList.add('flying')
			owl.classList.add('flyaway')
			document.h_takeoff.play()
			setTimeout(() => owlLand(owl), 2000)
			if (Math.random() > .5) {
				clueIndex = Math.floor(Math.random() * clues.length)
				steptext.queue('++' + clues[clueIndex].clue + '++')
				dbox.classList.remove('hidden')
			}
			owlClicked++
			window.localStorage.setItem('owl-clicked', owlClicked)
			if (owlClicked == 3) {
				const item = document.createElement('div')
				const img = document.createElement('img')
				const tooltip = document.createElement('span')
				item.className = 'hastooltip key'
				item.style.cssText = "position:absolute;top:50%;left:50%;height:5vh"
				img.src = 'assets/pal/owl-feather.png'
				img.alt = 'An owl feather'
				img.classList.add('ingredient')
				img.setAttribute('onclick', "addCollectible(this, 'an owl feather', `You snatched an`, `Owl Feather!`);this.parentElement.remove()")
				tooltip.className = 'tooltip'
				tooltip.textContent = 'An owl feather'
				item.append(img)
				item.append(tooltip)
				DropTempText(owl, '', 10, (e) => {
					e.innerHTML = ''
					e.append(item)
				})
				setTimeout(() => img.click())
			}
		})
	})
	function owlLand(not) {
		const owls = Array.from(document.querySelectorAll('#pal .owl')).filter(e => e !== not)
		const picked = owls[Math.floor(Math.random() * owls.length)]
		picked.classList.remove('flying')
		picked.classList.add('flyin')
		picked.classList.remove('flyaway')
		setTimeout(() => picked.classList.remove('flyin'), 1000)
	}
}
//# Pokémon
let pokemonTimeoutID
{
	const numberOfTallGrasses = 40
	const tilesX = 20
	const tilesY = 6
	const tileSize = 4.9

	const coordSet = new Set()
	const pokefield = document.getElementById('pokefield')
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
		grass.style.transform = `translate(${(e.x-10)*tileSize}vmin, ${(e.y-5)*tileSize}vmin)`
		const img = document.createElement('img')
		img.src = 'assets/lef/tallgrass.png'
		grass.append(img)
		pokefield.append(grass)
	})
	const tallgrasses = document.getElementById('lef').querySelectorAll('.tall-grass')
	const pokedex = document.getElementById('pokedex')
	const catchChance = .6
	const pokemons = [
		'furret',
		'ampharos',
		'skitty',
		'delcatty',
		'shinx',
		'glameow',
		'leafeon',
		'tailmon',
		'pigeon',
	]
	function spawnPokemon() {
		const grass = tallgrasses[Math.floor(Math.random()*tallgrasses.length)]
		const wrapper = document.createElement('div')
		const img = document.createElement('img')
		const caught = getSavedData('Pokemon-caught')
		const notCaught = pokemons.filter(e => !caught.find(e))
		let picked = notCaught[Math.floor(Math.random()*notCaught.length)]
		if (!picked)
			picked = pokemons[Math.floor(Math.random()*pokemons.length)]
		img.src = 'assets/lef/'+picked+'.png'
		wrapper.className = 'pokemon'
		wrapper.addEventListener('click', () => attemptToCatch(wrapper), {once: true})
		wrapper.dataset.name = picked
		wrapper.append(img)
		grass.append(wrapper)
		setTimeout(() => wrapper.classList.add('popup'), 10)
		setTimeout(() => {
			wrapper.classList.remove('popup')
			setTimeout(() => wrapper.remove(), 600)
		}, 3000)
		pokemonTimeoutID = setTimeout(spawnPokemon, Math.random() * 4000 + 1000)
	}
	async function attemptToCatch(element) {
		if (!document.querySelector('#lef #catch-attempt').classList.contains('hidden'))
			return
		const throwball = document.getElementById('throwball')
		const rect = element.getBoundingClientRect()
		throwball.style.display = ''
		await new Promise(r => setTimeout(r, 1))
		throwball.classList.add('thrown')
		await new Promise(r => setTimeout(r, 1))
		throwball.style.top = rect.top+'px'
		throwball.style.left = (rect.left + rect.width/2)+'px'
		await new Promise(r => setTimeout(r, 500))
		throwball.style.top = ''
		throwball.style.left = ''
		throwball.classList.remove('thrown')
		throwball.style.display = 'none'
		element.remove()
		let isMusicPlaying = false
		if (Playlist.current?.howl.playing()) {
			isMusicPlaying = true
			Playlist.current.howl.pause()
		}
		const ui = document.getElementById('catch-attempt')
		const ball = ui.querySelector('.pokeball')
		ui.removeAttribute('onclick')
		ui.classList.remove('hidden')
		ball.classList.add('closed')
		await new Promise(r => setTimeout(r, 500))
		ball.classList.remove('closed')
		if (Math.random() < catchChance) { //? Success
			ball.classList.add('wiggle')
			for (let i=0; i<3; i++) {
				document.h_wiggle.play()
				await new Promise(r => setTimeout(r, 1000))
			}
			ball.classList.remove('wiggle')
			document.h_caught.play()
			ui.lastElementChild.textContent = (element.dataset.name.charAt(0).toUpperCase() + element.dataset.name.slice(1)) + '!'
			ui.classList.add('caught')
			getSavedData('Pokemon-caught').push(element.dataset.name).save()
			pokedex.querySelector(`[src*="${element.dataset.name}"]`)?.classList.add('caught')
			ui.setAttribute('onclick', `this.classList.add('hidden');this.classList.remove('caught')${isMusicPlaying?';Playlist.current.howl.play()':''}`)

			if (getSavedData('Pokemon-caught').data.length == pokemons.length) {
				const key = document.createElement('div')
				const img = document.createElement('img')
				const tooltip = document.createElement('span')
				key.className = 'hastooltip key'
				key.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"
				img.src = 'assets/key-leafy.png'
				img.alt = 'A key-shaped leafy stick'
				img.style.cssText = 'transform:translateX(-12%'
				img.setAttribute('onclick', "this.parentElement.previousElementSibling.previousElementSibling.classList.remove('hidden');this.parentElement.style.cssText='';addCollectible(this, 'a key-shaped leafy stick', `You've earned a`, `Key-shaped Leafy Stick!`);this.parentElement.remove()")
				tooltip.className = 'tooltip'
				tooltip.textContent = 'A key-shaped leafy stick'
				key.append(img)
				key.append(tooltip)
				ui.querySelector('.pokeball').classList.add('hidden')
				ui.append(key)
			}
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
			if (isMusicPlaying)
				Playlist.current.howl.play()
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
				{expression: 'disgust', text: `##Oh dear##... I'll need something else to recover from the taste of _that_... Maybe pick something else?`}
			], endtrigger: () => {
				getSavedData('Ras-flags').push('tea1').save()
				document.querySelector("#ras2 .ras").setAttribute("onclick", "")
				const herbsPicked = getSavedData('herbs-picked')
				herbs.forEach(e => {
					if (!herbsPicked.find(e.querySelector('img').alt))
						e.classList.remove('locked')
					else
						e.classList.add('locked')
				})
			}
		}, tea2: {
			lines: [
				{expression: 'disgust', text: `..I'm _starting_ to feel as though this might've been a mistake. Could you ##please## try to pick something nicer?`}
			], endtrigger: () => {
				getSavedData('Ras-flags').push('tea2').save()
				document.querySelector("#ras2 .ras").setAttribute("onclick", "")
				const herbsPicked = getSavedData('herbs-picked')
				herbs.forEach(e => {
					if (!herbsPicked.find(e.querySelector('img').alt))
						e.classList.remove('locked')
					else
						e.classList.add('locked')
				})
			}
		}, tea3: {
			lines: [
				{expression: 'disgust', text: `You've _somehow_ brewed something that tastes like ##harpy##. I'm **not** certain this is a good idea anymore, but, please, pick ~something else~, mm?\nAnd don't ask...`}
			], endtrigger: () => {
				getSavedData('Ras-flags').push('tea3').save()
				document.querySelector("#ras2 .ras").setAttribute("onclick", "")
				const herbsPicked = getSavedData('herbs-picked')
				herbs.forEach(e => {
					if (!herbsPicked.find(e.querySelector('img').alt))
						e.classList.remove('locked')
					else
						e.classList.add('locked')
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
				document.getElementById('ras2').querySelector('.boulder-hitbox').addEventListener('click', () => {
					const key = document.createElement('div')
					const img = document.createElement('img')
					const tooltip = document.createElement('span')
					key.className = 'hastooltip key'
					key.style.cssText = "position:absolute;top:50%;left:50%;height:5vh;"
					img.src = 'assets/key-ras.png'
					img.alt = 'A key-shaped chunk of citrine'
					img.style.cssText = 'transform:translateX(-12%'
					img.setAttribute('onclick', "addCollectible(this, 'a key-shaped chunk of citrine', `You found a`, `Key-shaped Chunk of Citrine!`);this.parentElement.remove()")
					tooltip.className = 'tooltip'
					tooltip.textContent = 'A key-shaped chunk of citrine'
					key.append(img)
					key.append(tooltip)
					document.getElementById('ras2').querySelector('.boulder-hitbox').append(key)
					setTimeout(() => img.click(), 1000)
					document.querySelector("#ras2 .ras").setAttribute('onclick', "rasDialogue('final')")
					window.localStorage.setItem('Ras-currentdialogue', 'final')
				}, {once: true})
			}
		}, final: {
			lines: [
				{expression: 'smile-halfopen', text: `Oh, and to make your further travels just _a bit_ more ~interesting...~`},
				{expression: 'smirk', text: `I'll _periodically_ cast a few !!curses!! on you...`},
			], endtrigger: () => {
				trigger()
				function trigger() {
					castCurse()
					setTimeout(trigger, (Math.random()*2 + 3) * 60000)
				}
			}
		}
	}
	document.rasDialogueNodes = nodes
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
	function teaBrewed(name) {
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
			toScreenCenter(tea, 'You have brewed some', name+'!')
			wrapper.remove()
		}, 10)
		const herbsPicked = getSavedData('herbs-picked').data
		if (herbsPicked.length > 3) {
			ras.setAttribute('onclick', "rasDialogue('goodtea')")
			window.localStorage.setItem('Ras-currentdialogue', 'goodtea')
		} else {
			ras.setAttribute('onclick', `rasDialogue('tea${herbsPicked.length}')`)
			window.localStorage.setItem('Ras-currentdialogue', `tea${herbsPicked.length}`)
		}
	}
	async function faith() {
		const nx01 = document.createElement('img')
		nx01.src = 'assets/ras2/nx01.png'
		nx01.className = 'nx01'
		document.h_faith.play()
		await new Promise(r => setTimeout(r, 1250))
		Kowabi.playNode('nx01-1', true)
		await new Promise(r => setTimeout(r, 1250))
		page.append(nx01)
		Playlist.unlockSong('ent')
		Kowabi.playNode('nx01-2', true)
		await new Promise(r => setTimeout(r, 3500))
		Kowabi.playNode('nx01-3', true)
		await new Promise(r => setTimeout(r, 1500))
		nx01.remove()
	}
}
//# Key combos
{
	let typed = ''
	let timeoutID
	const combos = [
		{trigger: 'credits', callback: () => goToPage('credits', true)},
		{trigger: 'gohome', callback: () => goToPage('home', true)},
		{trigger: 'fasttext', callback: () => Steptext.instances.forEach(e => e.stepInterval = 1)},
		{trigger: 'ifuckedup', callback: () => {
			resetUnlockedSongs()
			resetSlimes()
			resetCollectibles()
			resetAlchemy()
			resetDialogues()
			resetPokedex()
			resetDoor()
		}},
		{trigger: 'icantread', callback: () => document.body.classList.toggle('cantread')},
		{trigger: 'pissbag', callback: () => {
			const key = document.createElement('div')
			const img = document.createElement('img')
			const tooltip = document.createElement('span')
			key.className = 'hastooltip key'
			key.style.cssText = "position:absolute;top:50%;left:50%;height:5vh;"
			img.src = 'assets/key-luna.png'
			img.alt = 'A floppy key'
			img.setAttribute('onclick', "addCollectible(this, 'a floppy key', `You earned a`, `Floppy Key!`);this.parentElement.remove()")
			tooltip.className = 'tooltip'
			tooltip.textContent = 'A floppy key'
			key.append(img)
			key.append(tooltip)
			document.getElementById('home').querySelector('.basement-wall').append(key)
			setTimeout(() => img.click())
		}},
		{trigger: 'nonagoninfinity', callback: () => {
			if (document.currentPage.id !== 'home')
				return
			NonagonInfinity(document.querySelector('#finaldoor'))
		}},
	]

	document.addEventListener('keydown', (e) => {
		if (e.key.length === 1 && e.key.match(/\w{1}/)) {
			typed += e.key.toLowerCase()
			for (const combo of combos)
				if (typed === combo.trigger) {
					combo.callback()
					typed = ''
				}
		}
		if (timeoutID) clearTimeout(timeoutID)
		timeoutID = setTimeout(() => {
			typed = ''
			timeoutID = undefined
		}, 1000)
	})
}
//# Ras' Curses
{
	const rasCurses = [
		[//* Spells/curses
			{id: 'CRSPALE', once: false, text: `You have been inflicted by the **Curse of Pale Skin**.\n<span style="font-size:.6em">Wait... That's redundant.</span>`},
			{id: 'CRSPIGN', once: false, text: `You have been inflicted by the **Curse of Pigeon Remembrance**.`},
			{id: 'CRSFART', once: false, text: `You have been inflicted by the **Curse of Public Assripping**.`},
			{id: 'CRSBRTH', once: false, text: `You have been inflicted by the **Curse of Manual Breathing**`},
			{id: 'PWDCOCK', once: false, text: `Power-word: **cockroach**`},
			{id: 'PWDPIGN', once: false, text: `Power-word: **pigeon**`},
			{id: 'PWDPIGN', once: false, text: `Power-word: **Gregg**`},
			{id: 'PWDPIGN', once: false, text: `Power-word: **wizeahd**`},
			{id: 'PWDPIGN', once: false, text: `Power-word: **tenagra**`},
		], [//* Stream/server stuff
			{id: 'DMBTINC', once:  true, text: `Your **dumbitude** has been permanently increased by 10%.`},
			{id: 'MAXDUMB', once:  true, text: `Your **maximum dumbitude** has been permanently increased by 10%.`},
		], [//* Books
			{id: 'BKPRINT', once:  true, text: `Your next physical book will have printing errors all over.`},
			{id: 'BKSORTD', once: false, text: `Your books have been alphabetically sorted.`},
			{id: 'LISTRST', once: false, text: `Your reading list has been reset.`},
			{id: 'GRMLNTP', once:  true, text: `A book-eating gremlin has been teleported into your weird hollow paper walls.`},
			{id: 'GRMLNOP', once:  true, req: 'GRMLNTP', text: `The gremlin in your walls has learned to read. **He thinks your taste sucks.**`},
		], [//* Physical
			{id: 'PISSBAG', once: false, text: `Your piss bag privileges have been revoked.`},
			{id: 'KIDNAPD', once: false, text: `One of your plague doctor plushies has been kidnapped.\n<span style="font-size:.6em">To have it returned, you must say "meal" correctly.</span>`},
			{id: 'LESSELF', once: false, text: `You are now **only 10%** elf.`},
		], [//* Psychic
			{id: 'WALKING', once: false, text: `Your internal monologue is now voiced by **Stephen Walking**.`},
			{id: 'NUDJOSH', once: false, text: `A nude picture of you has been sent to **Josh Homme**.`},
			{id: 'IPATEXT', once: false, text: `/ju kən naʊ ˈoʊnli ɹid tɛkst ɪn aɪ pi eɪ/`},
			{id: 'CANTSAY', once: false, text: `You have been rendered unable to pronounce [insert funny word].`},
			{id: 'THTWEET', once: false, text: `Your last two thoughts have been **tweeted** without your consent.`},
			{id: 'THUNFIN', once: false, text: `You can no longer finish your th`},
			{id: 'BORGW11', once: false, text: `Your computer is being updated to **Windows 11**. Resistance is futile.`},
			{id: 'THELIST', once: false, text: `Your name has been added to **The List**.`},
			{id: 'THEGAME', once: false, text: `You have lost The Game.`},
		], [//* Eldritch/weird
			{id: 'TMSWAYS', once: false, text: `You now perceive time **sideways**.`},
			{id: 'PNK2PRG', once: false, text: `All your favorite punk rock bands have been **existentially converted** to prog.`},
			{id: 'MEMBTMP', once: false, text: `All your favorite memories have been **converted** to bitmap format.\n<span style="font-size:.6em">Sadly, most of them didn't fit and have been **excised** in the process.</span>`},
		],
	]
	const screen = document.getElementById('ras-curses')
	const accept = screen.querySelector('.wrapper > span')
	const steptext = new Steptext(screen.querySelector('.text'), {
		stepInterval: 64,
		onFinished: () => {
			accept.classList.remove('hidden')
			steptext.pause()
		}
	})
	accept.addEventListener('click', async function(){
		screen.classList.add('fade')
		this.classList.add('hidden')
		document.h_chosen.play()
		await new Promise(r => setTimeout(r, 4000))
		screen.classList.remove('fade')
		screen.classList.add('hidden')
		this.previousElementSibling.innerHTML = ''
	})
	Steptext.encodings.set('==', ['flyin', 2])
	Steptext.tagsWithWrappedChars.push('flyin')
	function castCurse() {
		const curse = pickCurse()
		document.h_curse.play()
		setTimeout(() => {
			screen.classList.remove('hidden')
			setTimeout(() => steptext.queue('==' + curse.text + '=='), 1000)
		}, 300)
	}
	function pickCurse() {
		const cast = getSavedData('curses-cast')
		const filtered = rasCurses
			.map(list => list.filter(entry => (entry.once? !cast.find(entry.id) : true) && (entry.req? cast.find(entry.req) : true)))
			.filter(list => list.length > 0)
		let picked = filtered[Math.floor(Math.random()*filtered.length)]
		picked = picked[Math.floor(Math.random()*picked.length)]
		cast.push(picked.id).save()
		return picked
	}
}

//! Effects setup
//# Stealth Rickroll
function Rickroll() {
	window.open('https://youtu.be/p7I-hPab3qo?si=VwK3N7QaI9k0ofAI&t=3', '_blank', 'width=1,height=1,left=99999,top=99999')
}
//# Sound effects
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
document.h_snap = new Howl({src: ['assets/home/snap.mp3']})
document.h_unlock = new Howl({src: ['assets/home/unlock.mp3']})
document.h_open = new Howl({src: ['assets/home/open-door.mp3']})
document.h_curse = new Howl({src: ['assets/ras2/curse-woosh.mp3']})
document.h_chosen = new Howl({src: ['assets/ras2/choice-made.mp3']})
document.h_rasambiance = new Howl({src: ['assets/ras2/ambiance.mp3'], volume:.3, loop:true})
document.h_yippee = new Howl({src: ['assets/home/yippee.mp3']})
document.h_clap = new Howl({src: ['assets/end/clap.mp3']})
document.h_youknowwhatthissoundis = new Howl({src: ['assets/home/youknowwhatthissoundis.mp3']})
document.h_borf = [
	new Howl({src: ['assets/home/borf1.mp3']}),
	new Howl({src: ['assets/home/borf2.mp3']}),
	new Howl({src: ['assets/home/borf3.mp3']}),
	new Howl({src: ['assets/home/borf4.mp3']}),
	new Howl({src: ['assets/home/borf5.mp3']}),
	new Howl({src: ['assets/home/borf6.mp3']}),
	new Howl({src: ['assets/home/borf7.mp3']}),
	new Howl({src: ['assets/home/borf8.mp3']}),
]
//# Goblin dance
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
		const kf = getSavedData('Kowabi-flags')
		if ((Kowabi.classList.contains('gobdance-reaction-2') && !kf.find('gobdance-2-done')) || Kowabi.classList.contains('gobdance-reaction-1') && document.h_gobdance.volume() <= .00001) {
			Kowabi.playNode('gobdance-3', true)
			Kowabi.classList.remove('gobdance-reaction')
			Kowabi.classList.remove('gobdance-reaction-1')
			Kowabi.classList.remove('gobdance-reaction-2')
		}
		else if (!Kowabi.classList.contains('gobdance-reaction-1') && document.h_gobdance.volume() > .02 && document.h_gobdance.volume() < .2) {
			if (!kf.find('gobdance-2-done')) {
				Kowabi.playNode('gobdance-1', true)
			} else Kowabi.playNode('gobdance-1.5', true)
			Kowabi.classList.add('gobdance-reaction')
			Kowabi.classList.add('gobdance-reaction-1')
		}
		else if (!Kowabi.classList.contains('gobdance-reaction-2') && document.h_gobdance.volume() > .2) {
			Kowabi.playNode('gobdance-2', true)
			kf.push('gobdance-2-done').save()
			Kowabi.classList.add('gobdance-reaction')
			Kowabi.classList.add('gobdance-reaction-2')
		}
	}
}, {passive: true})
//# Goblin head snap
{
	const gob = document.querySelector('#home .singular-gob')
	new IntersectionObserver(([entry]) => {
		const centerY = window.innerHeight / 2

		if (entry.isIntersecting) {
			document.getElementById('home').addEventListener('scroll', onScroll, {passive: true})
			onScroll()
		} else {
			Array.from(gob.children).forEach(e => e.classList.toggle('hidden'))
			document.getElementById('home').removeEventListener('scroll', onScroll)
			onScroll = null
		}

		function onScroll() {
			const r = gob.getBoundingClientRect()
			if (r.top < centerY && r.bottom > centerY) {
				if (document.h_snap.playing()) return
				document.h_snap.play()
				Array.from(gob.children).forEach(e => e.classList.toggle('hidden'))
				document.getElementById('home').removeEventListener('scroll', onScroll)
			}
		}
	}, {
		threshold: [0],
	}).observe(gob)
}
//# Leafy's fleeing download button
{
	const funnibutton = document.getElementById('funnydownload')
	const dist = 100
	funnibutton.addEventListener('mousemove', flee, {once: true})
	async function flee() {
		const delay = Math.random() * 100
		const style = getComputedStyle(funnibutton)
		await new Promise(r => setTimeout(r, delay))
		funnibutton.style.left = (+style.left.match(/\d+/)[0] + Math.random()*dist - dist/2) + 'px'
		funnibutton.style.top = (+style.top.match(/\d+/)[0] + Math.random()*dist - dist/2) + 'px'
		await new Promise(r => setTimeout(r, 100))
		funnibutton.addEventListener('mousemove', flee, {once: true})
	}
}
//# Credits false parallax
{
	const credits = document.getElementById('credits')
	credits.addEventListener('scroll', throttle(set), {passive: true})
	function set() {
		credits.style.setProperty('--bgo', credits.scrollTop)
	}
}
//# Nonagon Infinity: opens the door
async function NonagonInfinity(door) {
	door.classList.add('open')
	const home = door.closest('.fullpage')
	home.scrollTo({
		top: home.scrollTop + home.querySelector('.floor.ceiling').getBoundingClientRect().top,
		behavior: 'smooth'
	})
	document.h_open.play()
	await new Promise(r => setTimeout(r, 2000))
	const end = document.getElementById('end')
	end.classList.remove('hidden')
	document.h_clap.play()
	await new Promise(r => setTimeout(r, 3010))
	if (document.h_gobdance.playing())
		document.h_gobdance.pause()
}
//# Book excerpts
{
	const book = document.getElementById('book-excerpt')
	const title = book.querySelector('.title > span:first-child')
	const author = book.querySelector('.title > span:nth-child(2)')
	const steptext = new Steptext(book.querySelector('.excerpt'), {stepInterval: 1})

	Steptext.encodings.set('@', ['fadein', 1])
	Steptext.tagsWithWrappedChars.push('fadein')
	function showExcerpt(tit, au, text) {
		book.classList.remove('hidden')
		steptext.targetElement.textContent = ''
		title.innerHTML = tit
		author.innerHTML = au
		// steptext.queue(text.replaceAll(/(?<= |^|$|[\*_~~])([^\*_\s~~]+?)(?= |^|$|[\*_~~])/g, '@$1@'))
		steptext.queue(text)
		steptext.skip()
		steptext.targetElement.scrollTo({top:0,behavior:'instant'})
		book.addEventListener('click', () => book.classList.add('hidden'), {once: true})
	}
}

//! Starting setup
//? Set player volume
Playlist.setVolume(window.localStorage.getItem('player-volume') || 1)
//? Trigger Kowabi's intro
if (getSavedData('Kowabi-flags').find('intro-done')) {
	Kowabi.playNode('assistance0')
	Kowabi.classList.add('passive-ok')
} else {
	Kowabi.playNode('intro-kt')
	Kowabi.setExpression(3, 2)
}
//? Start on home page
window.addEventListener('load', () => {
	goToPage('home', true)
	player.classList.remove('hidden')
	Kowabi.classList.remove('hidden')
	//? Trigger first visitor popup
	window.addEventListener('click', () => {
		document.getElementById('retroModal').style.display = 'block'
		document.h_yippee.play()
	}, {once: true})
	document.body.scrollTo({top:0,behavior:'instant'})
})
//? First playlist update
setTimeout(() => player.updatePlaylist(), 1000)
//? Load saved ingredients
getSavedData('collectibles', {
	pack: (data) => JSON.stringify(data),
	unpack: (data) => JSON.parse(data)
}).data
	.filter(e => !!e.html.match(/class="[^"]*?ingredient[^"]*?"/))
	.forEach(e => {
		const surrogate = document.createElement('div')
		surrogate.innerHTML = e.html
		surrogate.firstElementChild.firstElementChild.setAttribute('onclick', 'Alchemy.add(this)')
		if (e.html.match(/alt="[^"]*?slime[^"]*?"/))
			Alchemy.shelfRight.append(surrogate.firstElementChild)
		else
			Alchemy.shelfLeft.append(surrogate.firstElementChild)
	})
Alchemy.filterIngredients()
//? Load keys
getSavedData('collectibles', {
	pack: (data) => JSON.stringify(data),
	unpack: (data) => JSON.parse(data)
}).data
	.filter(e => !!e.html.match(/alt="[^"]*?key[^"]*?"/))
	.forEach(e => {
		const surrogate = document.createElement('div')
		surrogate.innerHTML = e.html
		hangKey(surrogate.firstElementChild)
	})
//? Load caught pokemon
getSavedData('Pokemon-caught').data.forEach(e => document.getElementById('pokedex').querySelector(`[src*="${e}"]`)?.classList.add('caught'))
//? Load Ras dialogue progress
{
	const currentDialogue = window.localStorage.getItem('Ras-currentdialogue') || 'intro'
	for (const key of Object.keys(document.rasDialogueNodes)) {
		if (key === currentDialogue) break
		document.rasDialogueNodes[key].endtrigger()
	}
	document.getElementById('ras2').querySelector('.ras').setAttribute('onclick', `rasDialogue('${currentDialogue}')`)
}
//? Show Chroma if key gotten
if (getSavedData('collectibles', {
	pack: (data) => JSON.stringify(data),
	unpack: (data) => JSON.parse(data)
}).data.find(e => e.key.includes('chromatic slime')))
	document.querySelector('#kaboom #field #chroma').style.display = ''
//? Load opened locks
{
	const locksOpened = getSavedData('locks-opened')
	document.getElementById('home').querySelectorAll('.lock').forEach(e => {
		if (locksOpened.find(e.dataset.number))
			e.classList.add('hidden')
	})
}

//# Debug
// const nav = document.getElementById('debug-nav')
// setTimeout(() => {
// 	for (const page of Array.from(document.querySelectorAll('.fullpage'))) {
// 		const button = document.createElement('button')
// 		button.textContent = page.id
// 		button.addEventListener('click', function(){goToPage(this.textContent)})
// 		nav.append(button)
// 	}
// }, 500)
// Steptext.instances.forEach(st => st.stepInterval = 1)

//# Functions
function goToPage(id, skipAnimation=false) {
	if (document.body.classList.contains('turning'))
		return
	document.body.classList.add('turning')
	const animationLength = 2
	let previous
	if (!document.currentPage)
		document.currentPage = document.querySelector('.fullpage:not(.hidden)') || document.querySelector(`.fullpage#${id}`)
	else
		previous = document.currentPage
	document.currentPage = document.querySelector(`.fullpage#${id}`)
	document.currentPage.classList.remove('hidden')
	if (skipAnimation) {
		previous?.classList.add('hidden')
		document.body.classList.remove('turning')
	} else {
		document.currentPage.classList.add('turning')
		setTimeout(() => {
			document.currentPage.classList.remove('turning')
			previous?.classList.add('hidden')
			document.body.classList.remove('turning')
		}, 1000 * animationLength + 100)
	}
	//? State management
	if (previous?.id === 'home' && document.h_gobdance.playing())
		document.h_gobdance.pause()
	if (previous?.id === 'ras2')
		document.h_rasambiance.pause()
	//? Nav triggers
	const collectibles = getSavedData('collectibles', {
		pack: (data) => JSON.stringify(data),
		unpack: (data) => JSON.parse(data)
	}).data
	const translator = collectibles.find(e => e.key == 'a Starfleet-issue Universal Translator')
	if (document.currentPage.id === 'kaboom') {
		Playlist.playSong('kaboom', true)
		if (translator && !getSavedData('Kowabi-flags').find('kaboom-intro-done'))
			Kowabi.playNode('kaboom-intro')
	}
	else if (document.currentPage.id === 'home') {
		document.currentPage.dispatchEvent(new Event('scroll'))
		if (Playlist.current?.howl.playing())
			Playlist.play()
	} else if (document.currentPage.id === 'ras2') {
		Playlist.playSong('ras', true)
		document.h_rasambiance.play()
		if (translator)
			if (getSavedData('Kowabi-flags').find('ras-intro-done'))
				Kowabi.playNode('ras0')
			else
				Kowabi.playNode('ras-intro')
	} else if (document.currentPage.id === 'pal') {
		Playlist.playSong('pal', true)
		if (translator)
			if (getSavedData('Kowabi-flags').find('pal-intro-done'))
				Kowabi.playNode('pal0')
			else
				Kowabi.playNode('pal-intro')
	} else if (document.currentPage.id === 'lef') {
		Playlist.playSong('leafy', true)
		pokemonTimeoutID = setTimeout(spawnPokemon, Math.random() * 4000 + 1000)
		if (translator)
			if (getSavedData('Kowabi-flags').find('lef-intro-done'))
				Kowabi.playNode('lef0')
			else
				Kowabi.playNode('lef-intro')
	} else if (Playlist.current?.howl.playing())
		Playlist.play()
	if (document.currentPage.id !== 'lef')
		clearTimeout(pokemonTimeoutID)
}
function addCollectible(element, key, toptext='', bottomtext='') {
	element.removeAttribute('onclick')
	toScreenCenter(element, toptext, bottomtext)
	if (element.tagName === 'IMG')
		element.parentElement.style.cssText = ''
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
		if (element.alt.includes('slime'))
			Alchemy.shelfRight.append(clone)
		else
			Alchemy.shelfLeft.append(clone)
	}
	if (element.src.includes('key'))
		hangKey(element.parentElement)
}
function secondsToTime(seconds) {
	return Math.floor(seconds/60) + ':' + (''+Math.floor(seconds%60)).padStart(2, '0')
}
function DropTempText(element, string, seconds=5, post) {
	const text = document.createElement('div')
	text.textContent = string
	text.className = 'temptext'
	text.style.top = getComputedStyle(element).top
	text.style.left = getComputedStyle(element).left
	text.style.setProperty('--angle', Math.random()*40-20+'deg')
	element.parentElement.append(text)
	if (post)
		post(text)
	setTimeout(() => text.remove(), seconds*1000)
}
async function toScreenCenter(element, toptext='', bottomtext='', delay=0) {
	const rect = element.getBoundingClientRect()
	const clone = element.cloneNode(true)
	const div = document.createElement('div')
	const tt = document.createElement('div')
	const bt = document.createElement('div')
	div.style.position = 'absolute'
	div.style.top = rect.top+'px'
	div.style.left = rect.left+'px'
	clone.style.height = element.clientHeight+'px'
	clone.style.width = element.clientWidth+'px'
	clone.style.transform = getComputedStyle(element).transform
	tt.textContent = toptext
	bt.textContent = bottomtext
	div.append(clone)
	if (toptext.length)
		div.prepend(tt)
	if (bottomtext.length)
		div.append(bt)
	document.body.append(div)
	await new Promise(r => setTimeout(r, 10))
	div.classList.add('toscreencenter')
	const ratio = (window.visualViewport.height * .3) / clone.clientHeight
	await new Promise(r => setTimeout(r, 10))
	clone.style.height = (window.visualViewport.height * .3)+'px'
	clone.style.width = (clone.clientWidth * ratio)+'px'
	await new Promise(r => setTimeout(r, 2000 + delay))
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
				key.innerHTML = `<img src="assets/key-kaboom.png" alt="A key-shaped blob of chromatic slime" onclick="addCollectible(this,'a key-shaped blob of chromatic slime', 'Chroma gave you a', 'Key-shaped Blob of Chromatic Slime!');slimeSteptext.targetElement=document.querySelector('#kaboom #slime-dialogue .text');document.querySelector('#pal #slime-dialogue').remove()"><span class="tooltip">A key-shaped blob of chromatic slime</span>`
				key.querySelector('img').addEventListener('click', () => {
					if (getSavedData('collectibles', {
						pack: (data) => JSON.stringify(data),
						unpack: (data) => JSON.parse(data)
					}).data.find(e => e.key.includes('chromatic slime')))
						document.querySelector('#kaboom #field #chroma').style.display = ''
				})
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
function hangKey(element) {
	element = element.cloneNode(true)
	if (!getSavedData('keys-used').find(element.firstElementChild.alt)) {
		element.firstElementChild.addEventListener('click', function(){openLock(this)}, {once: true})
		element.firstElementChild.setAttribute('onclick', '')
	}
	let done = false
	document.querySelectorAll('#home .basement-wall .wallhook').forEach(e => {
		if (done || e.childElementCount > 2) return
		e.append(element)
		done = true
	})
	function openLock(key) {
		const locksOpened = getSavedData('locks-opened')
		const locks = Array.from(document.getElementById('home').querySelectorAll('.lock:not(.hidden)'))
			.filter((e) => !locksOpened.data.includes(+e.dataset.number))
		const picked = locks[Math.floor(Math.random()*locks.length)]
		picked.classList.add('hidden')
		locksOpened.push(+picked.dataset.number).save()

		key.removeAttribute('onclick')
		getSavedData('keys-used').push(key.alt).save()

		document.h_unlock.play()
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
	window.localStorage.removeItem('recipes-brewed')
}
function resetDialogues() {
	window.localStorage.removeItem('Kowabi-flags')
	window.localStorage.removeItem('Ras-flags')
	window.localStorage.removeItem('herbs-picked')
}
function resetPokedex() {
	getSavedData('Pokemon-caught').clear()
}
function resetDoor() {
	getSavedData('locks-opened').clear()
	getSavedData('keys-used').clear()
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
function throttle(fn) {
	let ticking = false
	return (...args) => {
		if (!ticking) {
			requestAnimationFrame(() => {
				fn(...args)
				ticking = false
			})
			ticking = true
		}
	}
}