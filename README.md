# The Perfect Escape

An interactive surprise-trip gift for Mamasita, built with plain HTML, CSS and JavaScript (no frameworks, no backend).

## The flow (8 screens)
0. **Birthday envelope**, in a soft Mediterranean stationery style: sand background, ivory paper, blue-gray text and a small olive sprig. It shows "For Mamasita", "Happy Birthday" and "A little something for you." Tapping the envelope or **Open your letter** opens it: the flap lifts and the letter slides out. Then the full letter appears, with no typing effect and no automatic advance, followed by **Discover your surprise →**. The envelope texts and the letter live in `CONFIG.birthday` and are treated as plain text.
1. **Welcome**: a full-screen Mediterranean photo with "THE PERFECT ESCAPE" and a **LET'S BEGIN →** button.
2. **Five questions**: wine, sunshine, food, beach, boats. Each has its own photo or illustration, an animated icon, a stamp and a short reaction. Answers are stored but never change the destination.
3. **Boat moment**: continues on its own, with no button.
   - NO: "Oh, I thought about that. 😉" → the boat sails away → the airplane arrives → "Don't worry. I had a Plan B all along. ✈️" → "Good news... we're flying!" → the plane flies on.
   - YES: "Interesting choice! 😉" → "But I think you'll like my Plan B even more..." → the airplane arrives and flies on.
4. **Destination analysis** (about 5 seconds): a playful split-flap board that rejects other cities and ends on "CLASSIFIED".
5. **Flight route**: a golden route from Oslo across a dotted map of Europe. The destination stays "? ? ?".
6. **Countdown 3-2-1 and the Málaga reveal**: a photo, gold confetti, three Málaga photos and a **REVEAL MY TICKET ✈️** button.
7. **Ticket**: an ivory boarding-pass voucher with the buttons **ACCEPT THIS ADVENTURE ✈️**, **DOWNLOAD YOUR GIFT 🎁** (PDF) and **Print-friendly version**.

## Run it
- **Locally**: keep the folder together and double-click `index.html`. Everything works offline, PDF included. With internet it also loads the Google Fonts (Playfair Display, DM Sans and DM Mono). Without internet it falls back to system fonts.
- **Online (free)**:
  - **Netlify Drop**: drag the folder onto https://app.netlify.com/drop.
  - **GitHub Pages**: push the folder to a repository, then go to Settings → Pages → Deploy from branch (`main`, `/root`).
- **Home screen**: on iPhone use Safari → Share → Add to Home Screen. On Android use Chrome → ⋮ → Add to Home screen. It gets its own icon, "Perfect Escape".

## Edit it
Everything you'd want to change is in the `CONFIG` object at the top of `script.js`:
- passenger name, from/to (codes, cities, country, region, coordinates), transport, dates, the boats note, status texts, the ticket footer and the accept message;
- the questions, reactions and stamps, and the boat-scene dialogue (`boatNo`, `boatYes`);
- the photos (`images`). Set one to `null` to fall back to the illustration.

Note: the map route is drawn for **Oslo → Málaga**. Changing the city names updates every label, the ticket and the PDF, but not the map geometry. That path lives in `index.html` (`#route-path`).

## Good to know
- **Accepting** only updates this page and is remembered on that phone (localStorage). Nothing is sent anywhere. **Replay** goes back to the closed birthday envelope and restarts everything, but keeps the acceptance. Reloading keeps it too. Opening the letter never accepts anything.
- **Sound** is off by default. Use the speaker button at the top right to turn it on. Sounds are generated in the browser, with no audio files. On iPhone the silent switch mutes them.
- **The PDF** has two pages: a tall, phone-shaped pass with the Málaga photo, which fills a phone screen, and the wide ticket for printing or a rotated phone. It is a symbolic gift voucher, not an airline ticket or booking. It says "Adventure awaits" before acceptance and "Adventure accepted" with an ACCEPTED mark after.
- **Reduced motion**: if the phone asks for less motion, the animations are shortened and the sequence still completes.

## Files
- `index.html`: the screens
- `style.css`: design, animations, print layout, reduced-motion support
- `script.js`: CONFIG, flow, sound, confetti and the built-in PDF writer
- `img/`: compressed photos (about 850 KB in total); `img/ticket-photo.js` holds the photo used inside the PDF
- `manifest.webmanifest`, `icon-*.png`: home-screen name and icon

## Optional background music
The musical-note button plays Andalusian Dreams by djovan from assets/andalusian-dreams.mp3, chosen by the user. Playback is off on each new load. Play/pause resumes from the same position, the track loops, pauses while the page is hidden, and lowers its volume during airplane effects. Music and sound effects have separate controls. The former synthesized music has been removed.

Music source: https://pixabay.com/music/world-andalusian-dreams-422865/
Pixabay Content License: https://pixabay.com/service/license-summary/
Track downloaded and supplied by the user. Included as background music within the birthday gift, not as a standalone downloadable song.
