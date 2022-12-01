const { remote } = require('electron')
const _ = require('lodash')
const Shelfmark = require('../shelfmark.js')
const Modes = require('./Modes.js')
const config = remote.getGlobal('config')
const Formats = require('../classes/Formats')
const FormatLinesByMode = require('../classes/FormatLinesByMode')
const LocationCheck = require('../classes/LocationCheck')

class ShelfmarksFromLBSData {
  /*
 ----- Class getter and setter -----
   */
  get data () {
    return this._data
  }

  /*
  ----- End Class getter and setter -----
   */

  /*
  ----- Constructor -----
   */
  constructor () {
    this._data = ''
  }
  /*
  ----- End Constructor -----
   */

  getShelfmark (xml, key, dataMode) {
    let sig = new Shelfmark()
    let mode = new Modes()
    let formats = new Formats()
    let formatArray = formats.formats
    sig.error = getError(xml, key, dataMode)

    if (sig.error === '') {
      let occ = '00'
      sig.id = 99 // gets overwritten at a later stage
      if (dataMode === 'PPN') {
        sig.ppn = xml
      } else {
        sig.ppn = xml
      }
      sig.date = '01-01-20'
      sig.txtOneLine = xml
      sig.exNr = ''
      sig.location = ''
      sig.loanIndication = ''
      let allSubModeData = mode.modes[config.get('mode.defaultMode')].subModes
      _.forEach(allSubModeData, function (value) {
        let data = {
          'format': '',
          'lines': ''
        }
        data.format = value.format
        if (config.get('filterByLoc') && !LocationCheck.locDoesMatch(value.locRegEx, sig.location)) {
          data.lines = null
        } else {
          if (value.useRegEx) {
            let regex = new RegExp(value.regEx)
            if (regex.test(sig.txtOneLine) && sig.defaultSubMode === '') {
              sig.defaultSubMode = value.id
            }
            let lines = sig.txtOneLine.match(regex)
            if (lines !== null) {
              lines.shift()
            }
            data.lines = lines
            if (data.lines !== null) {
              data.lines = FormatLinesByMode.formatLines(sig.location, data.lines, value.result)
            }
          } else {
            data.lines = sig.txtOneLine.split(value.delimiter)
            if (sig.defaultSubMode === '') {
              sig.defaultSubMode = value.id
            }
            if (data.lines !== null) {
              data.lines = FormatLinesByMode.formatLines(sig.location, data.lines, value.result, formatArray[value.format].lines)
            }
          }
        }
        sig.subModes.push(data)
      })
    }

    return sig.shelfmark
  }
}

function getError (object, key, mode) {
  try {
    if (object.length > 1) {
      return ''
    } else {
      return ': <b>' + key + '</b> wurde nicht gefunden.'
    }
  } catch (e) {
    return e.message
  }
}

module.exports = ShelfmarksFromLBSData
