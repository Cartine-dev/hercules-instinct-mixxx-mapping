# Hercules DJControl Instinct SeDa mapping for Mixxx

This repository preserves the historical Hercules DJControl Instinct mapping
and publishes the current SeDa prototype baseline plus the specification for
its next iteration.

The status labels below are deliberate:

- **Validated now** means confirmed on a real Hercules DJControl Instinct.
- **Implemented, awaiting validation** means present in the published SeDa
  controller files but not yet fully approved by the physical test gate.
- **Planned next** means specification only. It is not implemented or claimed
  as hardware-validated.

See [docs/version-status.md](docs/version-status.md) for the full status table
and [docs/user-guide.md](docs/user-guide.md) for operator instructions.

## Validated hardware findings

- The real device sends button and continuous-control input on `0x91` and
  `0xB1`, rather than the older `0x90` and `0xB0` assumptions found in parts
  of the historical mapping.
- The VINYL LED physically responded to the raw MIDI frame
  `91 35 7f`.
- The explicit SeDa LED layer therefore uses:
  - status: `0x91`
  - on: `0x7F`
  - off: `0x00`
- The startup warning
  `MIDI device "Hercules DJControl Instinct MID" not open for output!`
  can occur during Mixxx initialization. Its presence alone does not prove
  that the device cannot receive later output, so LED behavior must be checked
  physically.

The diagnostic sequence was:

1. inspect the Mixxx log;
2. inspect the Mixxx `PortMidiController` and MIDI output path;
3. close Mixxx and send raw frames with `amidi`;
4. confirm the frame that changed the physical LED.

The complete command record and tested matrix are in
[docs/led-debug-notes.md](docs/led-debug-notes.md).

## Current SeDa behavior

The controller files in `controllers/` match the currently installed SeDa
prototype baseline.

- Inputs use the real-device `0x91` and `0xB1` status families.
- PLAY uses one press-only toggle binding per deck.
- CUE and PFL remain deck-specific.
- VINYL is a global scratch/jog toggle with LED feedback.
- Headphone `-` and `+` adjust Mixxx `[Master],headGain`.
- The script has an explicit LED output layer for VINYL, transport, PFL, and
  loop indicators.
- The inherited XML still contains older static `0x90` output entries. They
  remain baseline debt and are not the authoritative LED-send contract.
- SYNC still uses the baseline momentary `beatsync` control.
- Hot Cue, Loop, Effect, and Sample retain the baseline mappings described in
  the user guide.

Only the VINYL LED frame is currently claimed as physically validated. Other
implemented LED and transport behaviors remain pending the hardware gate.
The explicit script-side LED layer should be validated before the inherited
XML output block is removed or rewritten.

## Next-version spec

The next iteration is specified but not implemented in the published
controller files:

- SYNC becomes a toggle of `sync_enabled`, with a persistent deck-state LED.
- VINYL remains the global scratch toggle and also acts as a secondary
  modifier.
- Hot Cue, Loop, and Sample modes become independent per deck.
- Effect remains global and outside the immediate redesign.
- Hot Cue without VINYL maps buttons `1-4` to hotcues `1-4`.
- Hot Cue with VINYL maps buttons `1-2` to hotcues `3-4`, and buttons `3-4`
  clear hotcues `3-4`.
- Loop follows the hardware manual model:
  `1=Loop In`, `2=Loop Out/Exit`, `3=Halve`, `4=Double`.
- Sample playback and slot indication are supported targets.
- Direct deck-to-sampler capture remains planned until a clean Mixxx control
  path is technically confirmed.

## Installation

See [INSTALL](INSTALL). The published files are:

- `controllers/Hercules DJ Control Instinct SeDa.midi.xml`
- `controllers/Hercules-DJ-Control-Instinct-SeDa-scripts.js`

## History and attribution

This repository started from the Hercules DJControl Instinct mapping by
[Stephan Martin](https://github.com/ratte/mixxxcontrollermapping), with later
community fixes. The SeDa baseline preserves that lineage while documenting
the behavior observed on the current physical unit.

## License

See [LICENSE](LICENSE).
