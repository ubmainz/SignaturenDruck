const _ = require('lodash')
const fs = require('fs')
const { ipcRenderer, remote } = require('electron')
const config = remote.getGlobal('config')
const formats = require('./Formats')
const modes = require('./Modes')
const printers = require('./Printers')
const preview = require('./Preview')
const manualSignature = require('./ManualSignatures')
const jsonfile = require('./JsonFile')
const downloadfile = require('./DownloadFile')
const swal = require('sweetalert2')

class Table {
  /*
 ----- Class getter and setter -----
  */
  get manualSignature () {
    return this._manualSignature.signatures
  }

  set manualSignature (value) {
    this._manualSignature.signatures = value
  }
  get formats () {
    return this._formats
  }

  set formats (value) {
    this._formats = value
  }
  /*
 ----- End Class getter and setter -----
  */

  /*
  ----- Constructor -----
   */
  constructor (file) {
    this.tableHtml = document.getElementById('shelfmarkTable')
    this.tableHtmlBody = document.getElementById('shelfmarkTableBody')
    this.tableHtmlManual = document.getElementsByClassName('manual')
    this.format = new formats()
    this.mode = new modes()
    this.selectOptions = this.format.selectOptions
    this._formats = this.format.formats
    this._modes = this.mode.modes
    this.printers = new printers(this._formats)
    this.preview = new preview()
    this.file = new jsonfile(file)
    this._manualSignature = new manualSignature()
  }
  /*
  ----- End Constructor -----
   */

  /*
  ----- Table Part -----
   */

  createMainTable (obj) {
    let body = this.tableHtml.getElementsByTagName('tbody')[0]
    let i = 0
    if (config.get('sortByPPN')) {
      _.forEach(obj, (key, value) => {
        let row = body.insertRow(i)
        row.className = 'ppnRow'
        Table.createPpnRow(row, value)
        _.forEach(key, (object) => {
          i++
          row = body.insertRow(i)
          row.id = object.PPN + '-0'
          this.createTxtCell(row, 0, object.id, object.txtOneLine, object.defaultSubMode)
          this.createDateCell(row, 1, object.id, object.date, object.defaultSubMode)
          this.createExnrCell(row, 2, object.id, object.exNr, object.defaultSubMode)
          this.createShortShelfmarkCell(row, 3, object.id, object.defaultSubMode)
          this.createPrintCell(row, 4, object.id, object.defaultSubMode, object)
          Table.createPrintCountCell(row, 5, object.id, object.defaultSubMode)
          this.createLabelSizeCell(row, 6, object.id, object.defaultSubMode, this._modes[config.get('mode.defaultMode')].subModes, object.modes)
        })
        i++
      })
    } else {
      let i = 0
      _.forEach(obj, (key) => {
        let current = document.getElementById(key.PPN)
        let row
        if (current) {
          let i = 0
          while (document.getElementById(key.PPN + '-' + i)) {
            i++
          }
          row = document.createElement('tr')
          row.id = key.PPN + '-' + i
          if (i === 0) {
            current = document.getElementById(key.PPN)
          } else {
            current = document.getElementById(key.PPN + '-' + (i - 1))
          }

          current.parentNode.insertBefore(row, current.nextSibling)
        } else {
          row = body.insertRow(i)
          row.className = 'ppnRow'
          Table.createPpnRow(row, key.PPN)
          i++
          row = body.insertRow(i)
          row.id = key.PPN + '-0'
        }
        this.createTxtCell(row, 0, key.id, key.txtOneLine, key.defaultSubMode)
        this.createDateCell(row, 1, key.id, key.date, key.defaultSubMode)
        this.createExnrCell(row, 2, key.id, key.exNr, key.defaultSubMode)
        this.createShortShelfmarkCell(row, 3, key.id, key.defaultSubMode, key)
        this.createPrintCell(row, 4, key.id, key.defaultSubMode)
        Table.createPrintCountCell(row, 5, key.id, key.defaultSubMode)
        this.createLabelSizeCell(row, 6, key.id, key.defaultSubMode, this._modes[config.get('mode.defaultMode')].subModes, key.modes)
        i++
      })
    }
  }

  static createPpnRow (row, value) {
    let i = 0
    row.id = value
    Table.createCell(row, i, 'ppnCell', value)
    i++
    Table.createCell(row, i, 'dateCell')
    i++
    Table.createCell(row, i, 'isNrCell')
    i++
    Table.createCell(row, i, 'shortShelfmarkCell')
    i++
    Table.createCell(row, i, 'printCell')
    i++
    Table.createCell(row, i, 'printCountCell')
    i++
    Table.createCell(row, i, 'labelSizeCell')
  }

  static createCell (row, i, className, value) {
    let cell = row.insertCell(i)
    if (i === 0) {
      cell.innerHTML = value
    } else {
      cell.innerHTML = '<hr>'
      cell.className = className
    }
  }

  createTxtCell (row, cellNr, id, txt, defaultSubMode) {
    let txtCell = row.insertCell(cellNr)
    if (defaultSubMode !== '') {
      txtCell.onclick = () => this.preview.changePreview(id, this.file.file, this._formats, this.manualSignature)
    }
    if (!id.toString().includes('m_')) {
      txtCell.ondblclick = () => this.pushToManual(id)
    }
    txtCell.id = 'shelfmark_' + id
    txtCell.innerHTML = txt
    txtCell.className = 'txtCell'
  }

  createDateCell (row, cellNr, id, date = '-', defaultSubMode) {
    let dateCell = row.insertCell(cellNr)
    if (defaultSubMode !== '') {
      dateCell.onclick = () => this.preview.changePreview(id, this.file.file, this._formats, this.manualSignature)
    }
    dateCell.className = 'dateCell'
    dateCell.id = 'dateCell_' + id
    dateCell.innerHTML = date
  }

  createExnrCell (row, cellNr, id, exNr = '-', defaultSubMode) {
    let isNrCell = row.insertCell(cellNr)
    if (defaultSubMode !== '') {
      isNrCell.onclick = () => this.preview.changePreview(id, this.file.file, this._formats, this.manualSignature)
    }
    isNrCell.className = 'isNrCell'
    isNrCell.innerHTML = exNr
  }

  createShortShelfmarkCell (row, cellNr, id, subMode, object) {
    let shortShelfmarkCell = row.insertCell(cellNr)
    shortShelfmarkCell.className = 'shortShelfmarkCell'
    if (config.get('mode.defaultMode') === 'thulbMode') {
      if (!String(id).includes('m_')) {
        if (subMode !== 0 && object.modes[1].lines !== null && object.modes[2].lines !== null) {        
          let input = document.createElement('input')
          input.id = 'short_' + id
          input.type = 'checkbox'
          input.name = 'shortShelfmark'
          input.value = id
          input.onclick = () => {
            Table.changeDropdownFormat(id)
            this.preview.changePreview(id, this.file.file, this._formats, this.manualSignature)
          }
          shortShelfmarkCell.appendChild(input)
        } else {
          shortShelfmarkCell.onclick = () => this.preview.changePreview(id, this.file.file, this._formats, this.manualSignature)
        }
      } else {
        shortShelfmarkCell.onclick = () => this.preview.changePreview(id, this.file.file, this._formats, this.manualSignature)
      }
    } else {
      if (subMode !== '') {
        shortShelfmarkCell.onclick = () => this.preview.changePreview(id, this.file.file, this._formats, this.manualSignature)
      }
    }
  }

  createPrintCell (row, cellNr, id, defaultSubMode) {
    let printCell = row.insertCell(cellNr)
    printCell.className = 'printCell'
    if (defaultSubMode !== '') {
      let input = document.createElement('input')
      input.id = 'print_' + id
      input.type = 'checkbox'
      input.name = 'toPrint'
      input.value = id
      input.checked = 'checked'
      input.onclick = () => this.preview.changePreview(id, this.file.file, this._formats, this.manualSignature)
      printCell.appendChild(input)
    }
  }

  static createPrintCountCell (row, cellNr, id, defaultSubMode) {
    let printCountCell = row.insertCell(cellNr)
    printCountCell.className = 'printCountCell'
    if (defaultSubMode !== '') {
      let input = document.createElement('input')
      input.id = 'count_' + id
      input.className = 'input'
      input.type = 'number'
      input.max = 99
      input.min = 1
      input.name = 'printCount'
      input.value = 1
      printCountCell.appendChild(input)
    }
  }

  createLabelSizeCell (row, cellNr, id, defaultSubMode, subModes, modes) {
    if (defaultSubMode === '') {
      let cell = row.insertCell(cellNr)
      let div = document.createElement('div')
      let p = document.createElement('p')
      p.innerHTML = 'kein Format'
      div.appendChild(p)
      cell.appendChild(div)
    } else {
      let cell = row.insertCell(cellNr)
      let div = document.createElement('div')
      div.className = 'select'
      let select = document.createElement('select')
      select.id = 'templateSelect_' + id
      this.selectOptions.forEach(element => {
        let size = document.createElement('option')
        size.value = element
        size.innerHTML = element
        let data = _.find(modes, { 'format': element })
        if (!this.printers.printers[element] || data === undefined || (data.lines === null)) {
          size.disabled = true
        }
        select.appendChild(size)
      })
      select.onchange = () => this.preview.changePreview(id, this.file.file, this._formats, this.manualSignature)
      if (subModes[defaultSubMode].format !== '') {
        select.value = subModes[defaultSubMode].format
      }
      div.appendChild(select)
      cell.appendChild(div)
    }
  }

  clearMainTable () {
    while (this.tableHtmlBody.firstChild) {
      this.tableHtmlBody.removeChild(this.tableHtmlBody.firstChild)
    }
  }

  displayMainTable () {
    if (document.getElementById('shelfmarkTable')) {
      this.clearMainTable()
    }
    if (config.get('sortByPPN')) {
      this.createMainTable(groupByPPN(JSON.parse(jsonfile.readFile(this.file.file))))
    } else {
      this.createMainTable(JSON.parse(jsonfile.readFile(this.file.file)))
    }
  }

  /*
 Dont really know if this in the correct place
  */
  static changeDropdownFormat (id) {
    if (document.getElementById('short_' + id).checked) {
      document.getElementById('templateSelect_' + id).value = 'thulb_klein'
    } else {
      document.getElementById('templateSelect_' + id).value = 'thulb_klein_1'
    }
  }

  pushToManual (id) {
    let shelfmark = _.find(JSON.parse(jsonfile.readFile(this.file.file)), { 'id': Number(id) })
    let manual = {}
    manual.defaultSubMode = 0
    manual.format = document.getElementById('templateSelect_' + id).value
    manual.id = this.manualSignature.length
    manual.modes = [
      {
        format: manual.format,
        lines: _.find(shelfmark.modes, { 'format': manual.format }).lines
      }
    ]
    manual.txtLength = manual.modes[0].lines.length
    manual.txtOneLine = shelfmark.txtOneLine
    this.manualSignature.push(manual)
    ipcRenderer.send('openManualSignaturesWindow', this.manualSignature, true)
  }

  /*
  ----- End Table Part -----
   */

  /*
  ----- File Part -----
   */
  readSRUData (object) {
    if (!fs.existsSync(this.file.file)) {
      jsonfile.createJsonFile(this.file.file)
      this.file.writeToJsonFile(object, this.format._formats, true)
      this.displayMainTable()
      return true
    } else {
      this.file.writeToJsonFile(object, this.format._formats, true)
      this.displayMainTable()
      return true
    }
  }

  readDownloadFile (path) {
    if (fs.existsSync(path)) {
      if (!fs.existsSync(this.file.file)) {
        jsonfile.createJsonFile(this.file.file)
        this.file.writeToJsonFile(fs.readFileSync(path, 'utf-8'), this.format._formats)
        this.displayMainTable()
        return true
      } else {
        this.file.writeToJsonFile(fs.readFileSync(path, 'utf-8'), this.format._formats)
        this.displayMainTable()
        return true
      }
    }
    return false
  }

  refreshDownloadFile () {
    this.preview.removeSignaturePreview()
    let currentFile = document.getElementById('defaultPath').innerHTML
    if (!this.readDownloadFile(currentFile)) {
      if (this.readDownloadFile(config.get('defaultDownloadPath'))) {
        document.getElementById('defaultPath').innerHTML = config.get('defaultDownloadPath')
      } else {
        document.getElementById('defaultPath').innerHTML = 'nicht vorhanden'
      }
    }
    if (this._manualSignature.checkManualSignatures()) this.addManualSignaturesToTable(this._manualSignature.signatures)
  }

  clearDownloadFile () {
    if (fs.existsSync(this.file.file)) {
      fs.unlink(this.file.file, (err) => {
        if (err) {
          throw err
        } else {
          this.clearMainTable()
          this.preview.removeSignaturePreview()
          this._manualSignature.signatures = []
          swal.fire('Achtung', 'Liste wurde gelöscht', 'info')
            .then(() => {})
        }
      })
    }
  }

  /*
  ----- End File Part -----
   */

  /*
  ----- Manual Signatures Table -----
   */

  addManualSignaturesToTable (obj) {
    let body = this.tableHtml.getElementsByTagName('tbody')[0]
    let row = body.insertRow(0)
    row.className = 'ppnRow manual'
    Table.createPpnRow(row, 'manuell')
    let i = 0
    while (obj[i] !== undefined) {
      row = body.insertRow(i + 1)
      row.className = 'manual'
      row.id = 'manual-' + obj[i].id
      this.createTxtCell(row, 0, ('m_' + obj[i].id), obj[i].txtOneLine, obj[i].defaultSubMode)
      this.createDateCell(row, 1, ('m_' + obj[i].id), obj[i].defaultSubMode)
      this.createExnrCell(row, 2, ('m_' + obj[i].id), obj[i].defaultSubMode)
      this.createShortShelfmarkCell(row, 3, ('m_' + obj[i].id), obj[i].size, obj[i])
      this.createPrintCell(row, 4, ('m_' + obj[i].id), obj[i].defaultSubMode)
      Table.createPrintCountCell(row, 5, ('m_' + obj[i].id), obj[i].defaultSubMode)
      this.createLabelSizeCell(row, 6, ('m_' + obj[i].id), obj[i].defaultSubMode, obj[i].modes, obj[i].modes)
      i++
    }
  }

  clearManualSignaturesTable () {
    while (this.tableHtmlManual.length > 0) {
      this.tableHtmlManual[0].parentNode.removeChild(this.tableHtmlManual[0])
    }
  }
  /*
  ----- End Manual Signatures Table -----
   */
}

/*
----- Private Area -----
 */
function groupByPPN (obj) {
  return _.groupBy(obj, 'PPN')
}
/*
----- End Private Area -----
 */

module.exports = Table
