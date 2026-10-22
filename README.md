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

Remplacer les enregistrements OVH actuels : sur `@`, créer quatre entrées `A` vers `185.199.108.153`, `185.199.109.153`, `185.199.110.153` et `185.199.111.153`, puis quatre entrées `AAAA` vers `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` et `2606:50c0:8003::153`. Pour `www`, remplacer les entrées existantes par un `CNAME` vers `loukan42.github.io`. Une fois la propagation terminée, HTTPS peut être activé dans les réglages Pages du dépôt.
