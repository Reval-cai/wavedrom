'use strict';

const waveColors = require('./wave-colors.js');

// A data label is placed at the centre of every group of consecutive value
// bricks, so the pattern has to know all value bricks - including the lettered
// macaron colours, not just 'vvv-2' .. 'vvv-9'.
function findLaneMarkers (lanetext) {
    let gcount = 0;
    let lcount = 0;
    const ret = [];

    lanetext.forEach(function (e) {
        if (waveColors.BRICK_RE.test(e)) {
            lcount += 1;
        } else {
            if (lcount !== 0) {
                ret.push(gcount - ((lcount + 1) / 2));
                lcount = 0;
            }
        }
        gcount += 1;

    });

    if (lcount !== 0) {
        ret.push(gcount - ((lcount + 1) / 2));
    }

    return ret;
}

module.exports = findLaneMarkers;
