const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const values = new Map();
const writes = [];
const ledWrites = [];
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
    scratchTick() {},
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
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_1_activate", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0E, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_2_activate", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0F, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_1_clear", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x10, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_2_clear", 1]);

values.set(key("[Channel1]", "hotcue_1_enabled"), 1);
values.set(key("[Channel1]", "hotcue_2_enabled"), 0);
values.set(key("[Channel1]", "hotcue_3_enabled"), 0);
values.set(key("[Channel1]", "hotcue_4_enabled"), 1);
resetLeds();
HCInstinctSeDa.updateHotCueLeds("[Channel1]");
assert.deepEqual(ledWrites.slice(-4), [
    [0x91, 0x0D, 0x7F],
    [0x91, 0x0E, 0x00],
    [0x91, 0x0F, 0x7F],
    [0x91, 0x10, 0x00],
]);

HCInstinctSeDa.vinylButtonHandler(0, 0x35, press);
assert.equal(HCInstinctSeDa.scratchModeEnabled, true);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0D, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_3_activate", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0E, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_4_activate", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0F, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_3_clear", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x10, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_4_clear", 1]);

resetLeds();
HCInstinctSeDa.updateHotCueLeds("[Channel1]");
assert.deepEqual(ledWrites.slice(-4), [
    [0x91, 0x0D, 0x00],
    [0x91, 0x0E, 0x7F],
    [0x91, 0x0F, 0x00],
    [0x91, 0x10, 0x7F],
]);

values.set(key("[Channel1]", "loop_start_position"), -1);
values.set(key("[Channel1]", "loop_end_position"), -1);
resetWrites();
HCInstinctSeDa.loopButton(0, 0x09, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "loop_in", 1]);
resetWrites();
HCInstinctSeDa.loopButton(0, 0x0A, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "loop_out", 1]);
values.set(key("[Channel1]", "loop_start_position"), 100);
values.set(key("[Channel1]", "loop_end_position"), 200);
resetWrites();
HCInstinctSeDa.loopButton(0, 0x0A, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "reloop_exit", 1]);
resetWrites();
HCInstinctSeDa.loopButton(0, 0x0B, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "loop_halve", 1]);
resetWrites();
HCInstinctSeDa.loopButton(0, 0x0C, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "loop_double", 1]);

values.set(key("[Sampler1]", "track_loaded"), 1);
resetWrites();
HCInstinctSeDa.sampleButton(0, 0x05, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Sampler1]", "cue_gotoandplay", 1]);

values.set(key("[Sampler6]", "track_loaded"), 1);
resetWrites();
HCInstinctSeDa.sampleButton(0, 0x20, press, 0x91, "[Channel2]");
assert.deepEqual(lastTrigger(), ["[Sampler6]", "cue_gotoandplay", 1]);

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
const curvedDeckVolume = raw => {
    if (raw === 0) {
        return 0;
    }
    const normalized = raw / 127;
    const offset = Math.pow(10, HCInstinctSeDa.deckVolumeMinDb / 20);
    const db = HCInstinctSeDa.deckVolumeMinDb * (1 - normalized);
    return (Math.pow(10, db / 20) - offset) / (1 - offset);
};

assertDeckVolume(0, 0);
assertDeckVolume(32, curvedDeckVolume(32));
assertDeckVolume(64, curvedDeckVolume(64));
assertDeckVolume(95, curvedDeckVolume(95));
assertDeckVolume(127, 1);
assert(HCInstinctSeDa.deckVolumeValue(32) < 32 / 127);
assert(HCInstinctSeDa.deckVolumeValue(64) < 64 / 127);

HCInstinctSeDa.vinylButtonHandler(0, 0x35, press);
assert.equal(HCInstinctSeDa.scratchModeEnabled, false);
resetWrites();
HCInstinctSeDa.effectButton(0, 0x02, press, 0x91, "[Channel1]");
assert.deepEqual(writes.slice(-1)[0], [
    "[EffectRack1_EffectUnit2]",
    "group_[Channel1]_enable",
    1,
]);

console.log("Hercules SeDa next mapping behavior tests passed");
