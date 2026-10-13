'use strict';

/*
 * Extra "macaron" colours addressable by the letters a, b, c, e, f, g.
 *
 * WaveDrom resolves a wave character into a brick glyph (see
 * gen-wave-brick.js) and the colour lives inside that glyph as a CSS class
 * declared by the skin. Adding colours therefore means adding glyph variants.
 * To keep the skin files themselves untouched, the variants are cloned from
 * the skin's existing colour-3 family when the skin is first used, and the new
 * classes are appended to the skin's <style> element.
 *
 * Two kinds of glyph have to be cloned:
 *   - single colour bricks ('vvv-3', 'xmv-3', 'vmx-3', 'vm0-3', ...): one class
 *   - two colour transition bricks ('vmv-<left>-<right>'): two classes, so every
 *     ordered pair that involves a letter needs its own variant - including
 *     letter-to-letter. Missing those makes an adjacent pair of macaron cells
 *     reference a glyph that does not exist, and the transition block between
 *     them comes out blank ("only the middle colour, no crossing").
 *
 * A colour code may also be written directly as '#rrggbb', which is what the
 * cursor/annotation renderer accepts next to the numeric codes.
 */

// 'd' is deliberately absent: it is the "don't care" brick of the wave grammar
const LETTERS = ['a', 'b', 'c', 'e', 'f', 'g'];
const DIGITS = ['2', '3', '4', '5', '6', '7', '8', '9'];

const CODE_RE = new RegExp('^[2-9' + LETTERS.join('') + ']$');

// a value cell is drawn with a brick named 'vvv-<code>'
const BRICK_RE = new RegExp('^vvv-[2-9' + LETTERS.join('') + ']$');

// low saturation pastels, tuned for the light skins
const MACARON = {
    a: '#f6c8d0',
    b: '#d6c8f0',
    c: '#b9d4e8',
    e: '#c3e8d0',
    f: '#f0dfa8',
    g: '#bfe3e0'
};

// same hues, darkened so that the dark skin's white text stays readable
const MACARON_DARK = {
    a: '#7a3b45',
    b: '#4b3a6b',
    c: '#2f4a63',
    e: '#2c5540',
    f: '#5f5220',
    g: '#2a5450'
};

const expanded = new WeakSet();
const cache = new WeakMap();

function childByTag (node, tag) {
    for (let i = 1; i < node.length; i += 1) {
        if (Array.isArray(node[i]) && node[i][0] === tag) {
            return node[i];
        }
    }
    return undefined;
}

function defsOf (skin) {
    return Array.isArray(skin) ? childByTag(skin, 'defs') : undefined;
}

// ['defs', child, child, ...] - some skins may carry an attributes object
function glyphsOf (defs) {
    const start = (defs[1] && typeof defs[1] === 'string') ? 2 : 1;
    return defs.slice(start).filter(function (el) {
        return Array.isArray(el) && el[1] && el[1].id;
    });
}

function glyphOf (defs, id) {
    return glyphsOf(defs).find(function (el) {
        return el[1].id === id;
    });
}

function styleOf (skin) {
    const el = childByTag(skin, 'style');
    return el ? el[el.length - 1] : undefined;
}

function classesIn (node, acc) {
    if (!Array.isArray(node)) {
        return acc;
    }
    const attrs = node[1];
    if (attrs && typeof attrs === 'object' && typeof attrs.class === 'string') {
        acc.push(attrs.class);
    }
    for (let i = 2; i < node.length; i += 1) {
        classesIn(node[i], acc);
    }
    return acc;
}

function fillOf (style, cls) {
    const rule = new RegExp('\\.' + cls + '\\s*\\{([^}]*)\\}').exec(style);
    if (!rule) {
        return undefined;
    }
    const fill = /fill\s*:\s*(#[0-9a-fA-F]{3,8})/.exec(rule[1]);
    return fill ? fill[1] : undefined;
}

// the class that paints the value box: the one class of the glyph that has a
// real fill (outlines are declared with fill:none)
function boxClassOf (glyph, style) {
    const classes = classesIn(glyph, []);
    for (let i = 0; i < classes.length; i += 1) {
        if (fillOf(style, classes[i])) {
            return classes[i];
        }
    }
    return undefined;
}

function retint (node, from, to) {
    if (!Array.isArray(node)) {
        return node;
    }
    const attrs = node[1];
    if (attrs && typeof attrs === 'object' && attrs.class === from) {
        attrs.class = to;
    }
    for (let i = 2; i < node.length; i += 1) {
        retint(node[i], from, to);
    }
    return node;
}

// recolour several classes at once, in a single pass so that a swap
// (2 -> 3 and 3 -> 2) cannot cascade
function retintMap (node, map) {
    if (!Array.isArray(node)) {
        return node;
    }
    const attrs = node[1];
    if (attrs && typeof attrs === 'object' && map[attrs.class]) {
        attrs.class = map[attrs.class];
    }
    for (let i = 2; i < node.length; i += 1) {
        retintMap(node[i], map);
    }
    return node;
}

function clone (node) {
    return JSON.parse(JSON.stringify(node));
}

function isDark (style) {
    return /\btext\s*\{[^}]*fill\s*:\s*#(?:fff|ffffff)/i.test(style);
}

// add the lettered colour variants to a skin, once per skin
function expand (skin) {
    if (!Array.isArray(skin) || expanded.has(skin)) {
        return skin;
    }
    expanded.add(skin);

    const defs = defsOf(skin);
    const styleEl = childByTag(skin, 'style');
    if (!defs || !styleEl) {
        return skin;
    }
    let style = styleEl[styleEl.length - 1];

    // colour 3 is the template family: same shapes, one class per colour
    const template = glyphsOf(defs).filter(function (el) {
        return /-3$/.test(el[1].id) && !/^vmv-\d+-\d+$/.test(el[1].id);
    });
    if (template.length === 0) {
        return skin;
    }
    const source = glyphOf(defs, 'vvv-3') || template[0];
    const boxClass = boxClassOf(source, style);
    if (!boxClass) {
        return skin;
    }

    const palette = isDark(style) ? MACARON_DARK : MACARON;
    Object.keys(palette).forEach(function (letter) {
        const cls = 'mc-' + letter;
        if (style.indexOf('.' + cls + '{') === -1) {
            style += '.' + cls + '{fill:' + palette[letter] + '}';
            styleEl[styleEl.length - 1] = style;
        }
        template.forEach(function (glyph) {
            const variant = clone(glyph);
            variant[1].id = glyph[1].id.replace(/-3$/, '-' + letter);
            defs.push(retint(variant, boxClass, cls));
        });
    });

    // Two colour transition bricks: every ordered pair that involves a letter,
    // both directions and letter-to-letter included. Cloned from one of the
    // skin's own transitions, so the shapes stay identical to the numeric ones.
    const pair = glyphOf(defs, 'vmv-' + DIGITS[0] + '-' + DIGITS[1]) ||
        glyphsOf(defs).find(function (el) {
            return /^vmv-\d+-\d+$/.test(el[1].id);
        });
    if (!pair) {
        return skin;
    }
    const pairCodes = pair[1].id.split('-').slice(1);
    const classOf = function (code) {
        if (LETTERS.indexOf(code) >= 0) {
            return 'mc-' + code;
        }
        const glyph = glyphOf(defs, 'vvv-' + code);
        return glyph ? boxClassOf(glyph, style) : undefined;
    };
    const leftClass = classOf(pairCodes[0]);
    const rightClass = classOf(pairCodes[1]);
    if (!leftClass || !rightClass) {
        return skin;
    }
    const codes = DIGITS.concat(LETTERS);
    codes.forEach(function (left) {
        codes.forEach(function (right) {
            if (left === right) {
                return;
            }
            if (LETTERS.indexOf(left) < 0 && LETTERS.indexOf(right) < 0) {
                return; // the skin already has the numeric pair
            }
            const map = {};
            map[leftClass] = classOf(left);
            map[rightClass] = classOf(right);
            if (!map[leftClass] || !map[rightClass]) {
                return;
            }
            const variant = retintMap(clone(pair), map);
            variant[1].id = 'vmv-' + left + '-' + right;
            defs.push(variant);
        });
    });
    return skin;
}

// wave skin selection, identical to the rules used by the renderers
function pickSkin (waveSkin, source) {
    const names = Object.keys(waveSkin || {});
    let skin = waveSkin && (waveSkin.default || waveSkin[names[0]]);
    if (source && source.config && source.config.skin && waveSkin[source.config.skin]) {
        skin = waveSkin[source.config.skin];
    }
    return skin;
}

// colour code ('3', 'a', ...) or '#rrggbb' -> '#rrggbb'
function colorOf (skin, code) {
    if (typeof code === 'string' && code.charAt(0) === '#') {
        return code;
    }
    const key = String(code);
    if (!CODE_RE.test(key)) {
        return undefined;
    }
    expand(skin);
    let seen = cache.get(skin);
    if (!seen) {
        seen = {};
        cache.set(skin, seen);
    }
    if (seen[key]) {
        return seen[key];
    }
    const defs = defsOf(skin);
    const style = styleOf(skin);
    if (!defs || !style) {
        return undefined;
    }
    const glyph = glyphOf(defs, 'vvv-' + key);
    const cls = glyph ? boxClassOf(glyph, style) : undefined;
    const fill = cls ? fillOf(style, cls) : undefined;
    if (fill) {
        seen[key] = fill;
    }
    return fill;
}

module.exports = {
    expand: expand,
    colorOf: colorOf,
    pickSkin: pickSkin,
    LETTERS: LETTERS,
    DIGITS: DIGITS,
    CODE_RE: CODE_RE,
    BRICK_RE: BRICK_RE,
    MACARON: MACARON
};
