# FITREHAB NEXT — status (v2, 2026-10-14)

## Verified in this environment (Playwright Chromium, served over http://localhost)
- No JS/console errors on 390x844, 768x1024, 1360x860.
- Logging sets (reps/kg), auto rest timer + floating pill, finish workout, history details, weight log, meals, day navigation, quick-add meal.
- localStorage persistence across reload; JSON export -> clear -> import round trip; import of an old v1 backup.
- Service worker registers; app loads offline after first visit.
- No horizontal overflow on any page/viewport.

## Not verified
- Video playback (test Chromium has no H.264 codec; files are valid H.264/yuv420p per ffprobe).
- Real iOS/Android devices, Safari, install prompt, accessibility audit, security review.

## Still out of scope
- Accounts, cloud sync, backend. Medically reviewed rehab content. Human-filmed exercise videos.
