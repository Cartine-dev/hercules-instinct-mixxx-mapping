# Version status

| Area | Validated now | Implemented, awaiting hardware validation | Planned next |
| --- | --- | --- | --- |
| Input status | Real device uses `0x91`/`0xB1` | Published XML uses those statuses | None |
| LED family | VINYL responds to `91 35 7f` | Explicit script-side `0x91`, on `0x7F`, off `0x00` single output path | Validate every mapped LED note |
| PLAY/CUE/PFL | Core inputs unlocked after status repair | SeDa transport/PFL bindings and LEDs | Complete physical gate |
| SYNC | Previous momentary behavior observed | Toggle `sync_enabled` plus persistent LED | Physical validation |
| VINYL | LED frame physically confirmed | Global scratch/jog toggle plus secondary modifier | Physical validation |
| Hot Cue | Previous baseline observed | `VINYL off: 1-4 -> hotcue_1-4_gotoandplay`; `VINYL on: 1-4 -> hotcue_5-8_gotoandplay` | Physical validation plus LED-policy confirmation for the `5-8` bank |
| Loop | Hardware manual and Mixxx deck controls provide the target model | `1=beatloop_4_activate`, `2=reloop_toggle`, `3=loop_move_1_backward`, `4=loop_move_1_forward` | Physical validation; adjust only the move step size if one beat feels wrong |
| Jog | Basic jog and scratch path was previously observed | no loop: normal `jog`; active loop with VINYL off: `loop_scale`; VINYL on: scratch unchanged | Physical validation plus one real-track musical confirmation |
| Sample | Existing sample playback controls are available | Four slots per deck plus slot LEDs | Physical validation |
| Live redesign gate | Earlier controller baseline is approved in basic real use | This consolidation still needs one explicit live Mixxx pass for hotcues, loops, LEDs, and deck-fader travel | Run the hardware checklist before calling the redesign validated |
| Back/Fast Forward | Focused capture received `0x2e` press/release but no `0x2d`; Deck B Back is the isolated hardware failure | Original bindings retained because a mapping cannot repair a button that emits no MIDI | Hardware repair or intentional alternate-button remap |
| Deck volume | Controller-debug capture showed `0x00-0x7F` on both faders | Shared `deckVolume` handler now maps that full span linearly to `[ChannelN],volume` `0.0-1.0` | Validate on-screen slider travel at 0/25/50/75/100 before any feel retune |
| Effect | Existing inherited behavior | Baseline mapping retained | Global; no immediate redesign |
| Audio routing | Mixxx manual supports two-interface setup | Configuration documented | Hercules integrated-output setup later |
