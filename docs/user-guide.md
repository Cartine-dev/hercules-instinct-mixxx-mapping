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
| Jog | VINYL off: normal jog unless a loop is active, then the jog resizes the loop end through `loop_scale`; VINYL on: scratch on touch |
| VINYL | Global scratch/jog toggle; its LED shows the toggle state |
| Headphone `-`/`+` | Adjust Mixxx headphone gain |

## Action buttons 1-4

### Implemented behavior

| Mode | Buttons 1-4 |
| --- | --- |
| Hot Cue, VINYL off | `1-4` perform hotcues `1-4` with `hotcue_X_gotoandplay` |
| Hot Cue, VINYL on | `1-4` perform hotcues `5-8` with `hotcue_X_gotoandplay` |
| Loop | `1=4-beat emergency loop` via `beatloop_4_activate`, `2=loop exit/re-toggle` via `reloop_toggle`, `3=move active loop backward one beat`, `4=move active loop forward one beat` |
| Sample | `1-4` play the four sampler slots assigned to that deck |
| Effect | Existing inherited effect-unit assignments; no immediate redesign |

This redesign is implemented in the published mapping and still requires both
hardware validation and one later real-track practice pass to confirm that it
is musically useful for the current funk/eletrohits lane.

## Mode rules

- The Hercules emits separate Hot Cue, Loop, and Sample action banks for each
  deck, so Deck A and Deck B actions remain independent.
- Effect behavior remains inherited and outside the immediate redesign.
- VINYL is a global scratch toggle and secondary modifier.
- In Hot Cue mode, VINYL now selects hotcues `5-8` as a second performance
  bank. Direct controller-side hotcue set/edit is intentionally out of scope
  in this pass.
- In Loop mode, VINYL-off is the implemented performance path. Advanced
  VINYL-plus-Loop saved-loop behavior remains future work.
- Deck A Back/Fast Forward and Deck B Fast Forward retain normal bindings.
- Deck B Back remains assigned to `0x2d`; if the button emits no MIDI, it
  requires hardware repair or an intentional remap to another control.

## Mixxx Control Choices

- Hot Cue bank A: `hotcue_1-4_gotoandplay`
- Hot Cue bank B: `hotcue_5-8_gotoandplay`
- Emergency loop: `beatloop_4_activate`
- Loop exit/re-toggle: `reloop_toggle`
- Loop move backward: `loop_move_1_backward`
- Loop move forward: `loop_move_1_forward`
- Jog loop-end adjustment with an active loop: `loop_scale`

These choices follow the Mixxx deck controls directly: Beatloop creates the
short emergency loop, Reloop toggles the current loop, loop movement gives
coarse one-beat repositioning, and loop scaling keeps the jog as the finer
loop-end adjustment tool.

## Deck volume

Deck volume now uses a full-throw-first linear mapping from raw MIDI
`0x00-0x7F` to Mixxx `[ChannelN],volume` `0.0-1.0`.

This pass prioritizes matching physical throw to on-screen/software throw.
If the loudness feel becomes too abrupt, that retune belongs in a later
follow-up after the live hardware sweep is documented.

## Jog behavior

- with no active loop, jog stays normal nudge behavior
- with an active loop and VINYL off, jog resizes the loop end through
  `loop_scale`
- with VINYL on, jog keeps scratch behavior when touched

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

Hot Cue LEDs currently mirror hotcues `1-4` directly on buttons `1-4` in both
VINYL states. With VINYL on, the buttons still trigger hotcues `5-8`, so the
LED policy itself remains part of the hardware validation gate.

The inherited static XML output block was removed. The explicit script-side
LED layer is now the single LED output path.

## Known limits

- The newly implemented SYNC, mode, modifier, and LED behavior still
  needs physical validation.
- The redesign still needs one prepared real track and human practice before it
  can be called musically confirmed.
- Hot Cue bank switching, Loop `3-4` move behavior, and deck-volume full-throw
  must all pass the next live Mixxx hardware sweep.
- The script cannot force the Hercules hardware's physical mode selector or
  mode indicator.
- Effect redesign is outside the immediate scope.
- VINYL + Loop saved-loop behavior is intentionally deferred.
- Transport, PFL, loop, and non-VINYL LED behavior still require physical
  validation.
