class Steptext {
	static bipInterval = 3
	static bip = 0
	static last_step = 0
	static interval = 64
	static effective_interval
	static fast = false
	static queue = ''
	static close = []
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
	static element = null
	static timeout = null

	static get skipback() {
		return this.close.reduce((prv, cur) => prv + cur.length, 0)
	}
	static step(now=Date.now(), audio=false) {
		if (Steptext.queue.length > 0) {
			Steptext.place()
			Steptext.last_step += (Steptext.interval * (Steptext.fast? 1/3 : 1))
			Steptext.bip++
			if (audio && Steptext.bip % Steptext.bipInterval == 0) {
				if (Sounds && document.hasFocus() && !window.localStorage.getItem('tccOptionNoSound'))
					Sounds.bip.play()
				Steptext.bip %= Steptext.bipInterval
			}
			const do_scroll = Steptext.element.scrollTop >= Steptext.element.scrollHeight - Steptext.element.clientHeight - 200
			if (do_scroll)
				Steptext.element.scrollTo({top: Steptext.element.scrollHeight})
		}
		else
			Steptext.last_step = now
		Steptext.timeout = setTimeout(Steptext.step, Steptext.interval * (Steptext.fast? 1/3 : 1))
	}
	static place() {
		if (Steptext.queue.length == 0) return

		while (Steptext.decode() || Steptext.htmlOpen() || Steptext.htmlClose()) null
		if (Steptext.queue.length == 0) return

		// Handle newlines and line breaks:
		if (Steptext.queue.startsWith('\n') || Steptext.queue.startsWith('\r\n')) {
			// Create a line break element (br or a custom element if needed):
			Steptext.getInnermostChild().appendChild(document.createElement('br'))
			Steptext.queue = Steptext.queue.slice(Steptext.queue[0] === '\r' ? 2 : 1)
			return
		}
		if (Steptext.queue.startsWith('\\')) {
			Steptext.queue = Steptext.queue.slice(1)
			if (Steptext.queue.length)
				Steptext.getInnermostChild().appendChild(document.createTextNode(Steptext.queue[0]))
			return
		}

		// Handle regular text or individually wrapped characters:
		if (Steptext.close.length && Steptext.close.filter(e => Steptext.tagsWithWrappedChars.includes(e.match(/\w+/)[0])).length) {
			const span = document.createElement('span')
			const withSpaces = Steptext.queue.match(/^[^ ] */)
			if (withSpaces) {
				span.innerHTML = withSpaces[0].replaceAll(' ', '&nbsp;')
				Steptext.queue = Steptext.queue.slice(withSpaces[0].length-1)
			} else
				span.innerHTML = Steptext.queue[0]
			Steptext.getInnermostChild().appendChild(span)
		} else {
			if (Steptext.getInnermostChild()?.lastChild?.nodeType === 3) {
				Steptext.getInnermostChild().lastChild.textContent += Steptext.queue[0]
			} else {
				const textNode = document.createTextNode(Steptext.queue[0])
				Steptext.getInnermostChild().appendChild(textNode)
			}
		}

		Steptext.queue = Steptext.queue.slice(1)
	}
	static decode() {
		for (const [enc, [tag, size]] of Steptext.encodings.entries()) {
			if (Steptext.queue.match(new RegExp('^' + enc))) {
				if (Steptext.close.length && Steptext.close[0].match(/\w+/)[0] === tag) {
					Steptext.close.shift()  // Remove closing tag
				} else {
					const element = document.createElement(tag)
					Steptext.getInnermostChild().appendChild(element)
					Steptext.close.unshift(`</${tag}>`)  // Add closing tag to handle nesting
				}

				Steptext.queue = Steptext.queue.slice(size)
				return true
			}
		}
		return false
	}
	static htmlOpen() {
		const match = Steptext.queue.match(/^(<(\w+)(?: ([^>]+?))?>)[\s\S]+?<\/\2>/)
		if (!match) return false

		const tag = match[2]
		const attributes = match[3]

		const element = document.createElement(tag)

		if (attributes)
			Array.from(attributes.match(/([^=\s'"]+)(?:="(.*?)")?/g))
				.map(m => m.match(/([^=\s'"]+)(?:="(.*?)")?/))
				.forEach(([_, att, val]) => element.setAttribute(att, val))

		Steptext.getInnermostChild().appendChild(element)
		Steptext.close.unshift(`</${tag}>`)

		Steptext.queue = Steptext.queue.slice(match[1].length)
		return true
	}
	static htmlClose() {
		if (Steptext.close.length && Steptext.queue.startsWith(Steptext.close[0])) {
			Steptext.queue = Steptext.queue.slice(Steptext.close[0].length)
			Steptext.close.shift()
			return true
		}
		return false
	}
	static getInnermostChild() {
		// Get the innermost child by applying .lastElementChild as many times as there are tags in the close property:
		let target = Steptext.element
		for (let i = 0; i < Steptext.close.length; i++) {
			target = target.lastElementChild
		}
		return target
	}
	static skip() {
		while(Steptext.queue.length > 0) Steptext.place()
		Steptext.element.scrollTo({top: Steptext.element.scrollHeight})
	}
}