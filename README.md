LeeKloud 2.0.0
========

# LeeKloud v2 n'est pas encore fonctionnel.

Une API pour synchroniser vos IA qui sont sur votre ordinateur avec le site [leekwars.com](leekwars.com).

Pour l'utiliser installer [nodejs](http://nodejs.org/).

Ensuite lancer cette commande :

    node _LeeKloud.js

### Sous Windows :

    cd <\chemin\de\LeeKloud\>
    node _LeeKloud.js


Un tutoriel pour installer nodejs sous windows : http://blog.idleman.fr/nodejs-15-installation-sous-windows/

Pensez à modifier le PATH de votre environnement pour que la commande "node" fonctionne sans avoir à modifier le répertoire (avec la commande cd).

### Sous Linux :

	ls <\chemin\de\LeeKloud\>
	_LeeKloud.js

Emplacement trouvez le dossier .LeeKloud/ dans :

 - Sous Linux : regarder dans le répertoire HOME `echo $HOME` (~/Username).
 - Sous Windows : regarder dans %APPDATA% ou %USERPROFILE% (C:/Users/Username/AppData/Roaming).
 - Sous Max : regarder dans le HOMEPATH (/Users/Username).

## A savoir

Modifier la variable `compare_cmd` ligne 21 pour pouvoir utiliser la fonction 'compare'. Sous windows installer [WinMerge](http://winmerge.org/).



### Problème avec la commande open

Sous windows, si vous avez un problème avec `.open [id]`, vous devez d'abord choisir un éditeur par defaut pour les fichiers ".lk".

Pour définir un programme par défaut : Clique droit sur un fichier ".lk" > "Ouvrir avec..." > "Choisir un programme par défaut...".


A voir aussi : https://github.com/GuimDev/LeekScript-Sublime


## En cas de problème (french) :

1. Vérifiez que vous avez installer nodejs.
2. Vérifiez que vous avez bien défini le path d'environnement.

   2.a : Pour windows : [Installation sous Windows](http://blog.idleman.fr/nodejs-15-installation-sous-windows/)
   2.b : Pour linux : [Node.js doesn't recognize system path?](http://stackoverflow.com/questions/8768549/node-js-doesnt-recognize-system-path)
   2.2 : [Une variable d'environnement c'est quoi ?](http://www.faire-des-jeux.com/une-variable-denvironnement-cest-quoi/)

3. Dans la cmd tapez `node -v` (sans modifier le répertoire), si ça ne fonctionne pas vérifier l'étape 1 et 2.
