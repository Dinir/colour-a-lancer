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
  
  drawImage () {
    if (this.cellView) {
      this.drawOneCell(this.cellNumber)
    } else {
      this.ctx.drawImage(this.image, 0, 0)
    }
  }
  
  drawOneCell (cellNumber = 0) {
    this.ctx.drawImage(
      this.image,
      this.cellSize[0] * cellNumber, 0,
      ...this.cellSize,
      0, 0,
      ...this.cellSize
    )
  }
}
