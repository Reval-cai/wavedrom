'use strict';

const genBrick = require('./gen-brick.js');
const waveColors = require('./wave-colors.js');

function genWaveBrick (text, extra, times) {

    const x1 = {p: 'pclk', n: 'nclk', P: 'Pclk', N: 'Nclk', h: 'pclk', l: 'nclk', H: 'Pclk', L: 'Nclk'};

    const x2 = {
        '0':'0', '1':'1',
        'x':'x',
        'd':'d',
        'u':'u',
        'z':'z',
        '=':'v',  '2':'v',  '3':'v',  '4':'v', '5':'v', '6':'v', '7':'v', '8':'v', '9':'v'
    };

    const x3 = {
        '0': '', '1': '',
        'x': '',
        'd': '',
        'u': '',
        'z': '',
        '=':'-2', '2':'-2', '3':'-3', '4':'-4', '5':'-5', '6':'-6', '7':'-7', '8':'-8', '9':'-9'
    };

    const y1 = {
        'p':'0', 'n':'1',
        'P':'0', 'N':'1',
        'h':'1', 'l':'0',
        'H':'1', 'L':'0',
        '0':'0', '1':'1',
        'x':'x',
        'd':'d',
        'u':'u',
        'z':'z',
        '=':'v', '2':'v', '3':'v', '4':'v', '5':'v', '6':'v', '7':'v', '8':'v', '9':'v'
    };

    const y2 = {
        'p': '', 'n': '',
        'P': '', 'N': '',
        'h': '', 'l': '',
        'H': '', 'L': '',
        '0': '', '1': '',
        'x': '',
        'd': '',
        'u': '',
        'z': '',
        '=':'-2', '2':'-2', '3':'-3', '4':'-4', '5':'-5', '6':'-6', '7':'-7', '8':'-8', '9':'-9'
    };

    const x4 = {
        'p': '111', 'n': '000',
        'P': '111', 'N': '000',
        'h': '111', 'l': '000',
        'H': '111', 'L': '000',
        '0': '000', '1': '111',
        'x': 'xxx',
        'd': 'ddd',
        'u': 'uuu',
        'z': 'zzz',
        '=': 'vvv-2', '2': 'vvv-2', '3': 'vvv-3', '4': 'vvv-4', '5': 'vvv-5', '6':'vvv-6', '7':'vvv-7', '8':'vvv-8', '9':'vvv-9'
    };

    const x5 = {p: 'nclk', n: 'pclk', P: 'nclk', N: 'pclk'};

    // the letters behave exactly like the colour code 3, but select one of the
    // extra macaron colours (see wave-colors.js)
    waveColors.LETTERS.forEach(function (letter) {
        x2[letter] = 'v';
        x3[letter] = '-' + letter;
        y1[letter] = 'v';
        y2[letter] = '-' + letter;
        x4[letter] = 'vvv-' + letter;
    });

    const x6 = {p: '000', n: '111', P: '000', N: '111'};

    const xclude = {hp: '111', Hp: '111', ln: '000', Ln: '000', nh: '111', Nh: '111', pl: '000', Pl: '000'};

    const atext = text.split('');
    //if (atext.length !== 2) { return genBrick(['xxx'], extra, times); }

    const tmp0 = x4[atext[1]];
    let tmp1 = x1[atext[1]];
    if (tmp1 === undefined) {
        const tmp2 = x2[atext[1]];
        if (tmp2 === undefined) {
            // unknown
            return genBrick('xxx', extra, times);
        } else {
            const tmp3 = y1[atext[0]];
            if (tmp3 === undefined) {
                // unknown
                return genBrick('xxx', extra, times);
            }
            // A clock or edge character followed by the level it already sits on
            // (p0, n1, h1, l0, and any '.' repeating a level) has no transition to
            // draw. The '0m0' / '1m1' glyphs are glitches - a 10px notch in the
            // line - so continue the level instead of drawing them.
            if ((tmp2 === '0' || tmp2 === '1') && tmp2 === tmp3) {
                return genBrick([tmp0, tmp0], extra, times);
            }
            // soft curves
            return genBrick([tmp3 + 'm' + tmp2 + y2[atext[0]] + x3[atext[1]], tmp0], extra, times);
        }
    } else {
        const tmp4 = xclude[text];
        if (tmp4 !== undefined) {
            tmp1 = tmp4;
        }
        // sharp curves
        const tmp5 = x5[atext[1]];
        if (tmp5 === undefined) {
            // hlHL
            return genBrick([tmp1, tmp0], extra, times);
        }
        // pnPN
        return genBrick([tmp1, tmp0, tmp5, x6[atext[1]]], extra, times);
    }
}

module.exports = genWaveBrick;
