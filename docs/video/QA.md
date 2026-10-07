# Walkthrough QA notes

File: `fleek-supply-sample-gate-walkthrough.mp4` (delivered as a download, not committed to the repo).

## Measured (ffprobe / ffmpeg filters)

```
stream|codec_name=h264|width=1080|height=1920|r_frame_rate=30/1
stream|codec_name=aac|r_frame_rate=0/0
format|duration=79.467000
```

| Check | Requirement | Result |
|---|---|---|
| Duration | 75-95 s | 79.5 s |
| Resolution | 1080x1920 vertical | 1080x1920, 30 fps, H.264 + AAC |
| Silence | none over 1.5 s | `silencedetect=n=-40dB:d=1.0` reported no silences of 1.0 s or more |
| Dead screen | none over 2.5 s | `freezedetect=n=0.001:d=2.0` reported one still of 2.37 s (22.6-25.0 s, evidence panel while narration continues); nothing longer |
| Footage | actual app, no slideshow | screen capture of the running app, real clicks and inputs |
| Required moments | sample entry, evidence gap, fail case, limited pilot, exported decision | scenes s2-s6, each labelled in the header chip |
| Captions | whole phrases, aligned to voice | one caption per narration line, shown from line start to end + 0.55 s |
| Zooms | restrained | crop never narrower than 650 CSS px (about 1.9x max), eased over 0.9 s, slow 3% push-in |
| Branding | footer and non-affiliation | footer band reads "independent concept by Ayomide Ahmed" / "Not an official Fleek product" throughout |
| Metadata | no tool attribution | encoded with `-map_metadata -1` |

## Visual review

Frames sampled at 3, 12, 22, 30, 38, 44, 52, 60, 68 and 77 s were inspected: header chip matches the narrated scene, zoom targets the discussed panel, captions do not overlap the footage.

## Known limits

- Wide shots of the full desk are small on a phone; detail relies on the zoomed segments.
- Voice is synthetic text-to-speech, so pacing is even rather than expressive.
