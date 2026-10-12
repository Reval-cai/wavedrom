'use strict';

const renderMarks = require('./render-marks.js');
const renderArcs = require('./render-arcs.js');
const renderGaps = require('./render-gaps.js');
const renderPieceWise = require('./render-piece-wise.js');
const renderCursor = require('./render-cursor.js');

function renderLanes (index, content, waveLanes, ret, source, lane, waveSkin) {
    const res = [
        renderMarks(content, index, lane, source)
    ].concat(
        waveLanes.res,
        [
            renderArcs(ret.lanes, index, source, lane),
            renderGaps(ret.lanes, index, source, lane),
            renderPieceWise(ret.lanes, index, lane)
        ]
    );
    // only emitted when config.cursor is present
    const cursor = renderCursor(source, lane, content, waveSkin);
    if (cursor.length) {
        res.push(cursor);
    }
    return res;
}

module.exports = renderLanes;
