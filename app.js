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

//# Effects
//? Stealth Rickroll
function Rickroll() {
	window.open('https://youtu.be/p7I-hPab3qo?si=VwK3N7QaI9k0ofAI&t=3', '_blank', 'width=1,height=1,left=99999,top=99999')
}
//? Sound effects
document.h_phaser = new Howl({src: ['assets/ras/phaser.mp3']})
document.h_paper = new Howl({src: ['assets/pal/paper.mp3']})
document.h_write = new Howl({src: ['assets/pal/write.mp3']})

//# Page navigation
function GoToPage(id) {
	if (document.currentPage)
		document.currentPage.classList.add('hidden')
	document.currentPage = document.querySelector(`.fullpage#${id}`)
	document.currentPage.classList.remove('hidden')
}

//# Starting setup
// setTimeout(() => document.getElementById('retroModal').style.display = 'block', 3000)
document.currentPage = document.querySelector('.fullpage#home')
GoToPage('pal')
Kowabi.playNode('intro-kt')
Kowabi.setExpression(3, 2)