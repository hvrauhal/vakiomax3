#!/bin/sh

SESSION_ID=$(date +%s)
http -v --session=s$SESSION_ID POST https://www.veikkaus.fi/api/v1/sessions X-ESA-API-Key:ROBOT type=STANDARD_LOGIN login=$LOGIN password=$PASSWORD
./parselines.js | http -v --session=s$SESSION_ID https://www.veikkaus.fi/api/v1/sport-games/wagers/check
