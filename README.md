# Copycat — landing page

Static. No build step, no dependencies. Every path is relative, so it works
from a repo subpath (`stelwin.github.io/copycat/`) or a bare domain equally.

## Putting it online

The contents of this folder go at the **root** of a GitHub repo — not the
folder itself.

This folder lives inside the Slate repo, which stays local. So copy it out
first rather than nesting one repo inside another:

```bash
cp -R site ~/copycat && cd ~/copycat
git init && git add -A && git commit -m "Copycat landing page"
git branch -M main
git remote add origin https://github.com/StelWin/copycat.git
git push -u origin main
```

When the page changes here, copy the changed files across and commit again.

Then in the repo: **Settings → Pages → Source: Deploy from a branch →
`main` / `(root)`**. It appears at `https://stelwin.github.io/copycat/`
within a minute or two.

For a real domain later: add a file called `CNAME` containing just the
domain, point the domain's DNS at GitHub, and tick *Enforce HTTPS*.

`.nojekyll` is there so GitHub serves the files as-is.

## Where things live

| File | What it is |
| --- | --- |
| `index.html` | The page. All copy is here, in plain text. |
| `privacy.html` | Privacy page. Legally needed once emails are collected. |
| `styles.css` | Palette and type at the top, in `:root`. |
| `main.js` | Form, drag-to-compare, reveals. Endpoint is line 10. |
| `assets/` | The demo images and the brand mark. |
| `fonts/` | Fraunces and Archivo, self-hosted so nothing calls out. |

## Still to fill in

Nothing — the contact address and the Instagram handle are both filled in.

## The form

Submissions go to Formspree (`main.js`, line 10). Two per sign-up: the email
immediately, then the two survey answers batched together a moment after the
last tap. The free tier allows 50 submissions a month, so roughly 25 sign-ups
— if that runs out, the demand question has already answered itself.
