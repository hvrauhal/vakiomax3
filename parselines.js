#!/usr/bin/env node
var fs = require('fs'), _ = require('lodash')

if(require.main === module) {
  if (process.argv.length < 3) {
    console.error('Provide filename as the argument!')
    process.exit(1)
  }
  var filename = process.argv[2]
  console.log(JSON.stringify(parseLines(filename), null, 2))
}

exports.parseLines = parseLines

function parseLines(fileName) {
  var inFile = fs.readFileSync(fileName, 'utf8')

  var splitRows = _(inFile.split(/[\r\n]/))
  var allSportWagerRequestObjs = splitRows
    .filter(notEmpty)
    .map(cleanUpRowString)
    .map(rowToOutcomes)
    .map(outComesToSelections)
    .map(selectionsToSportWagerRequestObj)
    .value()

  return allSportWagerRequestObjs

  function selectionsToSportWagerRequestObj(selections) {
    return {
      "type": "NORMAL",
      "drawId": "51580",
      "gameName": "SPORT",
      "selections": selections,
      "stake": 25
    }
  }

  function outComesToSelections(oc) {
    return [
      {systemBetType: 'SYSTEM', outcomes: oc}
    ]
  }

  function notEmpty(r) {
    return !_.isEmpty(r)
  }

  function cleanUpRowString(r) {
    return r.replace(/[^1xX2]/g, '').toLowerCase()
  }

  function rowToOutcomes(r) {
    return r.split("").map(charToSelection)
  }

  function charToSelection(c) {
    switch (c) {
      case '1':
        return {
          "home": {
            "selected": true
          }
        }
      case 'x':
        return {
          "tie": {
            "selected": true
          }
        }
      case '2':
        return {
          "away": {
            "selected": true
          }
        }
      default:
        throw new Error('Unknown char')
    }
  }
}