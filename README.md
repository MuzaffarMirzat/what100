# what100

A tiny phone web app for 100-day goal streaks.

- Add a goal anytime
- Open it to see a 100-day calendar
- Tap days to mark progress
- Data stays in your phone’s browser storage

No App Store. Install it from GitHub Pages as a home-screen app.

## Deploy on GitHub Pages

1. Create a new GitHub repo (e.g. `what100`).
2. Push this project:

```bash
git init
git add .
git commit -m "Add what100 PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USER/what100.git
git push -u origin main
```

3. On GitHub: **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `main` / `/ (root)`
   - Save

4. Open the site URL GitHub shows, e.g.  
   `https://YOUR_USER.github.io/what100/`

## Use it like an app on your phone

### iPhone (Safari)

1. Open the GitHub Pages URL in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. Open **what100** from your home screen.

### Android (Chrome)

1. Open the GitHub Pages URL in Chrome.
2. Tap the menu → **Install app** or **Add to Home screen**.
3. Open **what100** from your home screen.

## Local preview

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
