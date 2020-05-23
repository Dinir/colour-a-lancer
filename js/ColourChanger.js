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
    
    this.image.onload = this.drawImage.bind(this)
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
  
  drawImage () {
    if (this.cellView) {
      this.drawOneCell(this.cellNumber)
    } else {
      this.ctx.drawImage(this.image, 0, 0)
    }
  }
  
  drawOneCell (
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
    for (let y = 0; y < cellHeight; y++) {
      for (let x = 0; x < cellWidth; x++) {
        const dataIndex = ( y * cellWidth + x ) * 4
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
}
