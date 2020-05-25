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
    this.lastUsedConversionColor = [0, 0, 0]
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
  
  static getPixelData (x, y, imageData) {
    if (!imageData) {return false}
    const width = imageData.width
    const index = ( y * width + x ) * 4
    
    return [
      imageData.data[index],
      imageData.data[index+1],
      imageData.data[index+2],
      imageData.data[index+3],
      ColourChanger.RGBAToHex([
        imageData.data[index],
        imageData.data[index+1],
        imageData.data[index+2]
      ])
    ]
  }
  
  // methods to make things from an image
  
  processImage () {
    this.drawFromImage()
    if (!this.cellView) {
      this.imageData = this.getImageDataFromEachCell()
    }
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
  getImageDataFromEachCell () {
    const imgWidth = this.image.width
    const cellWidth = this.cellSize[0]
    const imageData = []
    
    for (let i=0; i*cellWidth<imgWidth; i++) {
      imageData[i] = this.getImageDataFromCell(i)
    }
    
    return imageData
  }
  getImageDataFromCell (cellNumber = this.cellNumber, cellSize = this.cellSize) {
    const cellWidth = cellSize[0]
    const cellHeight = cellSize[1]
    return this.ctx.getImageData(cellNumber * cellWidth, 0, cellWidth, cellHeight)
  }
  
  // methods to prepare resource for colour conversion
  
  saveConvertedColours (
    hsv, originalColours = this.colours, mainColour = this.colours[0]
  ) {
    // copy the colours
    const colours = Array(originalColours.length)
    for (let i = 0; i < originalColours.length; i++) {
      colours[i] = Array.from(originalColours[i])
    }
    // define main colour
    const main = { h: mainColour[0], s: mainColour[1], v: mainColour[2] }
    // define difference
    const difference = {
      h: hsv[0] - main.h,
      s: hsv[1] / main.s,
      v: hsv[2] / main.v
    }
    // apply difference to every colours
    for (let i = 0; i < colours.length; i++) {
      const colour = colours[i]
      
      colour[0] += difference.h
      colour[1] *= difference.s
      colour[2] *= difference.v
      
      // keep them in the ranges
      for (let a = 0; a < 3; a++) {
        if (a === 0) {
          // hue overwraps
          if (colour[a] < 0) { colour[a] += 360 }
          if (colour[a] > 360) { colour[a] %= 360 }
          continue
        }
        // saturation and value
        if (colour[a] < 0) { colour[a] = 0 }
        if (colour[a] > 100) { colour[a] = 100 }
      }
    }
    
    this.lastUsedConversionColor = hsv
    this.convertedColours = colours
  }
  getConvertedColourForPixel (
    hsv, dataInRGB,
    originalColours = this.colours,
    convertedColours = this.convertedColours,
    mainColour = this.colours[0]
  ) {
    if (!this.isThisTheLastUsedConversionColor(hsv)) {
      this.saveConvertedColours(hsv, originalColours, mainColour)
      convertedColours = this.convertedColours
    }
    let dataInHSV = ColourChanger.RGBToHSV(dataInRGB)
    let foundColourIndex = -1
    
    for (let i = 0; i < originalColours.length; i++) {
      const originalColour = originalColours[i]
      if (
        dataInHSV[0] === originalColour[0] &&
        dataInHSV[1] === originalColour[1] &&
        dataInHSV[2] === originalColour[2]
      ) {
        foundColourIndex = i
        break
      }
    }
    
    if (foundColourIndex === -1) { return dataInRGB }
    
    return ColourChanger.HSVToRGB(convertedColours[foundColourIndex])
  }
  isThisTheLastUsedConversionColor (hsv) {
    return hsv.every((v, i) => v === this.lastUsedConversionColor[i])
  }
  copyImageData () {
    // deep copy the stored imageData to make a change on
    const imageDataCopy = []
    for (let i = 0; i < this.imageData.length; i++) {
      imageDataCopy[i] = this.copyImageDataOfOneCell(i)
    }
    return imageDataCopy
  }
  copyImageDataOfOneCell (cellNumber = this.cellNumber) {
    if (!this.imageData[cellNumber]) {
      return false
    }
    const cellCopy = this.ctx.createImageData(this.imageData[cellNumber])
    cellCopy.data.set(this.imageData[cellNumber].data)
    
    return cellCopy
  }
  
  // methods to make converted image data
  
  getConvertedImageData (hsv) {
    const imageData = []
    
    for (let c = 0; c < imageData.length; c++) {
      // for each cell in imageData array
      imageData[c] = this.getConvertedImageDataCell(hsv, c)
    }
    
    return imageData
  }
  getConvertedImageDataCell (
    hsv,
    cellNumber = this.cellNumber
  ) {
    const imageDataCell = this.copyImageDataOfOneCell(cellNumber)
    if (!imageDataCell) {
      return false
    }
  
    for (let i = 0; i < imageDataCell.data.length; i += 4) {
      // don't process for transparent pixel
      if (imageDataCell.data[i + 3] === 0) { continue }
      
      [
        imageDataCell.data[i],
        imageDataCell.data[i + 1],
        imageDataCell.data[i + 2]
      ] = this.getConvertedColourForPixel(
        hsv, [
          imageDataCell.data[i],
          imageDataCell.data[i + 1],
          imageDataCell.data[i + 2]
        ]
      )
    }
    
    return imageDataCell
  }
  
  clear () {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }
  drawEachCell (
    hsv = this.lastUsedConversionColor,
    imageData = this.imageData, zoom = this.zoom
  ) {
    this.clear()
    let x = 0
    for (let i = 0; i < imageData.length; i++) {
      this.drawOneCell(hsv, i, imageData, zoom, x)
      x += imageData[i].width * zoom
    }
  }
  drawOneCell (
    hsv = this.lastUsedConversionColor, cellNumber = this.cellNumber,
    imageData = this.imageData, zoom = this.zoom,
    canvasX = 0
  ) {
    const cellImageData = hsv ?
      this.getConvertedImageDataCell(hsv, cellNumber) :
      imageData[cellNumber] || imageData[0]
    if (!this.image.complete) {
      console.warn('image is not yet loaded')
      return
    }
    if (!cellImageData) {
      console.warn('tried locating not existing imageData')
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
          
          // don't draw if the pixel is transparent
          if (cellImageData.data[dataIndex+3] === 0) { continue }
          
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
