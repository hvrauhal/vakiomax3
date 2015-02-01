$(function () {
  moment.locale('fi-FI')
  $('#rowsArea').hide()
  $('#postRows').hide()
  $('#gameIdSelect').hide()
  $('#login').click(function () {
    var username = $('[name=username]').val()
    var password = $('[name=password]').val()
    jsonAjax('POST', "https://www.veikkaus.fi/api/v1/sessions", {
      type: "STANDARD_LOGIN",
      login: username,
      password: password
    }, 'POST').done(function (r) {
      $('#loginForm').hide()
      $('#rowsArea').show()
      $('#loggedIn').empty().append($('<span>').text('Logged in ' + r.firstName + ' ' + r.lastName))
      jsonAjax('GET', "https://www.veikkaus.fi/api/v1/sport-games/draws?game-names=SPORT")
        .done(function (r) {
          console.log('SPORT GAMES', r.draws)
          $('#postRows').show()
          $('#gameIdSelect').show().empty().append(r.draws.map(function (draw) {
            return $('<option>').val(draw.id).data('basePrice', draw.gameRuleSet.basePrice).text(draw.name + ' (sulkeutuu ' + moment(draw.closeTime).format("l LT"))
          }))
        })
    })
  })
  $('#postRows').click(function () {
    var gameId = $('#gameIdSelect').val()
    var basePrice = $('#gameIdSelect option[value="' + gameId + '"]').data('basePrice')
    console.log('GameID', gameId, 'BasePrice', basePrice)
    var coupons = couponRowsToWagerRequests($('#rowsArea').val(), gameId, basePrice)
    var couponsInGroupsOf25 = _(coupons).groupBy(function (v, i) {
      return Math.floor(i / 25)
    }).values().value()
    var i = 1;
    console.log(couponsInGroupsOf25)
    sendBatch()

    function sendBatch() {
      if (couponsInGroupsOf25.length == 0) {
        $('body').append($('<div>').text('All sent'))
      } else {
        var thisBatch = couponsInGroupsOf25.shift()
        $('body').append($('<div>').text('Checking...' + i++))
        jsonAjax('POST', 'https://www.veikkaus.fi/api/v1/sport-games/wagers/check', thisBatch)
          .done(function(res) {
            var errors = res.filter(function (row) {
              return row.error || (row.status === "REJECTED")
            })
            if(errors.length > 0) {
              $('body').append($('<div>').text('Rejected:' + JSON.stringify(errors)))
            }
            sendBatch()
          })
          .fail(function(jqXHR, textStatus, errorThrown) {
            $('body').append($('<div>').text('Errors: ' +  JSON.stringify({j: jqXHR.responseJSON, t: textStatus, e: errorThrown})))
          })
      }
    }
  })

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