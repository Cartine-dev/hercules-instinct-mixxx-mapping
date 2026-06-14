# LED debug notes

## Confirmed result

The real Hercules DJControl Instinct VINYL LED responded to:

```text
91 35 7f
```

The explicit SeDa LED output family is therefore:

| Field | Value |
| --- | --- |
| Status | `0x91` |
| On | `0x7F` |
| Off | `0x00` |

This result overrides the older `0x90`/`0x80` output assumptions and the
technical-document polarity interpretation for this physical unit.

## Diagnostic sequence

### 1. Read the Mixxx log

```bash
rg -n 'PortMidiController|not open for output|Hercules DJControl Instinct MID' \
  ~/.mixxx/mixxx.log
```

The log showed Mixxx opening the Hercules input and output endpoints, followed
by repeated startup warnings:

```text
MIDI device "Hercules DJControl Instinct MID" not open for output!
```

That warning occurs during initialization and is useful diagnostic evidence,
but it does not by itself prove that all later MIDI output is unavailable.

### 2. Inspect the Mixxx output path

The relevant Mixxx sources were located with:

```bash
rg -n 'PortMidiController|not open for output' \
  src/controllers/midi
```

The warning is emitted by `midioutputhandler.cpp`; device open and short-message
output are handled by `portmidicontroller.cpp`.

### 3. Test raw MIDI with Mixxx closed

Mixxx must be closed so that `amidi` can own the raw MIDI port.

```bash
amidi -l
amidi -p <hercules-port> -S '91 35 7f'
amidi -p <hercules-port> -S '91 35 00'
```

The repository's tested probe sequence can be reproduced manually with the
same `amidi -p ... -S ...` form.

## Tested matrix

The VINYL note `0x35` was tested across the likely status/value combinations:

| Frame | Purpose | Result |
| --- | --- | --- |
| `90 35 7f` | historical note-on candidate | no confirmed response |
| `90 35 00` | historical same-status off candidate | no confirmed response |
| `80 35 00` | historical note-off candidate | no confirmed response |
| `91 35 7f` | channel-2 note-on candidate | **VINYL LED on confirmed** |
| `91 35 00` | channel-2 same-status off candidate | adopted as off |
| `81 35 00` | channel-2 note-off candidate | not adopted |

The same matrix should be repeated for transport, PFL, and loop LED notes
before those LEDs are promoted from "implemented" to "validated".

Candidate notes used by the SeDa prototype:

| Surface | Deck A | Deck B |
| --- | --- | --- |
| CUE | `0x15` | `0x2F` |
| PLAY | `0x16` | `0x30` |
| PFL | `0x18` | `0x32` |
| Loop buttons | `0x09-0x0C` | `0x23-0x26` |

## Implications

- New explicit LED sends should use `0x91`, `0x7F`, and `0x00`.
- Do not infer working LED output only from XML declarations or old maps.
- The published baseline still contains inherited static XML outputs using
  older statuses; treat those entries as cleanup debt, not the validated send
  contract.
- Validate each note physically before marking it as confirmed.
- Keep startup-warning investigation separate from input mapping and from raw
  hardware-frame validation.
