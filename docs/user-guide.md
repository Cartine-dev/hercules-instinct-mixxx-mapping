# Hercules DJControl Instinct SeDa user guide

## Status language

- **Current baseline** describes the published controller files.
- **Implemented, awaiting validation** describes behavior present in the
  controller files that still needs the physical gate.
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
| SYNC | Toggles persistent `sync_enabled`; LED follows deck state |
| Pitch buttons | Temporary pitch bend; pressing both resets rate |
| Jog | Jog normally; scratch on touch only when VINYL is active |
| VINYL | Global scratch/jog toggle; its LED shows the toggle state |
| Headphone `-`/`+` | Adjust Mixxx headphone gain |

## Action buttons 1-4

### Implemented behavior

| Mode | Buttons 1-4 |
| --- | --- |
| Hot Cue, VINYL off | `1-2` activate hotcues `1-2`; `3-4` clear hotcues `1-2` |
| Hot Cue, VINYL on | `1-2` activate hotcues `3-4`; `3-4` clear hotcues `3-4` |
| Loop | `1=Loop In`, `2=Loop Out/Exit`, `3=Halve`, `4=Double` |
| Sample | `1-4` play the four sampler slots assigned to that deck |
| Effect | Existing inherited effect-unit assignments; no immediate redesign |

The Hot Cue shift is an intentional expansion of hotcue reach, not
inherited historical behavior.

## Mode rules

- The Hercules emits separate Hot Cue, Loop, and Sample action banks for each
  deck, so Deck A and Deck B actions remain independent.
- Effect behavior remains inherited and outside the immediate redesign.
- VINYL is a global scratch toggle and secondary modifier.
- Deck A Back/Fast Forward and Deck B Fast Forward retain normal bindings.
- Deck B Back remains assigned to `0x2d`; if the button emits no MIDI, it
  requires hardware repair or an intentional remap to another control.

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

Hot Cue LEDs follow the active Hot Cue pair:

- VINYL off: buttons `1/3` mirror hotcue `1`, and `2/4` mirror hotcue `2`.
- VINYL on: buttons `1/3` mirror hotcue `3`, and `2/4` mirror hotcue `4`.

The inherited static XML output block was removed. The explicit script-side
LED layer is now the single LED output path.

## Known limits

- The newly implemented SYNC, mode, modifier, and LED behavior still
  needs physical validation.
- The script cannot force the Hercules hardware's physical mode selector or
  mode indicator.
- Effect redesign is outside the immediate scope.
- Transport, PFL, loop, and non-VINYL LED behavior still require physical
  validation.
