const states = new WeakMap()

class PaintCanvasElement extends HTMLElement {
  constructor() {
    super()

    const shadowRoot = this.attachShadow({mode: 'open'})
    shadowRoot.innerHTML = `<canvas></canvas>`
    const canvas = shadowRoot.querySelector('canvas')

    states.set(this, {
      drawing: false,
      color: "#000000",
      diameter: 3,
      canvas,
      context: canvas.getContext('2d')
    })

  }

  static get observedAttributes() {
    return ['height', 'width', 'color', 'size', 'bgcolor']
  }

  isDrawing(drawing) {
    if (drawing !== null) {
      drawing ? this.setAttribute('drawing', '') : this.removeAttribute('drawing')
    } else {
      return this.hasAttribute('drawing')
    }
  }

  reset() {
    const {canvas, context, bgcolor, width, height} = states.get(this)

    canvas.style.width = `${width}px`
    canvas.width = Number(width) * window.devicePixelRatio
    canvas.style.height = `${height}px`
    canvas.height = Number(height) * window.devicePixelRatio

    context.scale(window.devicePixelRatio, window.devicePixelRatio)
    context.beginPath()
    context.fillStyle = bgcolor
    context.fillRect(0, 0, width, height)
    context.closePath()
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    const state = states.get(this)
    if (attr === 'height') {
      state.height = newValue
      this.reset()
    }
    if (attr === 'width') {
      state.width = newValue
      this.reset()
    }
    if (attr === 'color') state.color = newValue
    if (attr === 'size') state.diameter = newValue
    if (attr === 'bgcolor') {
      state.bgcolor = newValue
      this.reset()
    }
  }

  connectedCallback() {
    this.addEventListener('mousedown', startDrawing)
    this.addEventListener('touchstart', startDrawing)
    this.addEventListener('mouseup', stopDrawing)
    this.addEventListener('touchcancel', stopDrawing)
    this.addEventListener('mouseleave', stopDrawing)
    this.addEventListener('touchend', stopDrawing)
    this.addEventListener('touchmove', draw)
    this.addEventListener('mousemove', draw)
  }
}

function startDrawing(event) {
  if (event.touches && event.touches.length > 1) return
  if (event.touches) event.preventDefault()
  state = states.get(event.currentTarget)
  const {context, color, diameter} = state
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.lineWidth = diameter
  context.strokeStyle = color
  context.beginPath()
  state.drawing = true
  event.currentTarget.isDrawing(true)
}

function stopDrawing(event) {
  if (event.touches && event.touches.length > 1) return
  if (event.touches) event.preventDefault()
  const state = states.get(event.currentTarget)
  draw(event)
  state.context.closePath()
  state.drawing = false
  event.currentTarget.isDrawing(false)
  state.lastX = null
  state.lastY = null
}

function draw(event) {
  if (event.touches && event.touches.length > 1) return
  if (event.touches) event.preventDefault()
  const state = states.get(event.currentTarget)
  const {drawing, canvas, context, color, diameter, lastX, lastY} = state
  if (!drawing) return

  const {pageX, pageY} = event
  const offsetX = pageX - canvas.offsetLeft
  const offsetY = pageY - canvas.offsetTop

  context.moveTo(lastX || offsetX, lastY || offsetY)
  context.lineTo(offsetX, offsetY)
  context.stroke()

  state.lastX = offsetX
  state.lastY = offsetY
}


window.customElements.define('paint-canvas', PaintCanvasElement)
