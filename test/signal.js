'use strict';

var renderAny = require('../lib/render-any.js');
var genWaveBrick = require('../lib/gen-wave-brick.js');
var findLaneMarkers = require('../lib/find-lane-markers.js');
var latency = require('../lib/latency.js');
var waveSkin = require('../skins/default.js');
var chai = require('chai');
var expect = chai.expect;

function collect (node, acc) {
    if (!Array.isArray(node)) {
        return acc;
    }
    if (node[1] && typeof node[1] === 'object' && node[1].id) {
        acc.push(node);
    }
    for (var i = 2; i < node.length; i += 1) {
        collect(node[i], acc);
    }
    return acc;
}

function nodeById (svg, id) {
    return collect(svg, []).find(function (node) {
        return node[1].id === id;
    });
}

function transformOf (svg, lane) {
    var node = nodeById(svg, 'wavelane_draw_' + lane + '_0');
    return node ? node[1].transform : undefined;
}

function usesOf (svg, lane) {
    var node = nodeById(svg, 'wavelane_draw_' + lane + '_0');
    if (!node) {
        return 0;
    }
    return node.slice(2).filter(function (n) {
        return Array.isArray(n) && n[0] === 'use';
    }).length;
}

function useTransforms (svg, lane) {
    var node = nodeById(svg, 'wavelane_draw_' + lane + '_0');
    if (!node) {
        return [];
    }
    return node.slice(2).filter(function (n) {
        return Array.isArray(n) && n[0] === 'use';
    }).map(function (n) {
        return n[1].transform;
    });
}

describe('signal', function () {
    it('clocks', function (done) {
        expect(renderAny(0,
            { signal: [
                { name: 'pclk', wave: 'p.......' },
                { name: 'Pclk', wave: 'P.......' },
                { name: 'nclk', wave: 'n.......' },
                { name: 'Nclk', wave: 'N.......' },
                {},
                { name: 'clk0', wave: 'phnlPHNL' },
                { name: 'clk1', wave: 'xhlhLHl.' },
                { name: 'clk2', wave: 'hpHplnLn' },
                { name: 'clk3', wave: 'nhNhplPl' },
                { name: 'clk4', wave: 'xlh.L.Hx' }
            ]}, waveSkin
        )).to.be.an('array');
        done();
    });
    it('gaps', function (done) {
        expect(renderAny(1,
            { signal: [
                { name: 'clk',         wave: 'p.....|...' },
                { name: 'Data',        wave: 'x.345x|=.x', data: ['head', 'body', 'tail', 'data'] },
                { name: 'Request',     wave: '0.1..0|1.0' },
                {},
                { name: 'Acknowledge', wave: '1.....|01.' }
            ]}, waveSkin
        )).to.be.an('array');
        done();
    });
    it('bundles', function (done) {
        expect(renderAny(2,
            {signal: [
                {    name: 'clk',   wave: 'p..Pp..P'},
                ['Master',
                    ['ctrl',
                        {name: 'write', wave: '01.0....'},
                        {name: 'read',  wave: '0...1..0'}
                    ],
                    {  name: 'addr',  wave: 'x3.x4..x', data: 'A1 A2'},
                    {  name: 'wdata', wave: 'x3.x....', data: 'D1'   }
                ],
                {},
                ['Slave',
                    ['ctrl',
                        {name: 'ack',   wave: 'x01x0.1x'}
                    ],
                    {  name: 'rdata', wave: 'x.....4x', data: 'Q2'}
                ]
            ]}, waveSkin
        )).to.be.an('array');
        done();
    });
    it('arcs', function (done) {
        expect(renderAny(3,
            { signal: [
                { name: 'A', wave: '01........0....',  node: '.a........j' },
                { name: 'B', wave: '0.1.......0.1..',  node: '..b.......i' },
                { name: 'C', wave: '0..1....0...1..',  node: '...c....h..' },
                { name: 'D', wave: '0...1..0.....1.',  node: '....d..g...' },
                { name: 'E', wave: '0....10.......1',  node: '.....ef....' }
            ],
            edge: [
                'a~b t1', 'c-~a t2', 'c-~>d time 3', 'd~-e',
                'e~>f', 'f->g', 'g-~>h', 'h~>i some text', 'h~->j'
            ]}, waveSkin
        )).to.be.an('array');
        done();
    });
    it('marks', function (done) {
        expect(renderAny(3,
            {
                signal: [
                    {name:'clk',         wave: 'p....' },
                    {name:'Data',        wave:'x345x', data: 'a b c' },
                    {name:'Request',     wave: '01..0' }
                ],
                head: {
                    text:'WaveDrom example',
                    tick: 0
                },
                foot: {
                    text:'Figure 100',
                    tock: 9
                }
            }, waveSkin
        )).to.be.an('array');
        done();
    });
    it('latency', function (done) {
        // the shift is expressed in units of 1% of a period; the drawing is
        // scaled so that one period is latency.UNITS_PER_PERIOD units wide
        expect(latency.offsetUnits({latency: 100})).to.equal(100);
        expect(latency.offsetUnits({latency: 50})).to.equal(50);
        expect(latency.offsetUnits({latency: -50})).to.equal(-50);
        expect(latency.offsetUnits({latency: 1})).to.equal(1);
        expect(latency.offsetUnits({})).to.equal(0);
        // ...and in bricks: one period is 2 * hscale bricks, so a shift may be
        // fractional instead of being rounded to the half-period brick grid
        expect(latency.toBricks({latency: 100}, {hscale: 1})).to.equal(2);
        expect(latency.toBricks({latency: 25}, {hscale: 1})).to.equal(0.5);
        expect(latency.toBricks({latency: 1}, {hscale: 1})).to.equal(0.02);
        expect(latency.toBricks({latency: 100}, {hscale: 2})).to.equal(4);
        // one period is exactly 100 units whatever the skin/hscale is
        expect(latency.scaleOf({hscale: 1, xs: 20})).to.equal(2.5);
        expect(latency.scaleOf({hscale: 2, xs: 20})).to.equal(1.25);

        var svg = renderAny(0,
            { signal: [
                { name: 'clk', wave: 'p.......' },
                { name: 'q1',  wave: 'x3x4x.x.', data: 'A B', latency: 100 },
                { name: 'q2',  wave: 'x3x4x.x.', data: 'A B', latency: -50 },
                { name: 'q3',  wave: 'x3x4x.x.', data: 'A B', latency: 25 }
            ]}, waveSkin
        );
        // every lane keeps the same left edge: no transform on the drawing group
        [0, 1, 2, 3].forEach(function (i) {
            expect(transformOf(svg, i)).to.equal(undefined);
        });
        // 100% pushes the waveform out by one period (2 bricks), the start region
        // is filled by wrapping the pattern around
        expect(usesOf(svg, 1)).to.equal(usesOf(svg, 0) + 2);
        expect(useTransforms(svg, 1)[0]).to.equal(undefined);   // wrapped brick at x = 0
        expect(useTransforms(svg, 1)[1]).to.equal('translate(20)');
        // -50% cuts the head: the first brick lies entirely left of the clip
        expect(usesOf(svg, 2)).to.equal(usesOf(svg, 0) - 1);
        // 25% is half a brick, so the content starts at a fractional position
        expect(usesOf(svg, 3)).to.equal(usesOf(svg, 0) + 1);
        expect(useTransforms(svg, 3)[0]).to.equal('translate(-10)');
        expect(useTransforms(svg, 3)[1]).to.equal('translate(10)');
        // shifted lanes are clipped so nothing spills into the name column
        expect(nodeById(svg, 'wavelane_draw_1_0')[1]['clip-path']).to.equal('url(#latclip_1_0)');
        expect(nodeById(svg, 'wavelane_draw_0_0')[1]['clip-path']).to.equal(undefined);
        done();
    });
    it('every referenced brick glyph exists', function (done) {
        // an adjacent pair of macaron colours needs a two-colour transition glyph
        // ('vmv-a-b'). If the clone step misses it, the reference dangles and the
        // transition block comes out blank - "only the middle colour, no crossing".
        var svg = renderAny(0,
            { signal: [
                { name: 'letters', wave: 'x.axbxcxefgx', data: 'a b c e f g' },
                { name: 'mix',     wave: 'x.5xaxb7x',    data: '5 a b 7' },
                { name: 'digits',  wave: 'x.5x6x7x892x', data: '5 6 7 8 9 2' },
                // equal neighbours: 'x.55x' uses vmv-5-5, so 'x.ccx' needs vmv-c-c
                { name: 'equal',   wave: 'x.axbxccefgx', data: 'a b c e f g' }
            ]}, waveSkin
        );
        var ids = collect(svg, []).map(function (n) { return n[1].id; });
        var refs = [];
        (function walk (node) {
            if (!Array.isArray(node)) { return; }
            if (node[0] === 'use' && node[1] && node[1]['xlink:href']) {
                refs.push(node[1]['xlink:href'].replace('#', ''));
            }
            for (var i = 2; i < node.length; i += 1) { walk(node[i]); }
        })(svg);
        expect(refs.length).to.be.above(20);
        refs.forEach(function (ref) {
            expect(ids).to.include(ref);
        });

        // the two-colour bricks paint the right half first and the left half
        // second, exactly like the numeric bricks they were cloned from
        var halvesOf = function (id) {
            var node = nodeById(svg, id);
            return node.slice(2, 4).map(function (n) { return n[1].class; });
        };
        expect(halvesOf('vmv-a-b')).to.deep.equal(['mc-b', 'mc-a']);
        expect(halvesOf('vmv-b-a')).to.deep.equal(['mc-a', 'mc-b']);
        // letter-to-digit and digit-to-letter put the letter on opposite sides
        expect(halvesOf('vmv-a-5')[1]).to.equal('mc-a');
        expect(halvesOf('vmv-5-a')[0]).to.equal('mc-a');
        expect(halvesOf('vmv-a-5')[0]).to.equal(halvesOf('vmv-5-a')[1]);

        // ...and a lettered lane is drawn with exactly the shapes of the numeric
        // one, only the colour codes differ
        var shapeOf = function (lane) {
            var node = nodeById(svg, 'wavelane_draw_' + lane + '_0');
            return node.slice(2).filter(function (n) {
                return Array.isArray(n) && n[0] === 'use';
            }).map(function (n) {
                return n[1]['xlink:href'].replace('#', '').replace(/[2-9abcefg]/g, 'X');
            });
        };
        expect(shapeOf(0)).to.deep.equal(shapeOf(2));
        done();
    });
    it('lettered colour at the start of a wave', function (done) {
        // The first brick has its own lookup table (gen-first-wave-brick.js). A
        // leading letter must render the same value box a leading digit gets -
        // before the fix it fell through to the 'unknown' default and the whole
        // first cell was drawn as a hatched block.
        var svg = renderAny(0,
            { signal: [
                { name: 'L1', wave: 'a.......' },
                { name: 'D1', wave: '3.......' },
                { name: 'L2', wave: 'ab......' },
                { name: 'D2', wave: '34......' },
                { name: 'L3', wave: 'axb.....' },
                { name: 'D3', wave: '3x4.....' }
            ]}, waveSkin
        );
        var firstUse = function (lane) {
            var node = nodeById(svg, 'wavelane_draw_' + lane + '_0');
            var use = node.slice(2).filter(function (n) {
                return Array.isArray(n) && n[0] === 'use';
            })[0];
            return use[1]['xlink:href'].replace('#', '');
        };
        expect(firstUse(0)).to.equal('vvv-a');
        expect(firstUse(1)).to.equal('vvv-3');
        expect(firstUse(2)).to.equal('vvv-a');
        expect(firstUse(3)).to.equal('vvv-3');
        expect(firstUse(4)).to.equal('vvv-a');
        expect(firstUse(5)).to.equal('vvv-3');

        var shapeOf = function (lane) {
            var node = nodeById(svg, 'wavelane_draw_' + lane + '_0');
            return node.slice(2).filter(function (n) {
                return Array.isArray(n) && n[0] === 'use';
            }).map(function (n) {
                return n[1]['xlink:href'].replace('#', '').replace(/[2-9abcefg]/g, 'X');
            });
        };
        expect(shapeOf(0)).to.deep.equal(shapeOf(1));
        expect(shapeOf(2)).to.deep.equal(shapeOf(3));
        expect(shapeOf(4)).to.deep.equal(shapeOf(5));
        done();
    });
    it('cursor', function (done) {
        var svg = renderAny(0,
            {
                config: {
                    cursor: [
                        { x: '50%', text: 'mid', color: 3, textColor: 5 },
                        { x: 2, color: 'a' }
                    ]
                },
                signal: [ { name: 'clk', wave: 'p.......' } ]
            }, waveSkin
        );
        var text = JSON.stringify(svg);
        // the cursor borrows the very colours the wave data codes use
        expect(nodeById(svg, 'cursor_0')[1].style).to.equal('stroke:#ffffb4');
        expect(nodeById(svg, 'cursorText_0')[1].style).to.equal('fill:#b9e0ff');
        expect(nodeById(svg, 'cursor_1')[1].style).to.equal('stroke:#f6c8d0');
        expect(text).to.include('"id":"cursorText_0"');
        // 50% of the diagram width (16 bricks * 20px), and x:2 is a brick position
        expect(nodeById(svg, 'cursor_0')[1].x1).to.equal(160);
        expect(nodeById(svg, 'cursor_1')[1].x1).to.equal(40);
        done();
    });
    it('letter colours', function (done) {
        // the letters are aliases of the colour-3 brick shapes
        expect(genWaveBrick('0a', 0, 1)).to.deep.equal(['0mv-a', 'vvv-a']);
        expect(genWaveBrick('03', 0, 1)).to.deep.equal(['0mv-3', 'vvv-3']);
        var svg = renderAny(0,
            { signal: [ { name: 'bus', wave: 'x.axbxcx', data: 'A B C' } ]}, waveSkin
        );
        var text = JSON.stringify(svg);
        expect(text).to.include('"id":"vvv-a"');
        expect(text).to.include('"class":"mc-a"');
        expect(text).to.include('.mc-a{fill:#');
        done();
    });
    it('data labels on letter bricks', function (done) {
        // a lettered value cell has to count as a marker, exactly like a digit
        var digit  = ['xxx', 'xmv-3', 'vvv-3', 'vmv-3-4', 'vvv-4', 'vmx-4', 'xxx'];
        var letter = ['xxx', 'xmv-a', 'vvv-a', 'vmv-a-b', 'vvv-b', 'vmx-b', 'xxx'];
        expect(findLaneMarkers(letter)).to.deep.equal([2, 4]);
        expect(findLaneMarkers(letter)).to.deep.equal(findLaneMarkers(digit));
        var svg = renderAny(0,
            { signal: [ { name: 'dat', wave: 'x.abcx=.x', data: ['AA', 'BB', 'CC', 'DD'] } ]}, waveSkin
        );
        var text = JSON.stringify(svg);
        ['AA', 'BB', 'CC', 'DD'].forEach(function (label) {
            expect(text).to.include(label);
        });
        done();
    });
});
/* eslint-env mocha */
