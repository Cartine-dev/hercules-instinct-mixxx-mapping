function HCInstinctSeDa() {}

HCInstinctSeDa.scratching = [false, false];
HCInstinctSeDa.scratchModeEnabled = false;
HCInstinctSeDa.pitchSwitches = {
    A: [0, 0],
    B: [0, 0],
};
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
    loop: {
        "[Channel1]": [0x09, 0x0A, 0x0B, 0x0C],
        "[Channel2]": [0x23, 0x24, 0x25, 0x26],
    },
};
HCInstinctSeDa.ledConnections = [];

HCInstinctSeDa.init = function(id) {
    HCInstinctSeDa.id = id;
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
        for (var j = 0; j < HCInstinctSeDa.ledNotes.loop[group].length; j++) {
            HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.loop[group][j], false);
        }
    }
};

HCInstinctSeDa.updateScratchModeLed = function() {
    HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.scratch, HCInstinctSeDa.scratchModeEnabled);
};

HCInstinctSeDa.updateDeckLeds = function(group) {
    var loopNotes = HCInstinctSeDa.ledNotes.loop[group];
    var loopActive = engine.getValue(group, "loop_enabled") > 0;
    HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.play[group], engine.getValue(group, "play") > 0);
    HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.cue[group], engine.getValue(group, "cue_indicator") > 0);
    HCInstinctSeDa.sendLed(HCInstinctSeDa.ledNotes.pfl[group], engine.getValue(group, "pfl") > 0);
    HCInstinctSeDa.sendLed(loopNotes[0], engine.getValue(group, "loop_start_position") >= 0);
    HCInstinctSeDa.sendLed(loopNotes[1], engine.getValue(group, "loop_end_position") >= 0);
    HCInstinctSeDa.sendLed(loopNotes[2], loopActive);
    // LOOP 4 runs loop_halve, which has no persistent state; show when a loop is active.
    HCInstinctSeDa.sendLed(loopNotes[3], loopActive);
};

HCInstinctSeDa.syncLeds = function() {
    HCInstinctSeDa.updateScratchModeLed();
    HCInstinctSeDa.updateDeckLeds("[Channel1]");
    HCInstinctSeDa.updateDeckLeds("[Channel2]");
};

HCInstinctSeDa.connectLeds = function() {
    var groups = ["[Channel1]", "[Channel2]"];
    var controls = ["play", "cue_indicator", "pfl", "loop_start_position", "loop_enabled", "loop_end_position"];
    for (var i = 0; i < groups.length; i++) {
        (function(group) {
            for (var j = 0; j < controls.length; j++) {
                HCInstinctSeDa.ledConnections.push(
                    engine.makeConnection(group, controls[j], function() {
                        HCInstinctSeDa.updateDeckLeds(group);
                    })
                );
            }
        })(groups[i]);
    }
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
