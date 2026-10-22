# CV de Lou Husson

Site CV immersif en français : portrait animé, parcours professionnel, formation, compétences et projets présentés autour d’un cerveau en 3D.

## Lancer en local

```powershell
npm install
npm run dev
```

Puis ouvrir http://127.0.0.1:5173.

Les contenus se trouvent dans `dist/data.js`. La version statique complète est dans `dist/`.

## Publication

Chaque mise à jour de `main` est publiée par GitHub Actions sur GitHub Pages. Le domaine personnalisé est `louhusson.com`.

Les enregistrements DNS du domaine doivent pointer vers GitHub Pages : quatre enregistrements `A` sur `@` (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) et un `CNAME` pour `www` vers `loukan42.github.io`. Une fois la propagation terminée, HTTPS peut être activé dans les réglages Pages du dépôt.
