'use strict';

const tspan = require('tspan');

const waveColors = require('./wave-colors.js');

/*
 * config.cursor draws one or more vertical cursor lines with an optional
 * annotation next to each of them:
 *
 *   config: { cursor: { x: 12, text: 'setup', color: 3, textColor: 5 } }
 *   config: { cursor: [{ x: '25%', text: 'a' }, { x: '75%', color: 'a' }] }
 *
 *  x          brick position (same unit as lane.xmax), or 'NN%' of the full
 *             diagram width; negative values are allowed
 *  color      cursor line colour, textColor the annotation colour; both take a
 *             colour code (2-9, a, b, c, e, f, g) exactly like the wave data,
 *             or a literal '#rrggbb'
 *  text       optional annotation, drawn at the top of the line
 */

const DEFAULT_COLOR = '#888888';
const DEFAULT_TEXT_COLOR = '#000000';

function xOf (spec, lane) {
    if (spec === undefined || spec === null) {
        return NaN;
    }
    const raw = (typeof spec === 'object') ? spec.x : spec;
    if (typeof raw === 'string' && raw.trim().slice(-1) === '%') {
        return lane.xmax * lane.xs * (parseFloat(raw) / 100);
    }
    return Number(raw) * lane.xs;
}

function colorOf (skin, code, fallback) {
    if (code === undefined || code === null) {
        return fallback;
    }
    return waveColors.colorOf(skin, code) || fallback;
}

function renderCursor (source, lane, content, waveSkin) {
    const config = source && source.config && source.config.cursor;
    if (!config) {
        return [];
    }

    const skin = waveColors.pickSkin(waveSkin, source);
    const gy = content.length * lane.yo;
    const list = Array.isArray(config) ? config : [config];
    const res = ['g', {id: 'gcursor'}];

    list.forEach(function (entry, i) {
        if (entry === undefined || entry === null) {
            return;
        }
        const spec = (typeof entry === 'object') ? entry : {x: entry};
        const x = xOf(spec, lane);
        if (isNaN(x)) {
            return;
        }

        res.push(['line', {
            id: 'cursor_' + i,
            class: 'cursorLine',
            x1: x,
            y1: 0,
            x2: x,
            y2: gy,
            style: 'stroke:' + colorOf(skin, spec.color, DEFAULT_COLOR)
        }]);

        if (spec.text !== undefined && spec.text !== null && String(spec.text) !== '') {
            res.push(['text', {
                id: 'cursorText_' + i,
                class: 'cursorText',
                x: x + 4,
                y: -6,
                'text-anchor': 'start',
                'xml:space': 'preserve',
                style: 'fill:' + colorOf(skin, spec.textColor, DEFAULT_TEXT_COLOR)
            }].concat(tspan.parse(String(spec.text))));
        }
    });

    return res;
}

module.exports = renderCursor;
