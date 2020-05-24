class ColourChanger {
  /**
   *
   * @param {HTMLCanvasElement} canvas
   * @param {string} imageUrl
   * @param {string[]} [colours=[]]
   * @param {number} [zoom=1]
   * @param {boolean} [cellView=false]
   * @param {number[]} [cellSize=[32,32]]
   * @param {number} [cellNumber=0]
   */
  constructor (
    canvas,
    imageUrl, {
      colours = [],
      zoom = 1,
      cellView = false,
      cellSize = [32, 32],
      cellNumber = 0
  }) {
    this.ctx = canvas.getContext('2d')
    this.image = new Image()
    this.image.src = imageUrl
    this.colours = colours.map(ColourChanger.hexToHSV)
    this.zoom = zoom
    this.cellView = cellView
    this.cellSize = cellSize
    this.cellNumber = cellNumber
    this.imageData = []
    
    this.image.addEventListener('load', this.processImage.bind(this))
  }
  
  static hexToRGBA (hex) {
    if (typeof hex !== 'string') { return [0, 0, 0, 255] }
  
    const string = hex.replace('#','').replace(/[^0-9a-f]/g, '0')
    let formattedString = ''
  
    switch (string.length) {
      case 3:
        for (let i = 0; i < 3; i++) { formattedString += string[i].repeat(2) }
        formattedString += 'ff'
        break
      case 6:
        formattedString = string + 'ff'
        break
      case 8:
        formattedString = string
        break
      default:
        formattedString = '000000ff'
        break
    }
  
    const values = [0, 0, 0, 255]
    for (let i = 0; i < 4; i++) {
      values[i] =
        parseInt(formattedString.slice( i * 2, ( i + 1 ) * 2 ), 16) || values[i]
    }
  
    return values
  }
  static RGBAToHex (rgba) {
    return '#' + rgba.map(v => v.toString(16)).join('')
  }
  /**
   * Convert RGB (0-255 each) to HSV (0-360, 0-100, 0-100)
   * @param {number[]} rgb array containing value of each color
   * @returns {number[]} array containing hue, saturation, and value
   *
   * @link https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB
   * @link http://kourbatov.com/faq/rgb2hsv.htm
   */
  static RGBToHSV (rgb) {
    // convert value range from [0-255] to [0-1]
    const [R,G,B] = rgb.map(v => v / 255)
    // maximum component (value)
    const Xmax = Math.max(R,G,B), V = Xmax
    // minimum component
    const Xmin = Math.min(R,G,B)
    // range (chroma)
    const C = Xmax - Xmin
    // non-chromatic
    if (C === 0) { return [0, 0, V] }
  
    // mid-range (lightness)
    const L = V - C / 2
    // common hue
    let H = 60
    switch (V) {
      case R: H *= (G-B)/C; break
      case G: H *= 2 + (B-R)/C; break
      case B: H *= 4 + (R-G)/C; break
    }
    if (H < 0) { H += 360 }
    if (H > 360) { H %= 360 }
    // saturation
    const S = C / V
  
    // convert range from [0-360, 0-1, 0-1] to [0-360, 0-100, 0-100] rounded
    return [H, 100 * S, 100 * V].map(Math.round)
  }
  /**
   * Convert HSV (0-360, 0-100, 0-100) to RGB (0-255 each)
   * @param {number[]} hsv array containing hue, saturation, and value
   * @returns {number[]} array containing value of each color
   *
   * @link https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
   * @link https://www.desmos.com/calculator/jhx7p5idov
   */
  static HSVToRGB (hsv) {
    // convert value range of saturation and value
    // from [0-100] to [0-1]
    const H = hsv[0]
    const S = hsv[1] / 100
    const V = hsv[2] / 100
    // chroma
    const C = V * S
    // intermediate values for the second largest component of the color
    const Hquantized = H / 60
    const X = C * ( 1 - Math.abs( Hquantized % 2 - 1 ) )
    let R = 0, G = 0, B = 0
    // set base rgb value
    if (Hquantized >= 0 && Hquantized <= 2) {
      if (Hquantized <= 1) { R = C; G = X } else { R = X; G = C }
    } else if (Hquantized > 2 && Hquantized <= 4) {
      if (Hquantized <= 3) { G = C; B = X } else { G = X; B = C }
    } else if (Hquantized > 4 && Hquantized <= 6) {
      if (Hquantized <= 5) { B = C; R = X } else { B = X; R = C }
    }
    // value matching variable
    const m = V - C;
  
    // convert range from [0-1] to [0-255]
    return [R,G,B].map(v => Math.round( 255 * (v + m) ))
  }
  static hexToHSV (hex) {
    return ColourChanger.RGBToHSV(ColourChanger.hexToRGBA(hex))
  }
  static HSVToHex (hsv) {
    return ColourChanger.RGBAToHex(ColourChanger.HSVToRGB(hsv))
  }
  
  processImage () {
    this.drawFromImage()
    if (!this.cellView) {
      this.imageData = this.getImageDataFromEachCell()
    }
  }
  
  getImageDataFromEachCell () {
    const imgWidth = this.image.width
    const cellWidth = this.cellSize[0]
    
    for (let i=0; i*cellWidth<imgWidth; i++) {
      this.imageData[i] = this.getImageDataFromCell(i)
    }
    
    return this.imageData
  }
  getImageDataFromCell (cellNumber = this.cellNumber, cellSize = this.cellSize) {
    const cellWidth = cellSize[0]
    const cellHeight = cellSize[1]
    return this.ctx.getImageData(cellNumber * cellWidth, 0, cellWidth, cellHeight)
  }
  importImageData (imageDataRef) {
    for (let i = 0; i < imageDataRef.length; i++) {
      this.imageData[i] = imageDataRef[i]
    }
  }
  
  clear () {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }
  
  drawFromImage () {
    if (this.cellView) {
      this.drawOneCellFromImage(this.cellNumber)
    } else {
      this.ctx.drawImage(this.image, 0, 0)
    }
  }
  
  drawOneCellFromImage (
    cellNumber = this.cellNumber, zoom = this.zoom, cellSize = this.cellSize
  ) {
    const [cellWidth, cellHeight] = cellSize
    
    // draw the cell in the original size
    this.ctx.drawImage(
      this.image,
      cellWidth * cellNumber, 0,
      ...cellSize,
      0, 0,
      ...cellSize
    )
    if (this.zoom <= 1) { return }
    
    // get the imageData and erase the cell from the canvas
    const imageData = this.ctx.getImageData(0, 0, ...cellSize)
    this.ctx.clearRect(0, 0, ...cellSize)
    
    // draw the cell zoomed
    this.ctx.save()
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const dataIndex = ( y * imageData.width + x ) * 4
        this.ctx.fillStyle =
          'rgba(' +
          imageData.data[dataIndex] + ',' +
          imageData.data[dataIndex+1] + ',' +
          imageData.data[dataIndex+2] + ',' +
          imageData.data[dataIndex+3] +
          ')'
        this.ctx.fillRect(x * zoom, y * zoom, zoom, zoom)
      }
    }
    this.ctx.restore()    
  }
  
  drawEachCell (
    imageData = this.imageData, zoom = this.zoom
  ) {
    this.clear()
    let x = 0
    for (let i = 0; i < imageData.length; i++) {
      this.drawOneCell(i, imageData, zoom, x)
      x += imageData[i].width * zoom
    }
  }
  drawOneCell (
    cellNumber = this.cellNumber, imageData = this.imageData, zoom = this.zoom, canvasX = 0
  ) {
    const cellImageData = imageData[cellNumber] || imageData[0]
    if (!this.image.complete) {
      // image is not yet loaded
      return
    }
    if (!imageData[cellNumber]) {
      console.warn('tried locating unexisting imageData')
      return
    }
    if (zoom <= 1) {
      this.ctx.putImageData(cellImageData, canvasX, 0)
    } else {
      this.ctx.clearRect(
        canvasX, 0, cellImageData.width * zoom, cellImageData.height * zoom
      )
      this.ctx.save()
      for (let y = 0; y < cellImageData.height; y++) {
        for (let x = 0; x < cellImageData.width; x++) {
          const dataIndex = ( y * cellImageData.width + x ) * 4
          this.ctx.fillStyle =
            'rgba(' +
            cellImageData.data[dataIndex] + ',' +
            cellImageData.data[dataIndex+1] + ',' +
            cellImageData.data[dataIndex+2] + ',' +
            cellImageData.data[dataIndex+3] +
            ')'
          this.ctx.fillRect(canvasX + x * zoom, y * zoom, zoom, zoom)
        }
      }
      this.ctx.restore()
    }
  }
}
