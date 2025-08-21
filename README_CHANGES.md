# Izmene u dashboardu
- Fiksirane ordinate: Bunar 1 (0–10 m), Bunar 2 (0–4 m)
- Veliki numerički prikaz trenutne vrednosti za svaki bunar
- Jedno dugme **Export CSV (oba)** – izvozi zajednički CSV sa kolonama: `timestamp,bunar1_m,bunar2_m`
- Vizuelna signalizacija minimuma: pragovi 4.0 m (Bunar 1) i 0.6 m (Bunar 2), horizontalna isprekidana linija + status boja
- Osvežavanje na 30 s, izbor vremenskog opsega (1h, 6h, 12h, 24h, 7d)
- Zadržan PWA (manifest + service worker), dodata registracija u index.html

## Napomena
- U `app.js` podesite po potrebi imena resursa na Beebotte-u (`RESOURCE1`, `RESOURCE2`) ako se razlikuju (podrazumevano: `bunar1`, `bunar2`).
- Token je preuzet iz prethodne verzije (`TOKEN`). Ako ga menjate, ažurirajte ga u `app.js`.
