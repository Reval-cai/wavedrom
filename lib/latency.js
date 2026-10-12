'use strict';

/*
 * Lane latency, expressed as a percentage of one period.
 *
 * The drawing is laid out in a finer coordinate system: insert-svg-template.js
 * scales the content and the viewBox by the same factor, so one period is
 * exactly UNITS_PER_PERIOD units while the picture keeps its size. One percent
 * of a period is therefore exactly one unit and the shift is rounded to whole
 * units - pixel precise, instead of being snapped to the half-period brick grid.
 *
 * The waveform is shifted *inside* its lane (the lane itself never moves), so
 * all lanes keep the same left edge:
 *   positive - the waveform is pushed out to the right, its start region is
 *              filled by wrapping the lane pattern around
 *   negative - the waveform started earlier, the head is clipped away
 */

const UNITS_PER_PERIOD = 100;
const MAX_WRAP_COPIES = 200;

function offsetUnits (sigx) {
    const latency = Number(sigx && sigx.latency) || 0;
    if (!latency) {
        return 0;
    }
    return Math.round(latency * UNITS_PER_PERIOD / 100);
}

// one period is 2 * hscale bricks
function periodBricks (lane) {
    return 2 * lane.hscale;
}

// the drawing scale that makes one period UNITS_PER_PERIOD units wide
function scaleOf (lane) {
    return UNITS_PER_PERIOD / (periodBricks(lane) * lane.xs);
}

// the shift in bricks - fractional, unlike the old whole-brick rounding
function toBricks (sigx, lane) {
    return offsetUnits(sigx) / UNITS_PER_PERIOD * periodBricks(lane);
}

module.exports = {
    offsetUnits: offsetUnits,
    toBricks: toBricks,
    periodBricks: periodBricks,
    scaleOf: scaleOf,
    UNITS_PER_PERIOD: UNITS_PER_PERIOD,
    MAX_WRAP_COPIES: MAX_WRAP_COPIES
};
