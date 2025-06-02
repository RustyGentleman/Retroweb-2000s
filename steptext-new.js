/** @typedef {{stepInterval: integer, stepfastEnabledMultiplier: number, soundPlayFunction: function, soundStepInterval: integer, onFinished: (steptext: Steptext, targetElement: HTMLElement) => void}} SteptextOptions */

class Steptext {
	static instances = []
	static encodings = new Map([
		['\\*\\*', ['b', 2]],
		['__', ['u', 2]],
		['~~', ['s', 2]],
		['\\*', ['i', 1]],
		['_', ['i', 1]],
		['~', ['wave', 1]],
		['!!', ['jitter', 2]],
		['##', ['glow', 2]],
	])
	static tagsWithWrappedChars = [
		'wave',
		'jitter',
	]
	close = []

	textQueue = ''
	targetElement = null
	stepTimeoutID
	stepInterval = 64

	stepFastEnabled = false
	stepfastEnabledMultiplier = 1/3

	soundPlayFunction
	soundStepInterval = 3
	soundCounter = 0

	onFinished

	/**
	 * @param {HTMLtargetElement} targetElement targetElement inside which text will be pushed to
	 * @param {SteptextOptions} options Other options
	 */
	constructor(targetElement, options) {
		this.targetElement = targetElement
		if (options) {
			if (options.stepInterval)
				this.stepInterval = options.stepInterval
			if (options.stepfastEnabledMultiplier)
				this.stepfastEnabledMultiplier = options.stepfastEnabledMultiplier
			if (options.soundPlayFunction)
				this.soundPlayFunction = options.soundPlayFunction
			if (options.soundStepInterval)
				this.soundStepInterval = options.soundStepInterval
			if (options.onFinished)
				this.onFinished = options.onFinished
		}
		Steptext.instances.push(this)
		return this
	}

	get skipback() {
		return this.close.reduce((prv, cur) => prv + cur.length, 0)
	}

	queue(string, skipPrevious=true) {
		if (skipPrevious)
			this.skip()
		this.textQueue = string
		this.stepTimeoutID = undefined
		this.step()
	}
	step(dis=null) {
		if (dis === null)
			dis = this
		if (dis.textQueue.length > 0) {
			dis.place()
			dis.soundCounter++
			if (dis.soundPlayFunction && dis.soundCounter % dis.soundStepInterval == 0) {
				if (document.hasFocus())
					dis.soundPlayFunction()
				dis.soundCounter %= dis.soundStepInterval
			}
			// const do_scroll = dis.targetElement.scrollTop >= dis.targetElement.scrollHeight - dis.targetElement.clientHeight - 200
			// if (do_scroll)
			// 	dis.targetElement.scrollTo({top: dis.targetElement.scrollHeight})
		}
		else {
			if (dis.onFinished)
				dis.onFinished(dis, dis.targetElement)
			// dis.pause()
		}
		if (dis.stepTimeoutID !== null)
			dis.stepTimeoutID = setTimeout(() => dis.step(dis), dis.stepInterval * (dis.fastEnabled? 1/3 : 1))
	}
	pause() {
		clearTimeout(this.stepTimeoutID)
		this.stepTimeoutID = null
	}
	reset() {
		this.textQueue = ''
		this.close = []
	}
	place() {
		if (this.textQueue.length == 0) return

		while (this.decode() || this.htmlOpen() || this.htmlClose()) null
		if (this.textQueue.length == 0) return

		// Handle newlines and line breaks:
		if (this.textQueue.startsWith('\n') || this.textQueue.startsWith('\r\n')) {
			// Create a line break targetElement (br or a custom targetElement if needed):
			this.getInnermostChild().appendChild(document.createElement('br'))
			this.textQueue = this.textQueue.slice(this.textQueue[0] === '\r' ? 2 : 1)
			return
		}
		if (this.textQueue.startsWith('\\')) {
			this.textQueue = this.textQueue.slice(1)
			if (this.textQueue.length)
				this.getInnermostChild().appendChild(document.createTextNode(this.textQueue[0]))
			return
		}

		// Handle regular text or individually wrapped characters:
		if (this.close.length && this.close.filter(e => Steptext.tagsWithWrappedChars.includes(e.match(/\w+/)[0])).length) {
			const span = document.createElement('span')
			const withSpaces = this.textQueue.match(/^[^ ] */)
			if (withSpaces) {
				span.innerHTML = withSpaces[0].replaceAll(' ', '&nbsp;')
				this.textQueue = this.textQueue.slice(withSpaces[0].length-1)
			} else
				span.innerHTML = this.textQueue[0].replace(' ', '&nbsp;')
			this.getInnermostChild().appendChild(span)
		} else {
			if (this.getInnermostChild()?.lastChild?.nodeType === 3) {
				this.getInnermostChild().lastChild.textContent += this.textQueue[0]
			} else {
				const textNode = document.createTextNode(this.textQueue[0])
				this.getInnermostChild().appendChild(textNode)
			}
		}

		this.textQueue = this.textQueue.slice(1)
	}
	decode() {
		for (const [enc, [tag, size]] of Steptext.encodings.entries()) {
			if (this.textQueue.match(new RegExp('^' + enc))) {
				if (this.close.length && this.close[0].match(/\w+/)[0] === tag) {
					this.close.shift()  // Remove closing tag
				} else {
					const targetElement = document.createElement(tag)
					this.getInnermostChild().appendChild(targetElement)
					this.close.unshift(`</${tag}>`)  // Add closing tag to handle nesting
				}

				this.textQueue = this.textQueue.slice(size)
				return true
			}
		}
		return false
	}
	htmlOpen() {
		const match = this.textQueue.match(/^(<(\w+)(?: ([^>]+?))?>)[\s\S]+?<\/\2>/)
		if (!match) return false

		const tag = match[2]
		const attributes = match[3]

		const targetElement = document.createElement(tag)

		if (attributes)
			Array.from(attributes.match(/([^=\s'"]+)(?:="(.*?)")?/g))
				.map(m => m.match(/([^=\s'"]+)(?:="(.*?)")?/))
				.forEach(([_, att, val]) => targetElement.setAttribute(att, val))

		this.getInnermostChild().appendChild(targetElement)
		this.close.unshift(`</${tag}>`)

		this.textQueue = this.textQueue.slice(match[1].length)
		return true
	}
	htmlClose() {
		if (this.close.length && this.textQueue.startsWith(this.close[0])) {
			this.textQueue = this.textQueue.slice(this.close[0].length)
			this.close.shift()
			return true
		}
		return false
	}
	getInnermostChild() {
		// Get the innermost child by applying .lastElementChild as many times as there are tags in the close property:
		let target = this.targetElement
		for (let i = 0; i < this.close.length; i++) {
			target = target.lastElementChild
		}
		return target
	}
	skip() {
		while(this.textQueue.length > 0) this.place()
		this.targetElement.scrollTo({top: this.targetElement.scrollHeight})
	}
}