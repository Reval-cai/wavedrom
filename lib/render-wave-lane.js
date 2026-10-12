'use strict';

const tt = require('onml/tt.js');
const tspan = require('tspan');
const textWidth = require('./text-width.js');
const findLaneMarkers = require('./find-lane-markers.js');
const renderOverUnder = require('./render-over-under.js');
const latency = require('./latency.js');

// Draws the bricks of one lane. `offset` is the latency shift in bricks and may
// be fractional; the lane pattern wraps around to fill the region left of the
// start, and the caller clips the group at x >= 0 so nothing spills into the
// name column. No glyph is ever stretched, so shapes stay intact.
function renderLaneUses (cont, lane, offset) {
    const res = [];
    const bricks = cont[1];

    if (bricks) {
        const n = bricks.length;
        let first = 0;

        if (offset > 0 && n > 0) {
            first = -Math.min(Math.ceil(offset), n * latency.MAX_WRAP_COPIES);
        }
        for (let j = first; j < n; j += 1) {
            const x = (j + offset) * lane.xs;
            if (x + lane.xs <= 0) { // entirely left of the clip region
                continue;
            }
            const index = ((j % n) + n) % n;
            res.push(['use', tt(x, 0, {'xlink:href': '#' + bricks[index]})]);
        }

        if (cont[2] && cont[2].length) {
            const labels = findLaneMarkers(bricks);
            labels.forEach(function (label, i) {
                if (cont[2][i] !== undefined) {
                    res.push(['text', {
                        x: (label + offset) * lane.xs + lane.xlabel,
                        y: lane.ym,
                        'text-anchor': 'middle',
                        'xml:space': 'preserve'
                    }].concat(tspan.parse(cont[2][i])));
                }
            });
        }
    }
    return res;
}

function renderWaveLane (content, index, lane) {
    let xmax = 0;
    const glengths = [];
    const res = [];
    const clips = [];

    content.map(function (el, j) {
        const name = el[0][0];
        if (name) { // check name
            let xoffset = el[0][1];
            xoffset = (xoffset > 0)
                ? (Math.ceil(2 * xoffset) - 2 * xoffset)
                : (-2 * xoffset);

            // latency shifts the waveform inside its lane (the lane never moves),
            // so all lanes keep the same left edge
            const shift = latency.toBricks(el[3], lane);
            const draw = ['g', tt(
                xoffset * lane.xs,
                0,
                {id: 'wavelane_draw_' + j + '_' + index}
            )];

            if (shift !== 0) {
                const clipId = 'latclip_' + j + '_' + index;
                draw[1]['clip-path'] = 'url(#' + clipId + ')';
                clips.push(['clipPath', {id: clipId}, ['rect', {
                    x: 0,
                    y: -2 * lane.yo,
                    width: 1e5,
                    height: content.length * lane.yo + 4 * lane.yo
                }]]);
            }

            res.push(['g', tt(
                0,
                lane.y0 + j * lane.yo,
                {id: 'wavelane_' + j + '_' + index}
            )]
                .concat([['text', {
                    x: lane.tgo,
                    y: lane.ym,
                    class: 'info',
                    'text-anchor': 'end',
                    'xml:space': 'preserve'
                }]
                    .concat(tspan.parse(name))
                ])
                .concat([draw.concat(renderLaneUses(el, lane, shift))])
                .concat(
                    renderOverUnder(el[3], 'over', lane),
                    renderOverUnder(el[3], 'under', lane)
                )
            );
            // a delayed lane is longer, an advanced one shorter - but the diagram
            // must never shrink below the unshifted length
            xmax = Math.max(xmax, (el[1] || []).length + Math.ceil(Math.max(0, shift)));
            glengths.push(name.textWidth ? name.textWidth : name.charCodeAt ? textWidth(name, 11) : 0);
        }
    });
    // xmax if no xmax_cfg,xmin_cfg, else set to config
    lane.xmax = Math.min(xmax, lane.xmax_cfg - lane.xmin_cfg);
    const xgmax = 0;
    lane.xg = xgmax + 20;

    if (clips.length) {
        res.unshift(['defs'].concat(clips));
    }
    return {glengths: glengths, res: res};
}

module.exports = renderWaveLane;
