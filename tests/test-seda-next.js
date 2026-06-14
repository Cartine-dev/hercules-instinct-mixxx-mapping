const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const values = new Map();
const writes = [];
const key = (group, control) => `${group}|${control}`;

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
global.midi = { sendShortMsg() {} };
global.print = function() {};

vm.runInThisContext(fs.readFileSync(
    path.join(__dirname, "..", "controllers", "Hercules-DJ-Control-Instinct-SeDa-scripts.js"),
    "utf8"
));

const press = 0x7F;
const release = 0x00;
const lastTrigger = () => writes[writes.length - 2];
const resetWrites = () => writes.splice(0, writes.length);

HCInstinctSeDa.syncButton(0, 0x17, press, 0x91, "[Channel1]");
assert.equal(engine.getValue("[Channel1]", "sync_enabled"), 1);
HCInstinctSeDa.syncButton(0, 0x17, release, 0x91, "[Channel1]");
assert.equal(engine.getValue("[Channel1]", "sync_enabled"), 1);
HCInstinctSeDa.syncButton(0, 0x17, press, 0x91, "[Channel1]");
assert.equal(engine.getValue("[Channel1]", "sync_enabled"), 0);

resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0F, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_3_activate", 1]);

HCInstinctSeDa.vinylButtonHandler(0, 0x35, press);
assert.equal(HCInstinctSeDa.scratchModeEnabled, true);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0D, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_3_activate", 1]);
resetWrites();
HCInstinctSeDa.hotCueButton(0, 0x0F, press, 0x91, "[Channel1]");
assert.deepEqual(lastTrigger(), ["[Channel1]", "hotcue_3_clear", 1]);

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

values.set(key("[Sampler6]", "track_loaded"), 1);
resetWrites();
HCInstinctSeDa.sampleButton(0, 0x20, press, 0x91, "[Channel2]");
assert.deepEqual(lastTrigger(), ["[Sampler6]", "cue_gotoandplay", 1]);

HCInstinctSeDa.backButton(0, 0x2D, press, 0x91, "[Channel2]");
assert.equal(HCInstinctSeDa.captureActive["[Channel2]"], true);
HCInstinctSeDa.effectButton(0, 0x1C, press, 0x91, "[Channel2]");
assert.equal(HCInstinctSeDa.captureSlot["[Channel2]"], 2);
resetWrites();
HCInstinctSeDa.forwardButton(0, 0x2E, press, 0x91, "[Channel2]");
assert(writes.some((write) =>
    write[0] === "[Sampler6]" && write[1] === "LoadTrackFromDeck" && write[2] === 2
));
assert.equal(HCInstinctSeDa.captureActive["[Channel2]"], false);

HCInstinctSeDa.vinylButtonHandler(0, 0x35, press);
assert.equal(HCInstinctSeDa.scratchModeEnabled, false);
resetWrites();
HCInstinctSeDa.effectButton(0, 0x02, press, 0x91, "[Channel1]");
assert.deepEqual(writes.slice(-1)[0], [
    "[EffectRack1_EffectUnit2]",
    "group_[Channel1]_enable",
    1,
]);
resetWrites();
HCInstinctSeDa.backButton(0, 0x13, press, 0x91, "[Channel1]");
HCInstinctSeDa.backButton(0, 0x13, release, 0x91, "[Channel1]");
assert.deepEqual(writes.slice(-2), [
    ["[Channel1]", "back", 1],
    ["[Channel1]", "back", 0],
]);

console.log("Hercules SeDa next mapping behavior tests passed");
