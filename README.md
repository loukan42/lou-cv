# CV de Lou Husson

[Voir le CV interactif](https://louhusson.com/)

Site CV immersif en français : portrait animé, parcours professionnel, formation, compétences et projets présentés autour d’un cerveau en 3D.

## Lancer en local

```powershell
npm install
npm run dev
```

Puis ouvrir http://127.0.0.1:5173.

Les contenus se trouvent dans `dist/data.js`. La version statique complète est dans `dist/`.

## Publication sur OVH

Le site est hébergé sur l’offre OVH fournie avec `louhusson.com` : `louhusj.cluster129.hosting.ovh.net`. GitHub conserve le code source. GitHub Pages et son déploiement automatique ont été désactivés.

Pour préparer le site sans connexion au serveur :

```powershell
.\scripts\Deploy-Ovh.ps1 -PrepareOnly
```

Pour le transférer, lancer la commande suivante dans un terminal interactif et saisir le mot de passe SFTP à l’invite native. Le script ne l’enregistre pas.

```powershell
.\scripts\Deploy-Ovh.ps1
```

Le script prépare les fichiers publics suivis dans Git, sauvegarde l’ancien dossier `www`, installe le site puis vérifie HTTPS directement sur le serveur OVH. `dist/.htaccess` redirige HTTP et `www` vers `https://louhusson.com/`.

La configuration DNS est une entrée `A` sur `@` vers `51.91.236.255`, une entrée `AAAA` sur `@` vers `2001:41d0:301::29`, et un `CNAME` sur `www` vers `louhusson.com.`. Les entrées de messagerie sont conservées.
