# Hercules DJControl Instinct SeDa user guide

## Status language

- **Current baseline** describes the published controller files.
- **Planned next** describes the next mapping contract and is not implemented
  unless explicitly stated.
- Only behavior marked **physically validated** has passed the real-hardware
  gate.

## Audio setup

For the current practice setup:

- `Master`: USB-speaker interface, `Channels 1-2`.
- `Headphones`: computer built-in/P2 interface, `Channels 1-2`.

Press a deck's PFL/headphone button to hear that deck privately. Use Mixxx's
Pre/Main or Head Mix control to move between PFL-only monitoring, Master, or a
mixture of both.

The controller's own `Channels 1-2` and `Channels 3-4` routing is reserved for
a later setup where the speakers and headphones are connected to the
Hercules audio outputs.

## Transport

| Control | Current baseline |
| --- | --- |
| PLAY | Press-only play/pause toggle per deck |
| CUE | Mixxx `cue_default` per deck |
| PFL | Toggles private headphone monitoring per deck |
| SYNC | Momentary `beatsync`; persistent sync is planned next |
| Pitch buttons | Temporary pitch bend; pressing both resets rate |
| Jog | Jog normally; scratch on touch only when VINYL is active |
| VINYL | Global scratch/jog toggle; its LED shows the toggle state |
| Headphone `-`/`+` | Adjust Mixxx headphone gain |

## Action buttons 1-4

### Current baseline

| Mode | Buttons 1-4 |
| --- | --- |
| Hot Cue | `1=Hotcue 1 activate`, `2=Hotcue 2 activate`, `3=Hotcue 1 clear`, `4=Hotcue 2 clear` |
| Loop | `1=Loop In`, `2=Reloop/Exit`, `3=Loop Out`, `4=Halve` |
| Sample | Existing sampler playback triggers; behavior remains inherited and should be smoke-tested |
| Effect | Existing inherited effect-unit assignments; no immediate redesign |

### Planned next

| Mode | VINYL off | VINYL on |
| --- | --- | --- |
| Hot Cue | `1-4` activate hotcues `1-4` | `1-2` activate hotcues `3-4`; `3-4` clear hotcues `3-4` |
| Loop | `1=Loop In`, `2=Loop Out/Exit`, `3=Halve`, `4=Double` | No secondary loop actions specified yet |
| Sample | `1-4` play/select the deck's sample slots | Modifier participates in the planned capture flow |

The planned Hot Cue shift is an intentional expansion of hotcue reach, not
inherited historical behavior.

## Mode rules

### Current baseline

The published mapping retains the existing hardware/mapping behavior. Treat
all action modes as needing a regression smoke test before live use.

### Planned next

- Hot Cue, Loop, and Sample state are independent per deck. Deck A and Deck B
  may use different modes at the same time.
- Effect remains global.
- VINYL remains a global scratch toggle and becomes a secondary modifier.

## Planned sample capture flow

Playback and LED indication for existing samples are the first supported
target. Direct capture from a deck into a sampler remains conditional on a
clean Mixxx control path.

The planned operator flow is:

1. Press `VINYL + Back` for the target deck.
2. That deck enters Sample mode.
3. The deck Sample LED and candidate slot LEDs `1-4` illuminate.
4. Select the target slot.
5. Press `VINYL + Fast Forward` to finalize/commit the capture.

This flow is specification only until technical feasibility and hardware
behavior are confirmed.

## LED semantics

The explicit SeDa LED send family is:

| Meaning | MIDI value |
| --- | --- |
| Status | `0x91` |
| On | `0x7F` |
| Off | `0x00` |

The VINYL LED uses note `0x35` and is physically validated with
`91 35 7f`. Transport, PFL, and loop LEDs use the candidate notes listed in
[led-debug-notes.md](led-debug-notes.md) and remain awaiting physical gate
approval.

The current XML also retains inherited static output entries using older
statuses. The explicit script-side LED layer is the intended contract; the XML
output block remains cleanup debt until the physical gate is complete.

## Known limits

- The public baseline still maps SYNC to momentary `beatsync`.
- The planned per-deck mode model is not implemented in the published files.
- Direct deck-to-sampler capture is not validated in the legacy Mixxx control
  surface.
- Effect redesign is outside the immediate scope.
- Transport, PFL, loop, and non-VINYL LED behavior still require physical
  validation.
- Inherited static XML output entries still need reconciliation with the
  explicit script-side LED layer.
