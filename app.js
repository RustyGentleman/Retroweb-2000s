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
	// Kowabi.text.textContent = string
	Kowabi.text.textContent = ''
	Steptext.queue = string
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
Kowabi.addNode = (key, text, ...options) => {
	Kowabi.dialogueNodes[key] = {text, options}
}
Kowabi.addNodes = (...nodes) => {
	for (const node of nodes)
		for (const [key, text, options] of node)
			Kowabi.addNode(key, text, options)
}
Kowabi.playNode = (key) => {
	const node = Kowabi.dialogueNodes[key]
	if (!node) return console.warn(`Dialogue node "${key}" not found.`)

	Steptext.queue = ''
	Steptext.close = []
	Kowabi.setText(node.text)
	Kowabi.resetOptions()
	Kowabi.addOptions(...node.options)
}
Kowabi.setExpression = (col, row) => Kowabi.expression.className = `col-${col} row-${row}`

//# Kowabi dialogues
//* Main page
Kowabi.addNodes([
	['intro-kt', `~Haine!~ _**Kowabi**_ maibe made, done maiyunama miremoyekai madeda!`, [
			['What?', 'intro-en', () => Kowabi.setExpression(3, 1)],
		]],
	['intro-en', `~Greetings...~ I am _**Kowabi**_, and I will be your guide.`, [
			['Oh, okay', 'assistance', () => Kowabi.setExpression(1, 1)],
		]],
	['assistance', 'Would your _~stupid~_ self like some assistance?', [
			['Yes', 'assistance1-0', () => Kowabi.setExpression(4, 2)],
			['Of course', 'assistance1-1', () => Kowabi.setExpression(6, 2)],
		]],
	['assistance1-0', 'Of course. What do you need help with?', [
			['Life', 'life', () => Kowabi.setExpression(1, 4)],
			['Navigation', 'navigation', () => Kowabi.setExpression(4, 3)],
		]],
	['assistance1-1', '_Of !!course!!..._ Of _course_. What do you need help with?', [
			['Life', 'life', () => Kowabi.setExpression(1, 4)],
			['Navigation', 'navigation', () => Kowabi.setExpression(4, 3)],
		]],
	['life', "_~Don't we all...~_", [
			['Life', 'life', () => Kowabi.setExpression(1, 4)],
			['Navigation', 'navigation', () => Kowabi.setExpression(4, 3)],
		]],
	['navigation', "Well, there's not much to navigate for now, but I'm sure this place will be full of life in no time.", [
			['Life', 'life', () => Kowabi.setExpression(1, 4)],
			['Navigation', 'navigation', () => Kowabi.setExpression(4, 3)],
		]],
])

//# Stealth rickroll
function Rickroll() {
	window.open('https://youtu.be/p7I-hPab3qo?si=VwK3N7QaI9k0ofAI&t=3', '_blank', 'width=1,height=1,left=99999,top=99999')
}

//# Page navigation
function GoToPage(id) {
	if (document.currentPage)
		document.currentPage.classList.add('hidden')
	document.querySelector(`.fullpage#${id}`).classList.remove('hidden')
}

//# Starting setup
document.currentPage = document.querySelector('.fullpage#home')
GoToPage('home')
Kowabi.playNode('intro-kt')
Kowabi.setExpression(3, 2)

document.h_Phaser = new Howl({src: ['assets/ras/phaser.mp3']})

// let count = 1
// Kowabi.addOption('Add another', () => Kowabi.addOption(`Opt ${count++}`, () => {
// 	Array.from(Kowabi.options.children)
// 		.slice(1)
// 		.forEach(e => e.remove())
// 	count = 1
// }))

// class Dialogue {
// 	/** @type {DialogueNode} */
// 	start
// 	/** @type {DialogueNode[]} */
// 	globalEntryNodes = []
// 	/** @type {DialogueNode} */
// 	current
// 	/** @type {DialogueNode} */
// 	lastLeftAt
// 	/** @type {DialogueNode[]} */
// 	history = []
// 	/** @type {(node: DialogueNode) => void} */
// 	Display

// 	/**
// 	 * @param {string} id
// 	 * @param {DialogueNode} start
// 	 */
// 	constructor(id, start) {
// 		this.id = id
// 		this.start = start

// 		const nodes = [start]

// 		while (nodes.length > 0) {
// 			const node = nodes.shift()
// 			node.dialogue = this
// 			nodes.push(...node.choices.map(e => e.node))
// 		}
// 	}

// 	/**
// 	 * Find dialogue by ID.
// 	 * @param {string} id
// 	 */
// 	static get(id) {
// 		return this.all.get(id)
// 	}
// 	/**
// 	 * Set the callback function that will be called whenever dialogue must be displayed.
// 	 * @param {(node: DialogueNode) => void} callback Function to be called to display the dialogue node.
// 	 */
// 	static setDisplayFunction(callback) {
// 		this.Display = callback
// 	}

// 	initiate() {
// 		this.moveTo(this.start)
// 	}
// 	/**
// 	 * Move to a different dialogue node.
// 	 * @param {DialogueNode|'leave'} node DialogueNode being moved into.
// 	 */
// 	moveTo(node) {
// 		if (node === undefined)
// 			throw new Erorr('node is undefined.')
// 		if (node == 'leave') {
// 			Dialogue.active = false
// 			this.lastLeftAt = this.current
// 			Game.Print(ParseOutput(
// 				'\n\n'
// 				+ pickString(null, this, 'onLeaveDialogue')
// 					.replaceAll(/<(?:player|self)>/g, Game.player.name)
// 					.replaceAll(/<(?:name|target)>/g, Array.from(Entity.all.values()).filter(e => e.dialogue && e.dialogue === this)?.name)
// 			))
// 			return
// 		}
// 		else if (!Dialogue.active) {
// 			this.history = []
// 			this.current = undefined
// 		}
// 		Dialogue.active = this
// 		if (this.current instanceof DialogueNode) {
// 			this.history.push(this.current)
// 			this.current.triggerEffects('ON_LEAVE')
// 		}
// 		if (!(node instanceof DialogueNode))
// 			node = DialogueNode.get(node)
// 		this.current = node
// 		this.current.triggerEffects('ON_ENTER')
// 		const dialogue = this
// 		const choices = node.choicesToDisplay
// 		for (const i in choices) {
// 			const choiceNumber = parseInt(i) + 1
// 			// Game.player.addCommand(new Command(`dialogue_choice ${choiceNumber}`, [new Matcher(new RegExp(`(${choiceNumber})`))], function() {
// 			const button = document.createElement('button')
// 			Kowabi.options.append(button)
			
// 				Game.player.commands
// 					.filter(e => e.name.startsWith('dialogue_choice'))
// 					.forEach(e => e.delete())
// 				dialogue.moveTo(choices[i].node)
// 				return ''
// 			}).addTag('DYNAMIC'))
// 		}
// 		Dialogue.Display(node)
// 	}

// 	addGlobalEntryNode(node) {
// 		this.globalEntryNodes.push(node)
// 		node.dialogue = this
// 		return this
// 	}
// 	addNode(node) {
// 		node.dialogue = this
// 	}
// }
// class DialogueNode {
// 	/** @type {Map<string, DialogueNode>} */
// 	static all = new Map()
// 	/** @type {string} */
// 	id
// 	/** @type {string} */
// 	text
// 	/** @type {DialogueNodeOption[]} */
// 	choices = []
// 	/** @type {number} */
// 	timesVisited = 0
// 	/** @type {boolean} */
// 	canLeave
// 	/** @type {boolean} */
// 	canReturn
// 	/** @type {string} */
// 	returnTo
// 	/** @type {Array<Event, Effect>} */
// 	effects = []
// 	/** @type {Dialogue} */
// 	dialogue
// 	Display

// 	/**
// 	 * @param {string} id
// 	 * @param {string} text
// 	 * @param {boolean} canLeave
// 	 * @param {boolean} canReturn
// 	 * @param {string} returnTo
// 	 */
// 	constructor (id, text, effects=[], canLeave=false, canReturn=false, returnTo=undefined) {
// 		if (DialogueNode.all.has(id))
// 			throw new Error('DialogueNode ID not unique: '+id)
// 		if (canReturn && !returnTo)
// 			console.error('DialogueNode has canReturn set to true, but no returnTo node:\n', this)

// 		this.id = id
// 		this.text = text
// 		this.effects = effects
// 		this.canReturn = canReturn
// 		this.canLeave = canLeave
// 		this.returnTo = returnTo

// 		this.effects.push(['ON_ENTER', () => {DialogueNode.get(id).timesVisited += 1}])

// 		DialogueNode.all.set(id, this)
// 	}

// 	/**
// 	 * Find dialogue node by ID.
// 	 * @param {string} id
// 	 */
// 	static get(id) {
// 		return this.all.get(id)
// 	}

// 	get choicesToDisplay() {
// 		let choices = this.choices
// 			.filter(e => e.appearsIf === undefined || e.appearsIf())
// 			.map(e => {return { display: e.display, node: e.node, appearsIf: e.appearsIf}})
// 		if (this.canReturn)
// 			choices.push({
// 				display: pickString(null, null, 'dialogueChoiceReturn'),
// 				node: this.returnTo instanceof DialogueNode?
// 					this.returnTo : DialogueNode.get(this.returnTo)
// 			})
// 		if (this.canLeave || choices.length == 0)
// 			choices.push({
// 				display: pickString(null, null, 'dialogueChoiceLeave'),
// 				node: 'leave'
// 			})
// 		choices.forEach(e => e.display = ParseOutput(this.parseString(e.display)))
// 		// debugger
// 		return choices
// 	}
// 	get parsedText() {
// 		return ParseOutput(this.parseString(this.text))
// 	}

// 	parseString(string) {
// 		let parsedString = this.dialogue.parseString(string)

// 		let replaced = false
// 		for (const match of parsedString.matchAll(Defaults.REGEX.parsestring)) {
// 			let [found, type, info, text] = match

// 			const negType = !!type.match(/^!/)
// 			if (negType) type = type.slice(1)

// 			switch(type) {
// 				case 'timesvisited': {
// 					const num = parseInt(info)
// 					if (
// 						(!isNaN(num) && this.timesVisited === num)
// 						|| (negType && num && this.timesVisited !== num)
// 						|| isNaN(num) && (
// 							(!negType && eval(`${this.timesVisited}` + info))
// 							|| negType
// 						)
// 					) {
// 						parsedString = parsedString.replace(found, text)
// 						replaced = true
// 					} else
// 						parsedString = parsedString.replace(found, '')
// 					break
// 				}
// 				case 'firstvisit': {
// 					if ((!negType && this.timesVisited === 1) || (negType && this.timesVisited > 1)) {
// 						parsedString = parsedString.replace(found, text)
// 						replaced = true
// 					} else
// 						parsedString = parsedString.replace(found, '')
// 					break
// 				}
// 				case 'inhistory': {
// 					const num = parseInt(info)
// 					const count = this.dialogue.history.reduce((prv, cur) => cur === this? prv+1 : prv, 0)
// 					if (
// 							(!negType && (
// 								(isNaN(num) && eval(`${count}` + info))
// 								|| (!isNaN(num) && eval(`${count}===` + info))
// 								|| (!info && this.dialogue.history.includes(this))
// 							))
// 							|| (negType && (
// 								(isNaN(num) && !eval(`${count}` + info))
// 								|| (!isNaN(num) && !eval(`${count}===` + info))
// 								|| (!info && !this.dialogue.history.includes(this))
// 							))
// 					) {
// 						parsedString = parsedString.replace(found, text)
// 						replaced = true
// 					} else
// 						parsedString = parsedString.replace(found, '')
// 					break
// 				}
// 			}
// 		}

// 		if (replaced)
// 			parsedString = this.parseString(parsedString)

// 		return parsedString
// 	}
// 	getString(key) {
// 		const string = this.dialogue.strings.get(key)
// 		if (string === undefined || string === '')
// 			return ''
// 		return this.parseString(ParseOutput(string))
// 	}

// 	enter() {
// 		this.dialogue.moveTo(this)
// 	}
// 	/**
// 	 * @param {number} index Index of the choice picked
// 	 */
// 	choose(index) {
// 		this.dialogue.moveTo(this.choices[index].node)
// 	}

// 	/**
// 	 * @param {string} display Text to be displayed when the option is presented.
// 	 * @param {string|DialogueNode} node DialogueNode instance or string ID.
// 	 * @param {() => boolean} appearsIf Function that returns a boolean according to whether the option should be presented and accessible.
// 	 */
// 	addChoice(display, node, appearsIf=undefined) {
// 		if (typeof(node) === 'string') {
// 			this.choices.push({ display, node: DialogueNode.get(node), appearsIf })
// 			DialogueNode.get(node).dialogue = this.dialogue
// 		} else if (node instanceof DialogueNode) {
// 			this.choices.push({ display, node, appearsIf })
// 			node.dialogue = this.dialogue
// 		}
// 		return this
// 	}
// 	/**
// 	 * @param {string} even
// 	 * @param {function} effect
// 	 */
// 	addEffect(event, effect, prepend=false) {
// 		effect = effect.bind(DialogueNode.get(this.id))
// 		if (prepend)
// 			this.effects.push([event, effect])
// 		else
// 			this.effects.unshift([event, effect])
// 		return this
// 	}
// 	/**
// 	 * @param {string} event Trigger all effects triggerable by the given event.
// 	 */
// 	triggerEffects(event, ...args) {
// 		this.effects.filter(e => e[0] === event).forEach(e => e[1](this, ...args))
// 		return this
// 	}
// }