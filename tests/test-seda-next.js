const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const values = new Map();
const writes = [];
const ledWrites = [];
const scratchTicks = [];
const key = (group, control) => `${group}|${control}`;
const scriptPath = path.join(
    __dirname,
    "..",
    "controllers",
    "Hercules-DJ-Control-Instinct-SeDa-scripts.js"
);
const xmlPath = path.join(
    __dirname,
    "..",
    "controllers",
    "Hercules DJ Control Instinct SeDa.midi.xml"
);
const scriptSource = fs.readFileSync(scriptPath, "utf8");
const xmlSource = fs.readFileSync(xmlPath, "utf8");

global.engine = {
    getValue(group, control) {
        return values.has(key(group, control)) ? values.get(key(group, control)) : 0;
    },
    setValue(group, control, value) {
        values.set(key(group, control), value);
        writes.push([group, control, value]);
    },
    makeConnection() {
        return { disconnect() {} };
    },
    beginTimer(_delay, callback) {
        callback();
        return 1;
    },
    scratchEnable() {},
    scratchDisable() {},
    scratchTick(deck, delta) {
        scratchTicks.push([deck, delta]);
    },
};
global.script = {
    absoluteLin(value, min, max, rawMin, rawMax) {
        if (rawMax === rawMin) {
            return min;
        }
        const ratio = (value - rawMin) / (rawMax - rawMin);
        return min + ratio * (max - min);
    },
    absoluteLinInverse(value, min, max, rawMin, rawMax) {
        if (rawMax === rawMin) {
            return min;
        }
        const ratio = (rawMax - value) / (rawMax - rawMin);
        return min + ratio * (max - min);
    },
};
global.midi = {
    sendShortMsg(status, note, value) {
        ledWrites.push([status, note, value]);
    },
};
global.print = function() {};

vm.runInThisContext(scriptSource);

const press = 0x7F;
const release = 0x00;
const lastTrigger = () => writes[writes.length - 2];
const resetWrites = () => writes.splice(0, writes.length);
const resetLeds = () => ledWrites.splice(0, ledWrites.length);
const resetScratchTicks = () => scratchTicks.splice(0, scratchTicks.length);
const assertXmlBinding = (midino, group, keyName, option) => {
    const blocks = xmlSource.match(/<control>[\s\S]*?<\/control>/g);
    const block = blocks.find(candidate => candidate.includes(`<midino>${midino}</midino>`));
    assert(block);
    assert(block.includes(`<group>${group}</group>`));
    assert(block.includes(`<key>${keyName}</key>`));
    assert(block.includes(`<${option}/>`));
};

HCInstinctSeDa.syncButton(0, 0x17, press, 0x91, "[Channel1]");
assert.equal(engine.getValue("[Channel1]", "sync_enabled"), 1);
HCInstinctSeDa.syncButton(0, 0x17, release, 0x91, "[Channel1]");
assert.equal(engine.getValue("[Channel1]", "sync_enabled"), 1);
HCInstinctSeDa.syncButton(0, 0x17, press, 0x91, "[Channel1]");
assert.equal(engine.getValue("[Channel1]", "sync_enabled"), 0);

resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0D, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_1_gotoandplay", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0E, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_2_gotoandplay", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0F, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_3_gotoandplay", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x10, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_4_gotoandplay", 1]);

values.set(key("[Channel1]", "hotcue_1_enabled"), 1);
values.set(key("[Channel1]", "hotcue_2_enabled"), 0);
values.set(key("[Channel1]", "hotcue_3_enabled"), 0);
values.set(key("[Channel1]", "hotcue_4_enabled"), 1);
resetLeds();
HCInstinctSeDa.updateHotCueLeds("[Channel1]");
assert.deepEqual(ledWrites.slice(-4), [
    [0x91, 0x0D, 0x7F],
    [0x91, 0x0E, 0x00],
    [0x91, 0x0F, 0x00],
    [0x91, 0x10, 0x7F],
]);

HCInstinctSeDa.vinylButtonHandler(0, 0x35, press);
assert.equal(HCInstinctSeDa.scratchModeEnabled, true);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0D, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_5_gotoandplay", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0E, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_6_gotoandplay", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0F, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_7_gotoandplay", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x10, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_8_gotoandplay", 1]);

resetLeds();
HCInstinctSeDa.updateHotCueLeds("[Channel1]");
assert.deepEqual(ledWrites.slice(-4), [
    [0x91, 0x0D, 0x7F],
    [0x91, 0x0E, 0x00],
    [0x91, 0x0F, 0x00],
    [0x91, 0x10, 0x7F],
]);

values.set(key("[Channel1]", "loop_start_position"), -1);
values.set(key("[Channel1]", "loop_end_position"), -1);
resetWrites();
HCInstinctSeDa.loopButton(0, 0x09, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "beatloop_4_activate", 1]);
resetWrites();
HCInstinctSeDa.loopButton(0, 0x0A, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "reloop_toggle", 1]);
resetWrites();
HCInstinctSeDa.loopButton(0, 0x0B, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "loop_move_1_backward", 1]);
resetWrites();
HCInstinctSeDa.loopButton(0, 0x0C, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "loop_move_1_forward", 1]);

values.set(key("[Sampler1]", "track_loaded"), 1);
resetWrites();
HCInstinctSeDa.sampleButton(0, 0x05, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Sampler1]", "cue_gotoandplay", 1]);

values.set(key("[Sampler6]", "track_loaded"), 1);
resetWrites();
HCInstinctSeDa.sampleButton(0, 0x20, press, 0x91, "[Channel2]");
assert.deepEqual(lastTrigger(), ["[Sampler6]", "cue_gotoandplay", 1]);

HCInstinctSeDa.vinylButtonHandler(0, 0x35, press);
assert.equal(HCInstinctSeDa.scratchModeEnabled, false);
values.set(key("[Channel1]", "loop_enabled"), 0);
resetWrites();
HCInstinctSeDa.wheelTurn0(0, 0x26, 0x01, 0xB1, "[Channel1]");
assert.deepEqual(writes.slice(-1)[0], ["[Channel1]", "jog", 1]);

values.set(key("[Channel1]", "loop_enabled"), 1);
resetWrites();
HCInstinctSeDa.wheelTurn0(0, 0x26, 0x01, 0xB1, "[Channel1]");
assert.deepEqual(writes.slice(-1)[0], [
    "[Channel1]",
    "loop_scale",
    HCInstinctSeDa.loopScaleValue(1),
]);
resetWrites();
HCInstinctSeDa.wheelTurn0(0, 0x26, 0x7F, 0xB1, "[Channel1]");
assert.deepEqual(writes.slice(-1)[0], [
    "[Channel1]",
    "loop_scale",
    HCInstinctSeDa.loopScaleValue(-1),
]);

HCInstinctSeDa.vinylButtonHandler(0, 0x35, press);
assert.equal(HCInstinctSeDa.scratchModeEnabled, true);
HCInstinctSeDa.wheelTouch0(0, 0x25, press, 0x91, "[Channel1]");
resetScratchTicks();
resetWrites();
HCInstinctSeDa.wheelTurn0(0, 0x26, 0x02, 0xB1, "[Channel1]");
assert.deepEqual(scratchTicks.slice(-1)[0], [1, 2]);
assert.equal(writes.length, 0);
HCInstinctSeDa.wheelTouch0(0, 0x25, release, 0x91, "[Channel1]");

assert.equal(typeof HCInstinctSeDa.backButton, "undefined");
assert.equal(typeof HCInstinctSeDa.forwardButton, "undefined");
assert.equal(typeof HCInstinctSeDa.seekButton, "undefined");
assert.equal(typeof HCInstinctSeDa.startCapture, "undefined");
assert.equal(typeof HCInstinctSeDa.commitCapture, "undefined");
assert.equal(typeof HCInstinctSeDa.cancelCapture, "undefined");
assert.equal(typeof HCInstinctSeDa.selectCaptureSlot, "undefined");
assert(!scriptSource.includes("LoadTrackFromDeck"));
assert(!scriptSource.includes("captureActive"));
assert(!scriptSource.includes("captureSlot"));
assertXmlBinding("0x13", "[Channel1]", "back", "normal");
assertXmlBinding("0x14", "[Channel1]", "fwd", "normal");
assertXmlBinding("0x2d", "[Channel2]", "back", "normal");
assertXmlBinding("0x2e", "[Channel2]", "fwd", "normal");
assertXmlBinding("0x36", "[Channel1]", "HCInstinctSeDa.deckVolume", "script-binding");
assertXmlBinding("0x3b", "[Channel2]", "HCInstinctSeDa.deckVolume", "script-binding");

const assertDeckVolume = (raw, expected) => {
    resetWrites();
    HCInstinctSeDa.deckVolume(0, 0x36, raw, 0xB1, "[Channel1]");
    assert.equal(writes.slice(-1)[0][0], "[Channel1]");
    assert.equal(writes.slice(-1)[0][1], "volume");
    assert(Math.abs(writes.slice(-1)[0][2] - expected) < 1e-12);

    resetWrites();
    HCInstinctSeDa.deckVolume(0, 0x3B, raw, 0xB1, "[Channel2]");
    assert.equal(writes.slice(-1)[0][0], "[Channel2]");
    assert.equal(writes.slice(-1)[0][1], "volume");
    assert(Math.abs(writes.slice(-1)[0][2] - expected) < 1e-12);
};
const linearDeckVolume = raw => raw / 127;

assertDeckVolume(0, 0);
assertDeckVolume(32, linearDeckVolume(32));
assertDeckVolume(64, linearDeckVolume(64));
assertDeckVolume(95, linearDeckVolume(95));
assertDeckVolume(127, 1);
assert(Math.abs(HCInstinctSeDa.deckVolumeValue(32) - linearDeckVolume(32)) < 1e-12);
assert(Math.abs(HCInstinctSeDa.deckVolumeValue(64) - linearDeckVolume(64)) < 1e-12);
resetWrites();
HCInstinctSeDa.effectButton(0, 0x02, press, 0x91, "[Channel1]");
assert.deepEqual(writes.slice(-1)[0], [
    "[EffectRack1_EffectUnit2]",
    "group_[Channel1]_enable",
    1,
]);

console.log("Hercules SeDa next mapping behavior tests passed");
