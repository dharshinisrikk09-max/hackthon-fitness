# Audio placeholder folder

The Music/Relaxation activity currently generates calming sounds directly in
the browser (via the Web Audio API) so the app works fully offline with no
licensing concerns for this hackathon build.

To use real royalty-free audio instead:

1. Drop `.mp3` files here, e.g.:
   - `nature.mp3`
   - `rain.mp3`
   - `calm.mp3`
   - `focus.mp3`
2. In `static/js/activity.js`, inside the MUSIC section, replace the
   `startSound` / `stopSound` functions with simple `<audio>` element
   play/pause calls pointing at `/static/audio/<name>.mp3`.

Good royalty-free sources: freesound.org (check license per file),
YouTube Audio Library, or Pixabay Audio.
