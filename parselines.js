#!/usr/bin/env node
var fs = require('fs'), _ = require('lodash')
var rows = fs.readFileSync(__dirname + '/rows.txt', 'utf8')

var splitRows = _(rows.split(/[\r\n]/))
var selectionsColl = splitRows.filter(function (r) {
  return !_.isEmpty(r)
}).map(function (r) {
  return r.replace(/[^1xX2]/g, '').toLowerCase()
})
  .map(function (r) {
    return r.split("").map(function (c) {
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
    })
  }).map(function(oc) {return {systemBetType: 'SYSTEM', outcomes: oc}}).value()

var req = selectionsColl.map(function(selections) {return {
  "type": "NORMAL",
  "drawId": "51580",
  "gameName": "SPORT",
  "selections": [selections],
  "stake": 25
}})


console.log(JSON.stringify(req, null, 2))
