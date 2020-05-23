class ColourChanger {
  /**
   *
   * @param {HTMLCanvasElement} canvas
   * @param {string} imageUrl
   * @param {string[]} [colours=[]]
   * @param {number} [zoom=1]
   * @param {boolean} [cellView=false]
   * @param {number[]} [cellSize=[32,32]]
   */
  constructor (
    canvas,
    imageUrl, {
      colours = [],
      zoom = 1,
      cellView = false,
      cellSize = [32, 32]
  }) {
    this.ctx = canvas.getContext('2d')
    this.image = new Image()
    this.image.src = imageUrl
    this.colours = colours
    this.zoom = zoom
    this.cellView = cellView
    this.cellSize = cellSize
    this.cellNumber = 0
    this.imageData = []
    
    this.image.addEventListener('load', this.processImage.bind(this))
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
      console.error('tried locating unexisting imageData')
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
