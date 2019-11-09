const states = new WeakMap()

class PaintCanvasElement extends HTMLElement {
  constructor() {
    super()

    states.set(this, {
      drawing: false,
      color: "#000000",
      diameter: 3
    })

    const shadowRoot = this.attachShadow({mode: 'open'})
    shadowRoot.innerHTML = `<canvas></canvas>`
  }

  static get observedAttributes() {
    return ['height', 'width', 'color', 'size', 'bgcolor']
  }

  reset() {
    const {bgcolor, width, height} = states.get(this)

    this.canvas.style.width = `${width}px`
    this.canvas.width = Number(width) * window.devicePixelRatio
    this.canvas.style.height = `${height}px`
    this.canvas.height = Number(height) * window.devicePixelRatio

    const ctx = this.canvas.getContext('2d')
    this.canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.beginPath()
    ctx.fillStyle = bgcolor
    ctx.fillRect(0, 0, width, height)
    ctx.closePath()
  }

  get canvas() {
    return this.shadowRoot.querySelector('canvas')
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
  event.preventDefault()
  states.get(event.currentTarget).drawing = true
}

function stopDrawing(event) {
  event.preventDefault()
  const state = states.get(event.currentTarget)
  draw(event)
  state.drawing = false
  state.lastX = null
  state.lastY = null
}

function draw(event) {
  event.preventDefault()
  const state = states.get(event.currentTarget)
  const {drawing, color, diameter, lastX, lastY} = state
  if (!drawing) return

  const {pageX, pageY} = event
  const canvas = event.currentTarget.canvas
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = color
  const offsetX = pageX - canvas.offsetLeft
  const offsetY = pageY - canvas.offsetTop

  const points = createRange([offsetX, offsetY], [lastX || offsetX, lastY || offsetY])

  for (const pair of points) {
    const [x, y] = pair
    ctx.beginPath()
    ctx.arc(x, y, diameter, 0, 2 * Math.PI)
    ctx.fill  ()
    ctx.closePath()
  }
  state.lastX = offsetX
  state.lastY = offsetY
}

function createRange(endXY, startXY) {
  const points = [endXY]
  const [endX, endY] = endXY
  const [startX, startY] = startXY

  const xDiff = endX - startX
  const yDiff = endY - startY

  const diffBase = Math.abs(xDiff) > Math.abs(yDiff) ? 'x' : 'y'
  const diffScale = diffBase === 'y' ? Math.abs(xDiff) / Math.abs(yDiff) : Math.abs(yDiff) / Math.abs(xDiff)
  const diff = diffBase === 'x' ? Math.abs(xDiff) : Math.abs(yDiff)

  for (let i = 0, currentX = startX, currentY = startY; i <= diff; i++) {
    currentX = xDiff === 0 ? startX : currentX + (xDiff > 0 ? 1 : -1) * (diffBase === 'y' ? diffScale : 1)
    currentY = yDiff === 0 ? startY : currentY + (yDiff > 0 ? 1 : -1) * (diffBase === 'x' ? diffScale : 1)
    points.push([Math.round(currentX), Math.round(currentY)])
  }
  return points
}

window.customElements.define('paint-canvas', PaintCanvasElement)
