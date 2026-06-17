function HCInstinctSeDa() {}

HCInstinctSeDa.scratching = [false, false];
HCInstinctSeDa.scratchModeEnabled = false;
HCInstinctSeDa.samplerSlots = {
    "[Channel1]": [1, 2, 3, 4],
    "[Channel2]": [5, 6, 7, 8],
};
HCInstinctSeDa.pitchSwitches = {
    A: [0, 0],
    B: [0, 0],
};
// Controller-debug capture on 2026-06-14 showed both deck volume faders use a
// full bottom-to-top raw span of 0x00-0x7F on this controller unit.
HCInstinctSeDa.deckVolumeRawMin = 0x00;
HCInstinctSeDa.deckVolumeRawMax = 0x7F;
HCInstinctSeDa.deckVolumeMinDb = -20;
// Direct raw-MIDI probing on the Hercules output port confirmed note-on on
// channel 2 (0x91) with value 0x7F for the VINYL LED.
HCInstinctSeDa.ledStatus = 0x91;
HCInstinctSeDa.ledOnValue = 0x7F;
HCInstinctSeDa.ledOffValue = 0x00;
HCInstinctSeDa.ledNotes = {
    scratch: 0x35,
    play: {
        "[Channel1]": 0x16,
        "[Channel2]": 0x30,
    },
    cue: {
        "[Channel1]": 0x15,
        "[Channel2]": 0x2F,
    },
    pfl: {
        "[Channel1]": 0x18,
        "[Channel2]": 0x32,
    },
    sync: {
        "[Channel1]": 0x17,
        "[Channel2]": 0x31,
    },
    hotCue: {
        "[Channel1]": [0x0D, 0x0E, 0x0F, 0x10],
        "[Channel2]": [0x27, 0x28, 0x29, 0x2A],
    },
    sample: {
        "[Channel1]": [0x05, 0x06, 0x07, 0x08],
        "[Channel2]": [0x1F, 0x20, 0x21, 0x22],
    },
    loop: {
        "[Channel1]": [0x09, 0x0A, 0x0B, 0x0C],
        "[Channel2]": [0x23, 0x24, 0x25, 0x26],
    },
};
HCInstinctSeDa.ledConnections = [];

HCInstinctSeDa.init = function(id) {
    HCInstinctSeDa.id = id;
    if (engine.getValue("[App]", "num_samplers") < 8) {
        engine.setValue("[App]", "num_samplers", 8);
    }
    HCInstinctSeDa.connectLeds();
    engine.beginTimer(500, HCInstinctSeDa.syncLeds, true);
    print("***** Hercules DJ Instinct Control id: \"" + id + "\" initialized.");
};

HCInstinctSeDa.shutdown = function(id) {
    for (var i = 0; i < HCInstinctSeDa.ledConnections.length; i++) {
        HCInstinctSeDa.ledConnections[i].disconnect();
    }
    HCInstinctSeDa.ledConnections = [];
    HCInstinctSeDa.allLedOff();
    print("***** Hercules DJ Instinct Control id: \"" + id + "\" shutdown.");
};

HCInstinctSeDa.sendLed = function(note, enabled) {
    midi.sendShortMsg(HCInstinctSeDa.ledStatus, note, enabled ? HCInstinctSeDa.ledOnValue : HCInstinctSeDa.ledOffValue);
};

HCInstinctSeDa.allLedOff = function() {
    var groups = ["[Channel1]", "[Channel2]"];
    HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.scratch, false);
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.play[group], false);
        HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.cue[group], false);
        HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.pfl[group], false);
        HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.sync[group], false);
        for (var h = 0; h < HCInstinctSeDa.ledNotes.hotCue[group].length; h++) {
            HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.hotCue[group][h], false);
        }
        for (var s = 0; s < HCInstinctSeDa.ledNotes.sample[group].length; s++) {
            HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.sample[group][s], false);
        }
        for (var j = 0; j < HCInstinctSeDa.ledNotes.loop[group].length; j++) {
            HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.loop[group][j], false);
        }
    }
};

HCInstinctSeDa.updateScratchModeLed = function() {
    HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.scratch, HCInstinctSeDa.scratchModeEnabled);
    HCInstinctSeDa.updateHotCueLeds("[Channel1]");
    HCInstinctSeDa.updateHotCueLeds("[Channel2]");
};

HCInstinctSeDa.updateDeckLeds = function(group) {
    var loopNotes = HCInstinctSeDa.ledNotes.loop[group];
    var loopActive = engine.getValue(group, "loop_enabled") > 0;
    HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.play[group], engine.getValue(group, "play") > 0);
    HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.cue[group], engine.getValue(group, "cue_indicator") > 0);
    HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.pfl[group], engine.getValue(group, "pfl") > 0);
    HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.sync[group], engine.getValue(group, "sync_enabled") > 0);
    HCInstinctSeDa.sendLed(loopNotes[0], engine.getValue(group, "loop_start_position") >= 0);
    HCInstinctSeDa.sendLed(loopNotes[1], engine.getValue(group, "loop_end_position") >= 0);
    HCInstinctSeDa.sendLed(loopNotes[2], loopActive);
    // LOOP 3/4 change length and have no persistent state; show when a loop is active.
    HCInstinctSeDa.sendLed(loopNotes[3], loopActive);
    HCInstinctSeDa.updateHotCueLeds(group);
    HCInstinctSeDa.updateSampleLeds(group);
};

HCInstinctSeDa.updateHotCueLeds = function(group) {
    var notes = HCInstinctSeDa.ledNotes.hotCue[group];
    var enabled = [];
    for (var i = 1; i <= 4; i++) {
        enabled.push(engine.getValue(group, "hotcue_" + i + "_enabled") > 0);
    }
    var shown = HCInstinctSeDa.scratchModeEnabled ?
        [enabled[2], enabled[3], enabled[2], enabled[3]] :
        [enabled[0], enabled[1], enabled[0], enabled[1]];
    for (var j = 0; j < notes.length; j++) {
        HCInstinctSeDa.sendLed(notes[j], shown[j]);
    }
};

HCInstinctSeDa.updateSampleLeds = function(group) {
    var notes = HCInstinctSeDa.ledNotes.sample[group];
    var slots = HCInstinctSeDa.samplerSlots[group];
    for (var i = 0; i < notes.length; i++) {
        HCInstinctSeDa.sendLed(
            notes[i],
            engine.getValue("[Sampler" + slots[i] + "]", "track_loaded") > 0
        );
    }
};

HCInstinctSeDa.syncLeds = function() {
    HCInstinctSeDa.updateScratchModeLed();
    HCInstinctSeDa.updateDeckLeds("[Channel1]");
    HCInstinctSeDa.updateDeckLeds("[Channel2]");
};

HCInstinctSeDa.connectLeds = function() {
    var groups = ["[Channel1]", "[Channel2]"];
    var controls = [
        "play", "cue_indicator", "pfl", "sync_enabled", "loop_start_position",
        "loop_enabled", "loop_end_position", "hotcue_1_enabled",
        "hotcue_2_enabled", "hotcue_3_enabled", "hotcue_4_enabled",
    ];
    for (var i = 0; i < groups.length; i++) {
        (function(group) {
            for (var j = 0; j < controls.length; j++) {
                HCInstinctSeDa.ledConnections.push(
                    engine.makeConnection(group, controls[j], function() {
                        HCInstinctSeDa.updateDeckLeds(group);
                    })
                );
            }
            var slots = HCInstinctSeDa.samplerSlots[group];
            for (var k = 0; k < slots.length; k++) {
                (function(samplerGroup) {
                    HCInstinctSeDa.ledConnections.push(
                        engine.makeConnection(samplerGroup, "track_loaded", function() {
                            HCInstinctSeDa.updateSampleLeds(group);
                        })
                    );
                })("[Sampler" + slots[k] + "]");
            }
        })(groups[i]);
    }
};

HCInstinctSeDa.triggerControl = function(group, control) {
    engine.setValue(group, control, 1);
    engine.setValue(group, control, 0);
};

HCInstinctSeDa.playButton = function(channel, control, value, status, group) {
    if (value !== 0x7F) {
        return;
    }
    engine.setValue(group, "play", engine.getValue(group, "play") ? 0 : 1);
};

HCInstinctSeDa.vinylButtonHandler = function(channel, control, value) {
    if (value !== 0x7F) {
        return;
    }
    HCInstinctSeDa.scratchModeEnabled = !HCInstinctSeDa.scratchModeEnabled;
    if (!HCInstinctSeDa.scratchModeEnabled) {
        HCInstinctSeDa.disableScratch(0);
        HCInstinctSeDa.disableScratch(1);
    }
    HCInstinctSeDa.updateScratchModeLed();
};

HCInstinctSeDa.syncButton = function(channel, control, value, status, group) {
    if (value !== 0x7F) {
        return;
    }
    engine.setValue(group, "sync_enabled", engine.getValue(group, "sync_enabled") ? 0 : 1);
};

HCInstinctSeDa.hotCueButton = function(channel, control, value, status, group) {
    if (value !== 0x7F) {
        return;
    }
    var base = group === "[Channel1]" ? 0x0D : 0x27;
    var button = control - base + 1;
    var hotCue = button <= 2 ? button : button - 2;
    var action = button <= 2 ? "activate" : "clear";
    if (HCInstinctSeDa.scratchModeEnabled) {
        hotCue += 2;
    }
    HCInstinctSeDa.triggerControl(group, "hotcue_" + hotCue + "_" + action);
};

HCInstinctSeDa.loopButton = function(channel, control, value, status, group) {
    if (value !== 0x7F) {
        return;
    }
    var base = group === "[Channel1]" ? 0x09 : 0x23;
    var button = control - base + 1;
    if (button === 1) {
        HCInstinctSeDa.triggerControl(group, "loop_in");
    } else if (button === 2) {
        var hasLoop = engine.getValue(group, "loop_start_position") >= 0 &&
            engine.getValue(group, "loop_end_position") >= 0;
        HCInstinctSeDa.triggerControl(group, hasLoop ? "reloop_exit" : "loop_out");
    } else if (button === 3) {
        HCInstinctSeDa.triggerControl(group, "loop_halve");
    } else if (button === 4) {
        HCInstinctSeDa.triggerControl(group, "loop_double");
    }
};

HCInstinctSeDa.sampleButton = function(channel, control, value, status, group) {
    if (value !== 0x7F) {
        return;
    }
    var base = group === "[Channel1]" ? 0x05 : 0x1F;
    var button = control - base + 1;
    var sampler = HCInstinctSeDa.samplerSlots[group][button - 1];
    if (engine.getValue("[Sampler" + sampler + "]", "track_loaded") > 0) {
        HCInstinctSeDa.triggerControl("[Sampler" + sampler + "]", "cue_gotoandplay");
    }
};

HCInstinctSeDa.deckVolumeValue = function(value) {
    var normalized = (value - HCInstinctSeDa.deckVolumeRawMin) /
        (HCInstinctSeDa.deckVolumeRawMax - HCInstinctSeDa.deckVolumeRawMin);
    normalized = Math.max(0, Math.min(1, normalized));
    if (normalized === 0) {
        return 0;
    }
    var offset = Math.pow(10, HCInstinctSeDa.deckVolumeMinDb / 20);
    var db = HCInstinctSeDa.deckVolumeMinDb * (1 - normalized);
    return (Math.pow(10, db / 20) - offset) / (1 - offset);
};

HCInstinctSeDa.deckVolume = function(channel, control, value, status, group) {
    engine.setValue(group, "volume", HCInstinctSeDa.deckVolumeValue(value));
};

HCInstinctSeDa.effectButton = function(channel, control, value, status, group) {
    if (value !== 0x7F) {
        return;
    }
    var base = group === "[Channel1]" ? 0x01 : 0x1B;
    var button = control - base + 1;
    var effectGroup = "[EffectRack1_EffectUnit" + button + "]";
    var effectControl = "group_" + group + "_enable";
    engine.setValue(effectGroup, effectControl, engine.getValue(effectGroup, effectControl) ? 0 : 1);
};

HCInstinctSeDa.enableScratch = function(deckIndex) {
    var alpha = 1.0 / 8;
    var beta = alpha / 32;
    engine.scratchEnable(deckIndex + 1, 128, 33 + 1 / 3, alpha, beta);
    HCInstinctSeDa.scratching[deckIndex] = true;
};

HCInstinctSeDa.disableScratch = function(deckIndex) {
    if (HCInstinctSeDa.scratching[deckIndex]) {
        engine.scratchDisable(deckIndex + 1);
    }
    HCInstinctSeDa.scratching[deckIndex] = false;
};

HCInstinctSeDa.handleWheelTouch = function(deckIndex, value) {
    if (!HCInstinctSeDa.scratchModeEnabled) {
        if (value !== 0x7F) {
            HCInstinctSeDa.disableScratch(deckIndex);
        }
        return;
    }
    if (value === 0x7F && !HCInstinctSeDa.scratching[deckIndex]) {
        HCInstinctSeDa.enableScratch(deckIndex);
        return;
    }
    HCInstinctSeDa.disableScratch(deckIndex);
};

HCInstinctSeDa.wheelTouch0 = function(channel, control, value) {
    HCInstinctSeDa.handleWheelTouch(0, value);
};

HCInstinctSeDa.wheelTouch1 = function(channel, control, value) {
    HCInstinctSeDa.handleWheelTouch(1, value);
};

HCInstinctSeDa.signedValue = function(value) {
    return value > 64 ? value - 128 : value;
};

HCInstinctSeDa.handleWheelTurn = function(deckIndex, value, group) {
    var delta = HCInstinctSeDa.signedValue(value);
    if (HCInstinctSeDa.scratching[deckIndex]) {
        engine.scratchTick(deckIndex + 1, delta);
        return;
    }
    engine.setValue(group, "jog", delta);
};

HCInstinctSeDa.wheelTurn0 = function(channel, control, value, status, group) {
    HCInstinctSeDa.handleWheelTurn(0, value, group);
};

HCInstinctSeDa.wheelTurn1 = function(channel, control, value, status, group) {
    HCInstinctSeDa.handleWheelTurn(1, value, group);
};

HCInstinctSeDa.pitch = function(midino, control, value, status, group) {
    var state = value === 0x7F ? 1 : 0;
    switch (control) {
        case 0x11:
            HCInstinctSeDa.pitchSwitches.A[0] = state;
            engine.setValue(group, "rate_temp_down", state);
            break;
        case 0x12:
            HCInstinctSeDa.pitchSwitches.A[1] = state;
            engine.setValue(group, "rate_temp_up", state);
            break;
        case 0x2B:
            HCInstinctSeDa.pitchSwitches.B[0] = state;
            engine.setValue(group, "rate_temp_down", state);
            break;
        case 0x2C:
            HCInstinctSeDa.pitchSwitches.B[1] = state;
            engine.setValue(group, "rate_temp_up", state);
            break;
    }
    if (HCInstinctSeDa.pitchSwitches.A[0] && HCInstinctSeDa.pitchSwitches.A[1]) {
        engine.setValue(group, "rate", 0);
    }
    if (HCInstinctSeDa.pitchSwitches.B[0] && HCInstinctSeDa.pitchSwitches.B[1]) {
        engine.setValue(group, "rate", 0);
    }
};

HCInstinctSeDa.tempPitch = function(midino, control, value, status, group) {
    var rate = value === 0x7F ? "rate_perm_down" : "rate_perm_up";
    engine.setValue(group, rate, 1);
    engine.setValue(group, rate, 0);
};

HCInstinctSeDa.adjustHeadphoneGain = function(delta, value) {
    if (value !== 0x7F) {
        return;
    }
    var current = engine.getValue("[Master]", "headGain");
    var next = Math.max(0.0, Math.min(1.0, current + delta));
    engine.setValue("[Master]", "headGain", next);
};

HCInstinctSeDa.headphoneGainDown = function(channel, control, value) {
    HCInstinctSeDa.adjustHeadphoneGain(-0.05, value);
};

HCInstinctSeDa.headphoneGainUp = function(channel, control, value) {
    HCInstinctSeDa.adjustHeadphoneGain(0.05, value);
};
