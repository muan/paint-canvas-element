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

  get canvas() {
    return this.shadowRoot.querySelector('canvas')
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    const state = states.get(this)
    if (attr === 'height') {
      this.canvas.style.height = `${newValue}px`
      this.canvas.height = Number(newValue) * window.devicePixelRatio
      this.canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    if (attr === 'width') {
      this.canvas.style.width = `${newValue}px`
      this.canvas.width = Number(newValue) * window.devicePixelRatio
      this.canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    if (attr === 'color') state.color = newValue
    if (attr === 'size') state.diameter = newValue
    if (attr === 'bgcolor') {
      state.bgcolor = newValue
      const ctx = this.canvas.getContext('2d')
      ctx.beginPath()
      ctx.fillStyle = state.bgcolor
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      ctx.closePath()
    }
  }

  connectedCallback() {
    this.addEventListener('mousedown', startDrawing)
    this.addEventListener('mouseup', stopDrawing)
    this.addEventListener('mouseleave', stopDrawing)
    this.addEventListener('mousemove', draw)
  }
}

function startDrawing(event) {
  states.get(event.currentTarget).drawing = true
}

function stopDrawing(event) {
  const state = states.get(event.currentTarget)
  draw(event)
  state.drawing = false
  state.lastX = null
  state.lastY = null
}

function draw(event) {
  const state = states.get(event.currentTarget)
  const {drawing, color, diameter, lastX, lastY} = state
  if (!drawing) return

  const {offsetX, offsetY} = event
  const canvas = event.currentTarget.canvas
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = color

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
