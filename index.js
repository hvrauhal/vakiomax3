$(function () {
  moment.locale('fi-FI')
  $('#loggedIn').hide()
  $('#loginForm').submit(function (e) {
    e.preventDefault()
    var username = $('[name=username]').val()
    var password = $('[name=password]').val()
    jsonAjax('POST', "https://www.veikkaus.fi/api/v1/sessions", {
      type: "STANDARD_LOGIN",
      login: username,
      password: password
    }, 'POST').done(function (r) {
      $('#loginForm').hide()
      $('#loggedIn').show()
      $('#banner').empty().append($('<span>').text('Logged in ' + r.firstName + ' ' + r.lastName))
      jsonAjax('GET', "https://www.veikkaus.fi/api/v1/sport-games/draws?game-names=SPORT")
        .done(function (r) {
          var draws = r.draws;
          console.log('SPORT GAMES all draws', draws)
          var openDraws = draws.filter(function (draw) {
            return draw.status === 'OPEN'
          });
          console.log('SPORT GAMES open draws', openDraws)
          $('#postRows').show()
          $('#gameIdSelect').show().empty().append(openDraws.map(drawToOption))
        })
    })
  })
  $('#checkRows').click(function () {
    readAndSendRows('https://www.veikkaus.fi/api/v1/sport-games/wagers/check')
  })
  $('#payRows').click(function () {
    readAndSendRows('https://www.veikkaus.fi/api/v1/sport-games/wagers')
  })
  function drawToOption(draw) {
    return $('<option>').val(draw.id).data('basePrice', draw.gameRuleSet.basePrice).text(draw.name + ' (sulkeutuu ' + moment(draw.closeTime).format("l LT"))
  }
  function readAndSendRows(url) {
    var $gameIdSelect = $('#gameIdSelect');
    var gameId = $gameIdSelect.val()
    var basePrice = $gameIdSelect.find('option[value="' + gameId + '"]').data('basePrice')
    console.log('GameID', gameId, 'BasePrice', basePrice)
    var coupons = couponRowsToWagerRequests($('#rowsArea').val(), gameId, basePrice)
    var couponsInGroupsOf25 = _(coupons).groupBy(function (v, i) {
      return Math.floor(i / 25)
    }).values().value()
    var i = 1;
    sendBatch(url)

    function sendBatch(url) {
      var $results = $('#results')
      if (couponsInGroupsOf25.length === 0) {
        $results.append($('<div>').text('All sent'))
        $('#payRows').prop('disabled', false)
      } else {
        var thisBatch = couponsInGroupsOf25.shift()
        $results.append($('<div>').text('Checking...' + i++))
        jsonAjax('POST', url, thisBatch)
          .done(function (res) {
            var errors = res.filter(function (row) {
              return row.error || (row.status === "REJECTED")
            })
            if (errors.length > 0) {
              $results.append($('<div>').text('Rejected:' + JSON.stringify(errors)))
            } else {
              sendBatch(url)
            }
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
            $results.append($('<div>').text('Errors: ' + JSON.stringify({j: jqXHR.responseJSON, t: textStatus, e: errorThrown})))
          })
      }
    }
  }

  function jsonAjax(type, url, data) {
    return $.ajax({
      type: type,
      url: url,
      data: data ? JSON.stringify(data) : undefined,
      contentType: 'application/json',
      dataType: 'json',
      headers: { 'X-ESA-API-Key': 'ROBOT'}
    })
  }
})