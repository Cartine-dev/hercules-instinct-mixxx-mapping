# Version status

| Area | Validated now | Implemented, awaiting hardware validation | Planned next |
| --- | --- | --- | --- |
| Input status | Real device uses `0x91`/`0xB1` | Published XML uses those statuses | None |
| LED family | VINYL responds to `91 35 7f` | Explicit script-side `0x91`, on `0x7F`, off `0x00` layer; inherited XML outputs remain debt | Validate every mapped LED note and reconcile XML outputs |
| PLAY/CUE/PFL | Core inputs unlocked after status repair | SeDa transport/PFL bindings and LEDs | Complete physical gate |
| SYNC | No persistent toggle claim | Baseline momentary `beatsync` | Toggle `sync_enabled` plus persistent LED |
| VINYL | LED frame physically confirmed | Global scratch/jog toggle | Also acts as secondary modifier |
| Hot Cue | No next-matrix claim | Baseline hotcue behavior | Per-deck expanded matrix |
| Loop | Hardware manual provides conceptual target | Baseline loop behavior | Per-deck QSG matrix |
| Sample | Existing sample playback controls are available | Baseline sampler triggers | Per-deck mode and slot LEDs |
| Deck capture | Not validated | Not implemented | Feasibility-gated deck-to-sampler capture |
| Effect | Existing inherited behavior | Baseline mapping retained | Global; no immediate redesign |
| Audio routing | Mixxx manual supports two-interface setup | Configuration documented | Hercules integrated-output setup later |
