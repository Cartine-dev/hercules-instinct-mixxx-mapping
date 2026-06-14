# Version status

| Area | Validated now | Implemented, awaiting hardware validation | Planned next |
| --- | --- | --- | --- |
| Input status | Real device uses `0x91`/`0xB1` | Published XML uses those statuses | None |
| LED family | VINYL responds to `91 35 7f` | Explicit script-side `0x91`, on `0x7F`, off `0x00` single output path | Validate every mapped LED note |
| PLAY/CUE/PFL | Core inputs unlocked after status repair | SeDa transport/PFL bindings and LEDs | Complete physical gate |
| SYNC | Previous momentary behavior observed | Toggle `sync_enabled` plus persistent LED | Physical validation |
| VINYL | LED frame physically confirmed | Global scratch/jog toggle plus secondary modifier | Physical validation |
| Hot Cue | Previous baseline observed | `VINYL off: 1-2 activate, 3-4 clear hotcues 1-2`; `VINYL on: 1-2 activate, 3-4 clear hotcues 3-4` | Physical validation |
| Loop | Hardware manual provides conceptual target | Per-deck QSG matrix | Physical validation |
| Sample | Existing sample playback controls are available | Four slots per deck plus slot LEDs | Physical validation |
| Back/Fast Forward | Historical deck controls exist | Original per-deck `back`/`fwd` restored with normal press/release handling | Physical validation |
| Effect | Existing inherited behavior | Baseline mapping retained | Global; no immediate redesign |
| Audio routing | Mixxx manual supports two-interface setup | Configuration documented | Hercules integrated-output setup later |
