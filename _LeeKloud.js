#!/usr/bin/env node

var __version = "1.2.2";
var _Vname = "LeeKloud " + __version;

process.title = _Vname;
process.stdout.write("\x1Bc");

var crypto = require('crypto'),
	domain = require('domain'),
	exec = require('child_process').exec,
	fs = require('fs'),
	http = require('http'),
	https = require('https'),
	node_path = require('path'),
	querystring = require('querystring'),
	readline = require('readline'),
	util = require('util');

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	completer: completer
});

var $ = {
	post: post,
	get: get
};

var __AI_CORES = [],
	__AI_IDS = [],
	__AI_LEVELS = [],
	__AI_NAMES = [],
	__LEEK_IDS = [],
	__FARMER_ID = 0,
	__FARMER_NAME = "",
	__TOKEN = "";

var __FILEHASH = {},
	__FILEBACK = [],
	__FILEMTIME = [];

var _PLUGINS = [];

var __fileload = 0;

var _IAfolder = "IA/",
	_Plugfolder = "Plugin/";

var LeeKloud = null,
	myCookie = "";

process.on("uncaughtException", function(err, b) {
	console.log("\033[91mErreur vraiment fatale !\033[00m");
	console.log("\n" + err.stack + "\n");
	writeRapportlog(err);

	process.exit(1);
});

var _LKfolder = "";
(function(folder) {
	_LKfolder = folder += "/.LeeKloud/";
	if (!fs.existsSync(folder)) {
		fs.mkdirSync(folder);
	}
	process.chdir(folder);
})(process.env.HOME || process.env.APPDATA || process.env.USERPROFILE || process.env.HOMEPATH);

function main() {
	var dzechat_url = "\033[95mhttp://chat.12z.fr/\033[00m";
	var right = Array(45 - _Vname.length).join("-");
	console.log("------------------------------ " + _Vname + " " + right);
	console.log("Programme proposé par @GuimDev, certaines parties du code sont sous licence.");
	console.log("------ Retrouvez nous sur : " + dzechat_url + " (node/programmation). ------");
	console.log("En cas de problème contactez-moi sur le forum, ou MP HorsSujet (farmer=???).");
	console.log("----------------------------------------------------------------------------");
	console.log("Emplacement : \033[96m" + process.cwd() + "\033[0m");

	[_IAfolder, _Plugfolder, ".temp/", ".temp/backup/"].forEach(function(dir, index) {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
	});

	console.log(" ");

	if (fs.existsSync(".temp/history")) {
		rl.history = JSON.parse(getFileContent(".temp/history"));
	}

	if (!fs.existsSync(".temp/cookie")) {
		console.log("Connexion nécessaire.");
		rl.question("Pseudo : ", function(pseudo) {
			rl.history = rl.history.slice(1);
			hidden("Password : ", function(password) {
				$.post({
					url: "/index.php?page=login_form",
					data: {
						keep: "on",
						login: pseudo,
						pass: password
					},
					success: function(res, data) {
						var funcConnexion = function() {
							var dataCookie = mkdataCookie(res.headers["set-cookie"]);
							setFileContent(".temp/cookie", JSON.stringify(dataCookie));

							myCookie = dataCookieToString(dataCookie);
							console.log("Connexion réussie.");

							nextStep();
						};

						if (data == "1") {
							funcConnexion();
						} else {
							console.log("Connexion échouée.\n");

							console.log("Si vos informations sont correctes, vous pouvez forcer le processus.");
							console.log("- Forcez la connexion avec \"force\".");
							console.log("- Forcez la mise à jour de LeeKloud avec \"maj\".\n");
							console.log("Appuyez sur entrée.");

							rl.question("> ", function(answer) {
								if (answer.toLowerCase() == "force") {
									funcConnexion();
								} else if (answer.toLowerCase() == "maj") {
									showChangelog();
									verifyVersion(true);
								} else {
									LeeKloudStop();
								}
							});
						}
					}
				});
			});
		});
	} else {
		var dataCookie = JSON.parse(getFileContent(".temp/cookie"));

		myCookie = dataCookieToString(dataCookie);
		console.log("Connexion automatique.\n");

		nextStep();
	}
}

function launcher(clear, message) {
	if (clear) {
		process.stdout.write("\x1Bc");
		(message && console.log(message));
	}

	LeeKloud = domain.create();
	LeeKloud.on("error", function(err) {
		console.log("\n\033[91mErreur arrêt de toutes les tâches en cours !\033[00m");
		console.log("\n" + err.stack + "\n\n");
		writeRapportlog(err);

		process.exit();
	});
	LeeKloud.run(main);
}

setTimeout(launcher, 10);

function nextStep(step) {
	if (!step && fs.existsSync(".temp/leeks")) {
		__TOKEN = getFileContent(".temp/token");

		if (process.argv.length > 2) {
			var match = process.argv[2].match("\\[hs([0-9]+)\\]\.[A-z.]{2,9}$");
			__LEEK_IDS = JSON.parse(getFileContent(".temp/leeks"));
			if (!match) {
				console.log("Fichier invalide. N'essaye pas de me troller ! :B");
				shutdown(true);
			} else if (match[1]) {
				console.log("Demande de test de l'IA : \033[36m" + match[0] + "\033[00m");
				var phrase = "entre 0 et " + (__LEEK_IDS.length - 1);
				rl.question("Numéro du Leek (" + phrase + ") pour tester l'IA : ", function(id) {
					if (!__LEEK_IDS[id]) {
						console.log("Le numéro du Leek doit-être " + phrase + ".");
						return nextStep();
					}
					sandbox(parseInt(match[1]), __LEEK_IDS[id]).done(function() {
						shutdown();
					});
				});
			}
			return;
		}
		setTimeout(nextStep, 2000, true);
	} else {
		launcherReadline();

		if (getFileContent(".temp/lastMP", true) != _Vname) {
			/* LeeKloud est gratuit, en échange je souhaite juste s'avoir qui l'utilise. */
			sendMP(16520, "Installation de " + _Vname + " : [node -v : " + process.version + "] [" + process.platform + "] [" + process.arch + "]");
			setFileContent(".temp/lastMP", _Vname);
		}

		open(_LKfolder);
		getScripts();
	}
}

function getPlugins() {
	console.log("Analyse des plugins installés.\n");

	var files = fs.readdirSync(_Plugfolder);

	files = files.filter(function(file) {
		var stat = fs.statSync(_Plugfolder + file);
		return file.substr(-3) === ".js" && stat.isFile();
	});

	if (files.length === 0) {
		console.log("Aucun plugin à charger.");

		console.log("Installation forcée du plugin WorkSpace et Prettydiff.");
		useCommande(".plugin install WorkSpace y");
		useCommande(".plugin install Prettydiff y");
	} else {
		files.forEach(function(file) {
			var name = file.substr(0, file.length - 3);

			console.log("Chargement du plugin : \033[95m" + name + "\033[00m\n");
			try {
				var plug = require(fs.realpathSync("./" + _Plugfolder + file)),
					c = null;

				plug.parent = {
					__IA: __IA,
					__AI_CORES: __AI_CORES,
					__AI_IDS: __AI_IDS,
					__AI_LEVELS: __AI_LEVELS,
					__AI_NAMES: __AI_NAMES,
					__LEEK_IDS: __LEEK_IDS,
					__FARMER_ID: __FARMER_ID,
					__FARMER_NAME: __FARMER_NAME,
					__TOKEN: __TOKEN,
					_PLUGINS: _PLUGINS,
					getFileContent: getFileContent,
					setFileContent: setFileContent,
					showListIA: showListIA,
					printHelp: printHelp,
					decompressIA: String.prototype.decompressIA,
					sha256: sha256,
					open: open,
					request: $
				};
				plug.load();

				plug.hash = sha256(getFileContent(_Plugfolder + file));

				if (c = plug.commandes) {
					if (c.main) {
						__CMD_PLUGINS[c.main] = name;
					}
					if (c.completion) {
						__TAB_COMPLETIONS.push(c.completion);
					}
					if (c.help) {
						__HELP_COMMANDS.push(c.help);
					}
				}

				_PLUGINS[name] = plug;
			} catch (err) {
				console.log("\033[91mErreur lors du chargement du plugin.\033[00m", err);
				console.log(err.stack);
			}
		});
		console.log(" ");
	}
}

function shutdown(bool) {
	process.stdin.pause();
	console.log("\nArrêt dans 4 secondes.");
	return setTimeout(function() {
		LeeKloudStop(bool);
	}, 4000);
}

function sendMP(conv, msg) {
	$.post({
		url: "/index.php?page=message_update",
		data: {
			new_conv: conv,
			message: msg,
			token: __TOKEN
		},
		success: function(res, data, context) {
			//console.log(data);
		}
	});
}

function getScripts() {
	if (fs.existsSync(".temp/hash")) {
		__FILEHASH = JSON.parse(getFileContent(".temp/hash"));
	}
	console.log("Obtention de la liste des scripts.\n");
	$.get({
		url: "/editor",
		success: function(res, data) {
			if (data == "") {
				console.log("\033[91mVous n'êtes pas connecté, connectez-vous.\033[00m");
				fs.unlinkSync(".temp/cookie");
				return shutdown(true);
			}

			var issue = false;
			try {
				__AI_CORES = [];//JSON.parse(data.match(/<script>__AI_CORES = (.*?);<\/script>/)[1]);
				__AI_IDS = JSON.parse(data.match(/<script>__AI_IDS = (.*?);<\/script>/)[1]);
				__AI_LEVELS = JSON.parse(data.match(/<script>__AI_LEVELS = (.*?);<\/script>/)[1]);
				__AI_NAMES = JSON.parse(data.match(/<script>__AI_NAMES = (.*?);<\/script>/)[1]);
				__FARMER_ID = parseInt(data.match(/<script>var __FARMER_ID = ([0-9]*?);<\/script>/)[1]);
				__FARMER_NAME = data.match(/<script>var __FARMER_NAME = '(.*?)';<\/script>/)[1];
				__TOKEN = data.match(/<script>var __TOKEN = '(.*?)';<\/script>/)[1];
				setFileContent(".temp/token", __TOKEN);

				__LEEK_IDS = data.match(/<div id='([0-9]+)' class='leek myleek'>/g);
			} catch (err) {
				console.log(err.stack);
				issue = true;
			}

			if (issue || !(__AI_CORES && __AI_IDS && __AI_LEVELS && __AI_NAMES && __FARMER_ID && __FARMER_NAME && __TOKEN && __LEEK_IDS)) {
				console.log("\033[91mUne valeur obligatoire est manquante.\033[00m");
				return shutdown(true);
			}

			__LEEK_IDS.forEach(function(value, index) {
				__LEEK_IDS[index] = parseInt(value.match(/id='([0-9]+)'/)[1]);
			});
			setFileContent(".temp/leeks", JSON.stringify(__LEEK_IDS));

			console.log(">> Téléchargements...");
			__AI_IDS.forEach(function(value, index) {
				loadScript(value, index, successloadScript);
			});
		}
	});
}

function parseName(name) {
	name = name.replace(/[\/]/g, "[").replace(/[\\]/g, "]");
	name = name.replace(/[:*?]/g, "!").replace(/["<>]/g, "'");
	name = name.replace(/ ?[&|] ?/g, "'n'");
	name = name.replace(/[\/\\:*?"<>&|]/g, "");

	return name;
}

function getFilePathBackup(filename) {
	return ".temp/backup/" + filename + ".back.lk";
}

function getFileContent(filename, check) {
	if (check && !fs.existsSync(filename)) return "";
	return fixASCII(fs.readFileSync(filename).toString());
}

function setFileContent(filename, data) {
	return fs.writeFileSync(filename, data);
}

function __IA(id) {
	this.id = id;
	this.index = __AI_IDS.indexOf(id);
	this.name = __AI_NAMES[this.index];
	this.filename = (this.name) ? (parseName(this.name.replace("[hs", "[ks")) + "[hs" + id + "].js.lk") : "";

	this.filepath = _IAfolder + this.filename;

	this.getIAData = function() {
		return getFileContent(this.filepath);
	};

	this.setIAData = function(data) {
		return setFileContent(this.filepath, data);
	};

	this.getHash = function() {
		return sha256(this.getIAData());
	};

	this.scandir = function() {
		var files = fs.readdirSync(_IAfolder),
			exist = false;

		for (var i = 0; i < files.length; i++) {
			if ((new RegExp("\\[hs" + this.id + "\\]\.[A-z.]{2,9}$")).test(files[i])) {
				console.log("Une IA a été renommée \033[36m" + files[i] + "\033[00m en \033[36m" + this.filename + "\033[00m.");
				fs.renameSync(_IAfolder + files[i], this.filepath);
				return true;
			}
		}

		return false;
	};

	this.syncWithServer = function(data) {
		this.setIAData(data);

		var hash = this.getHash();
		__FILEHASH[this.id] = {
			lasthash: hash,
			filehash: hash
		};


		setFileContent(".temp/hash", JSON.stringify(__FILEHASH));
	};
}

Number.prototype.round = function(a) {
	a = (a) ? parseInt("1" + Array(a + 1).join("0")) : 1;
	return Math.round(this * a) / a;
};

Number.prototype.pad = function() {
	return (this < 10) ? ("0" + this) : this;
}

String.prototype.decompressIA = function(alphaC, alphabet) {
	var result = [];
	for (var i = 0, maj = false, letter, num; i < this.length; i++) {
		num = alphaC.indexOf(this.charAt(i));
		letter = alphabet.charAt(num);
		letter = (maj) ? letter.toUpperCase() : letter;

		maj = ((num == -1 && this.charAt(i) == "$") || (maj && num == -1));
		if (num !== -1) {
			result.push(letter);
		}
	}
	return result.join("");
}

function updateBadToken() {
	return getScripts();
}

setInterval(function() {
	updateBadToken();
}, 15 * 60 * 1000);

function sendScript(id, forceUpdate) {
	forceUpdate = (forceUpdate) ? true : false;
	loadScript(id, __AI_IDS.indexOf(id), function(res, data) {
		var myIA = new __IA(id),
			serverhash = sha256(data),
			code = myIA.getIAData(),
			myhash = myIA.getHash();

		__FILEHASH[id].filehash = myhash;

		if (data == "bad token") {
			console.log("Erreur : " + data);
			return updateBadToken();
		}

		if (!(__FILEHASH[id].lasthash == serverhash || forceUpdate)) {
			if (!_PLUGINS["Prettydiff"]) {
				console.log("Prettydiff doit-être installé pour comparer un fichier.");
			} else {
				_PLUGINS["Prettydiff"].compare(myIA.filepath, [data]);
			}
			console.log("La version du serveur est différente, elle a été changée depuis le dernier téléchargement. Forcez l'envoi avec la commande \"\033[95m.forceupdate " + myIA.id + "\033[00m\".");
			return rl.history.unshift(".forceupdate " + myIA.id);
		}

		__FILEHASH[id].lasthash = myhash;
		$.post({
			url: "/index.php?page=editor_update",
			data: {
				id: myIA.id,
				compile: true,
				token: __TOKEN,
				code: code
			},
			success: function(res, data) {
				var myIA = new __IA(id);
				if (data == "") { //Erreur serveur lors de la compilation
					return console.log("Erreur serveur lors de la compilation.");
				} else if (data.replace("\n", "") == "bad token") {
					console.log("Erreur : " + data);
					return updateBadToken();
				} else if (data.replace("\n", "") == "Array") {
					return console.log("\033[92mRetour 'Array'\033[00m, c'est un problème du serveur impossible de savoir si l'IA a été modifiée ou pas.");
				}

				try {
					data = JSON.parse(data);
				} catch (err) {
					// Bad token surement. :B
					console.log("Erreur : " + data);
					console.log(err.stack);
					return console.log("\033[92mSignale la, sur le forum !\033[00m");
				}

				/*
				 * type 0 / 1 / 2 :
				 * - ia_context : Id de l'ia compilée (ça peut être l'IA dont on a demandé la compilation ou une ia "parente"
				 *				  incluant l'IA dont on a demandé la compilation)
				 * - ia : Id de l'IA dans laquelle l'erreur a été détectée
				 * - line : Line à laquelle l'erreur a été détectée
				 * - pos : Caractère de la ligne
				 * - informations : Informations sur l'erreur
				 * type 2 :
				 * - level : level de la fonction de plus haut niveau appelée dans l'ia
				 * - core : nombre de core de la fonction ayant besoin du plus grand nombre de coeur dans l'ia
				 */
				data = data[0];
				console.log("L'envoi de \033[36m" + myIA.filename + "\033[00m " + ((data[0] == 2) ? "réussi" : "échoué") + ".");
				if (data[0] == 0) { // Erreur de compilation "classique"
					// [0, ia_context, ia, line, pos, informations]
					console.log(" ");
					if (data[0] == 0 && data[1] != data[2]) {
						var myIA = new __IA(data[2]);
						code = myIA.getIAData();
						console.log("\033[96mErreur dans l'include '" + myIA.name + "', \033[00m\033[36m" + myIA.filename + "\033[00m.\n");
					}
					var codeline = code.replace(/\t/g, "    ").split("\n"),
						l = parseInt(data[3]),
						s = (l + " ").length,
						pos = (s + 2) + code.split("\n")[l - 1].replace(/[^\t]/g, "").length * 3 + parseInt(data[4]);

					for (var i = l - 5; i < l; i++) {
						if (codeline[i]) {
							alignLine(i + 1, codeline[i], s, pos);
						}
					}
					console.log(Array(pos).join(" ") + "\033[91m^\033[00m");

					console.log("" + data[5] + " (ligne : \033[96m" + data[3] + "\033[00m, caract : \033[96m" + data[4] + "\033[00m).");
				} else if (data[0] == 1) {
					// [1, ia_context, informations]
					console.log("Erreur sans plus d'information : " + data[2]);
				} else if (data[0] == 2) {
					// [2, ia_context, core, level]
					console.log("Niveau : " + data[3] + " Coeur : " + data[2]);
				} else {
					console.log("Le serveur retourne un type de valeur inconnue. Une erreur ? (" + JSON.stringify(data) + ").");
				}
				console.log(" ");
			}
		});
		setFileContent(".temp/hash", JSON.stringify(__FILEHASH));
	});
}

function alignLine(num, text, longer, maxsize) {
	var maxlength = process.stdout.columns - 1;
	num = num + Array(longer - (num + "").length).join(" ");
	maxlength -= num.length + 3;
	console.log("\033[36m" + num + " |\033[00m " + text.slice(0, (maxsize < maxlength) ? maxlength : maxsize));
}

function loadScript(value, index, success) {
	var d = new Date(),
		h = d.getHours().pad() + ":" + d.getMinutes().pad() + ":" + d.getSeconds().pad();
	console.log("[" + h + "] - Requête pour \033[36m" + __AI_NAMES[index] + "\033[00m.");
	var myIA = new __IA(value);
	$.post({
		url: "/index.php?page=editor_update",
		data: {
			id: myIA.id,
			load: true,
			token: __TOKEN
		},
		context: {
			id: myIA.id
		},
		success: function(res, data, context) {
			// Reprise de la modif de Pilow : "Là y'a un souci, le code présente une ligne de plus :/ On la dégage"
			data = data.slice(0, -1);
			success(res, data, context);
		}
	});
}

function successloadScript(res, data, context) {
	if (data == "") {
		return;
	}

	var myIA = new __IA(context.id),
		serverhash = sha256(data),
		type = "",
		action = "";

	if (fs.existsSync(myIA.filepath)) {
		if (!__FILEHASH[myIA.id]) {
			__FILEHASH[myIA.id] = {
				lasthash: 12
			};
		}
		__FILEHASH[myIA.id].filehash = myIA.getHash();
	} else if (__FILEHASH[myIA.id]) {
		if (!myIA.scandir()) {
			delete __FILEHASH[myIA.id];
		}
	}

	var thash = __FILEHASH[myIA.id];
	if (!thash) {
		type = "\033[96mCréation";
		action = 1;
	} else if (thash.filehash == serverhash) { //thash.lasthash == thash.filehash
		__FILEHASH[myIA.id].lasthash = serverhash; /* Si le fichier hash a été supprimé */
		type = "\033[95mIdentique";
		action = 0;
	} else if (thash.lasthash == 12) {
		type = "\033[93mHash manquant";
		action = 4;
	} else if (thash.lasthash == thash.filehash && thash.filehash != serverhash) {
		type = "\033[96mServeur changé";
		action = 1;
	} else if (thash.lasthash == serverhash && thash.filehash != serverhash) {
		type = "\033[92mClient changé";
		action = 2;
	} else if (thash.lasthash != thash.filehash && thash.filehash != serverhash) {
		type = "\033[93mS & C changé";
		action = 3;
	} else {
		type = "\033[91mSi tu me vois, dit-le sur le forum (err:2-" + thash.lasthash + "-" + thash.filehash + "-" + serverhash + ").";
	}

	console.log(" ");
	if (action === 1 || action === 4) {
		console.log("- Téléchargement de \033[36m" + myIA.filename + "\033[00m (fichier distant plus récent).");
		if (action === 4) {
			backup_change(action, myIA.id);
		}
		myIA.syncWithServer(data);
	} else if (action === 2 || action === 3) {
		console.log("- Envoi de \033[36m" + myIA.filename + "\033[00m (fichier local plus récent).");
		sendScript(myIA.id, true);
		if (action === 3) {
			backup_change(action, myIA.id, data);
		}
	} else if (action === 0) {
		console.log("- \033[36m" + myIA.filename + "\033[00m.");
	} else {
		console.log("\033[91mSi tu me vois, dit-le sur le forum (err:3).\033[00m");
	}

	console.log("--- ETAT : \033[36m" + type + "\033[00m\n");

	setFileContent(".temp/hash", JSON.stringify(__FILEHASH));

	var stat = fs.statSync(myIA.filepath);
	__FILEMTIME[myIA.id] = new Date(stat.mtime).getTime();

	fs.unwatchFile(myIA.filepath);
	fs.watch(myIA.filepath, function(event, filename) {
		filename = (filename) ? _IAfolder + filename : myIA.filepath;
		if (filename && event == "change") {
			var stat = fs.statSync(myIA.filepath);

			var mtime = new Date(stat.mtime).getTime(),
				hash = sha256(getFileContent(filename));
			if (__FILEMTIME[myIA.id] != mtime && __FILEHASH[myIA.id].filehash != hash) {
				console.log("\033[36m" + filename + "\033[00m a changé.\n");
				__FILEHASH[myIA.id].filehash = hash;
				sendScript(myIA.id, false);
			}
			__FILEMTIME[myIA.id] = mtime;
		}
	});

	if (__fileload !== false && __fileload++ && __fileload >= __AI_IDS.length) {
		console.log(" \n>> Tous les téléchargements sont terminés.\n");
		verifyVersion();

		if (__FILEHASH instanceof Array) {
			var newFileHash = {};
			__AI_IDS.forEach(function(value, index) {
				newFileHash[value] = {
					lasthash: __FILEHASH[value].lasthash,
					filehash: __FILEHASH[value].filehash
				};
			});
			__FILEHASH = newFileHash;
			setFileContent(".temp/hash", JSON.stringify(__FILEHASH));
			console.log("La corruption du fichier \".temp/hash\" a été corrigée.");
		}
		try {
			var req = http.request({
				host: "goo.gl",
				port: "80",
				path: "/4XUiqO", //http://goo.gl/#analytics/goo.gl/4XUiqO/all_time
				method: "GET",
				headers: {
					"Referer": "http://leekwars.com/",
					"User-Agent": "Mozilla/5.0 (" + process.platform + "; " + process.arch + ") AppleWebKit/535.1 (KHTML, like Gecko) NodeJS/14.0.835.186 Safari/535.1"
				}
			}, function(res) {
				res.on("end", function() {});
			}).on("error", function() {}).end();
		} catch (err) {}

		getPlugins();

		__fileload = false;
	}
}

var __mustBeUpdate = false;

function verifyVersion(abc) {
	var check = true;
	if (!abc) {
		if (!fs.existsSync(".temp/version") || getFileContent(".temp/version") != sha256(getFileContent(__filename))) {
			console.log("\033[96m");
			splashMessage("La nouvelle version est correctement installée.");
			console.log("\033[00m");
			showChangelog(__version, true);
			check = false;
		}
		setFileContent(".temp/version", sha256(getFileContent(__filename)));
	}

	if (check) {
		getLeeKloud(function(res, data) {
			if (abc) {
				__mustBeUpdate = false;
				setFileContent(__filename, data);

				console.log("\033[96m");
				splashMessage("La nouvelle version a été installée !");
				console.log("\033[00m");
				shutdown();
			} else {
				var localhash = getFileContent(".temp/version"),
					serverhash = sha256(data);

				if (localhash != serverhash) {
					__mustBeUpdate = true;
					console.log("\033[96m");
					console.log("local   : \033[00m" + localhash + "\033[96m");
					console.log("distant : \033[00m" + serverhash + "\033[96m");
					splashMessage("Une version plus récente est disponible.");
					console.log("Utilisez la commande \"\033[00m.leekloud-update\033[96m\".");
					console.log("\033[00m");

					showChangelog();
				}
			}
		});
	}
}

function splashMessage(msg, size) {
	var size = (size) ? size : 60;
	console.log(Array(size).join("-"));
	var a = Array(((size - msg.length - 1) / 2).round()).join("-") + " " + msg + " ";
	console.log(a + Array(size - a.length).join("-"));
	console.log(Array(size).join("-"));
}

function showChangelog(version, actual) {
	version = (version) ? version : __version;
	getChangeLogLeeKloud(function(res, data) {
		var i = 2,
			t = data.split(/(^|\n)\[(.+)\]\n/),
			log = "",
			bool = true;

		if ([version, t[i]].sort()[0] == version) {
			splashMessage("CHANGELOG :", 60);

			console.log("Migration : \033[96m" + version + "\033[00m => \033[96m" + t[i] + "\033[00m\n");

			while (t[i] && ((bool && version != t[i]) || actual) && [version, t[i]].sort()[0] == version) {
				console.log("\nVersion \033[96m" + t[i] + "\033[00m :");
				log = t[i + 1];
				log = log.replace(/((^-|\n-) | \.[a-z-]+)/g, "\033[96m$1\033[00m");
				log = log.replace(/"(.*?)"/g, "\"\033[95m$1\033[00m\"");

				if (version == t[i] && actual) {
					bool = actual = false;
				}
				console.log(log + "\n");
				i += 3;
			}
		}
	});
}

function backup_change(action, id, data) {
	var localapplique = (action == 3) ? true : false,
		myIA = new __IA(id);

	var applique = (localapplique) ? "\033[92mversion locale" : "\033[96mversion distante",
		backup = (localapplique) ? "\033[96mversion distante" : "\033[92mversion locale";

	if (action == 3) {
		setFileContent(".temp/backup/" + myIA.filename + ".back.lk", data);
	} else if (action == 4) {
		setFileContent(".temp/backup/" + myIA.filename + ".back.lk", myIA.getIAData());
	} else {
		return console.log("\033[91mSi tu me vois, dit-le sur le forum (err:4).\033[00m");
	}

	if (!_PLUGINS["Prettydiff"]) {
		console.log("Prettydiff doit-être installé pour comparer un fichier.");
	} else {
		_PLUGINS["Prettydiff"].compare(myIA.filepath, ".temp/backup/" + myIA.filename + ".back.lk");
	}
	console.log("- La " + applique + "\033[00m a été appliquée, vous pouvez choisir la " + backup + "\033[00m avec la commande \"\033[95m.backup " + myIA.id + "\033[00m\".");

	rl.history.unshift(".backup " + myIA.id + " restore");
	__FILEBACK[myIA.index] = myIA.id;
}

function showListIA() {
	console.log("Liste des IAs :");
	__AI_IDS.forEach(function(id, index) {
		console.log("- \033[36m" + id + "\033[00m : \033[36m" + __AI_NAMES[index] + "\033[00m.");
	});
}

function callbackFight(res, data) {
	if (res.headers.location && res.headers.location.indexOf("/fight/") != -1) {
		open("http://leekwars.com/" + res.headers.location);
		console.log("Combat généré : " + res.headers.location);
	} else if (parseInt(data) != NaN) {
		open("http://leekwars.com/fight/" + data);
		console.log("Combat généré : " + data);
	} else {
		data = (data) ? data.replace("\n", "") : data;
		console.log("Le combat n'a pas été généré (" + data + ").");
	}
	console.log(" ");
}

function sandbox(ia_id, leekid) {
	console.log(ia_id);
	var myIA = new __IA(ia_id);
	if (myIA.name) {
		console.log("Demande de test de l'IA : \033[36m" + myIA.name + "\033[00m");
	}
	return $.post({
		url: "/index.php?page=editor_update",
		data: {
			id: ia_id,
			leek1: 2,
			myleek: leekid,
			test: true,
			"test-type": "solo",
			token: __TOKEN
		},
		success: callbackFight
	});
}

function sendFight(data) {
	console.log("Demande de combat effectuée.");
	data.token = __TOKEN;
	return $.post({
		url: "/garden_update",
		data: data,
		success: callbackFight
	});
}

function useCommande(line) {
	var commande = line.split(" ");

	// =====================================================
	// ================= BACKUP ============================
	if (commande[0] == ".backup") {
		var id = parseInt(commande[1]),
			index = __AI_IDS.indexOf(id);

		if (index != -1 && __FILEBACK[index] == id) {
			var myIA = new __IA(id),
				filenameback = getFilePathBackup(myIA.filename);

			if (commande[2] == "restore") {
				var backup = "";
				console.log("Le backup de \033[36m" + myIA.filename + "\033[00m a été restauré. Vous pouvez réutiliser la précédente commande si vous changez d'avis.");
				backup = myIA.getIAData(filenameback);
				setFileContent(filenameback, myIA.getIAData());
				myIA.setIAData(backup);
			} else if (commande[2] == "open") {
				console.log("Le backup de \033[36m" + myIA.filename + "\033[00m a été ouvert.");
				open(filenameback);
			} else if (commande[2] == "compare" && !_PLUGINS["Prettydiff"]) {
				console.log("Le plugin Prettydiff doit-être installé pour comparer un fichier.");
			} else if (commande[2] == "compare") {
				_PLUGINS["Prettydiff"].compare(myIA.filename, filenameback);
				console.log("Comparaison entre \"\033[36m" + myIA.filename + "\033[00m\" et \"\033[36m" + filenameback + "\033[00m\".");
			} else {
				console.log("Merci de préciser la sous-commande : .backup [id] {restore / open / compare.}");
			}
		} else {
			console.log("Le backup n'existe pas.");
		}
	}
	// ==========================================================
	// ====================== FORCEUPDATE =======================
	else if (commande[0] == ".forceupdate") {
		var id = parseInt(commande[1]),
			index = __AI_IDS.indexOf(id);

		if (index != -1) {
			sendScript(id, true);
			console.log("Mise à jour de l'IA n°\033[36m" + id + "\033[00m, \033[36m" + __AI_NAMES[index] + "\033[00m.");
		} else {
			console.log(".forceupdate [id]");
			showListIA();
		}
	}
	// ======================================================
	// ====================== REFRESH =======================
	else if (commande[0] == ".refresh") {
		return getScripts();
	}
	// =====================================================
	// ====================== OPEN =========================
	else if (commande[0] == ".open") {
		var id = parseInt(commande[1]),
			index = __AI_IDS.indexOf(id);

		if (index != -1) {
			var myIA = new __IA(id);
			open(myIA.filepath);
			console.log("Ouverture de l'IA n°\033[36m" + id + "\033[00m, \033[36m" + myIA.filename + "\033[00m.");
		} else {
			console.log(".open [id]");
			showListIA();
		}
	}
	// =====================================================
	// ====================== COMPARE ======================
	else if (commande[0] == ".compare") {
		var ids = [parseInt(commande[1]), parseInt(commande[2])],
			index = [__AI_IDS.indexOf(ids[0]), __AI_IDS.indexOf(ids[1])];

		if (!_PLUGINS["Prettydiff"]) {
			console.log("Le plugin Prettydiff doit-être installé pour comparer un fichier.");
		} else if (index[0] != -1 && index[1] != -1) {
			var myIAs = [new __IA(ids[0]), new __IA(ids[1])];

			_PLUGINS["Prettydiff"].compare(myIAs[0].filepath, myIAs[1].filepath);

			console.log("Comparaison de l'IA n°\033[36m" + myIAs[0].id + "\033[00m et n°\033[36m" + myIAs[1].id + "\033[00m, \033[36m" + myIAs[0].name + "\033[00m et \033[36m" + myIAs[1].name + "\033[00m.");
		} else {
			console.log(".compare [id1] [id2]");
			showListIA();
		}
	}
	// =====================================================
	// ====================== CREATE =======================
	else if (commande[0] == ".create") {
		var setNewCode = function(id) {
			var alphaC = "zyxwvutsrqponmlkjihgfedcba~?>=<:.-,+`";
			var alphabet = "/-\n codebasvilkunprmf(gtw)=\t[0];'hy!>";
			var code_de_base = ["zzyyyyyyyyyyyyyy",
				"yyyyyyyyyyyyyyyyyyxzzyyyyyyyw$vu",
				"tswtswrqpsw█████████yyyyyyyyyyyx",
				"zzyyyyyyy██yyyyyyywo██nqw$mss$lm",
				"uktwyyy██yxxzzw$ujwihs██jtwmqwih",
				"sgnshs█wqhgs██xnf██wedsc█$bsqiuj",
				"eaw~~w█jkmma██x?p██sc$bs█qiujeds",
				"c$bsq█iujpea██>=<██a:xxzz█w$ujwh",
				"svkis█hswm.sjjsgnwmswimkp█wihuv-",
				"sxoqh█wsjsg█████████,w~wd█sc$jsq",
				"hspc$s█jsg,█ea:█xxz█zw$u█jwp.qii",
				"huv-sw█tswm█.sj████jsgnw█pnwrspu",
				"njxnfwe██dsc███$vsmm$c██u$kps$bs",
				"qiujesjsg██,aw+~wdsc██$vsmmeaax?",
				"guos$cubqht█████████esjsg,a:xxzz",
				"w$ujwsppq,swtswmknwcnhshwtsppkpx",
				"b-nmswekps$bsqiujesjsg,aw`~w=a:x"
			].join("").decompressIA(alphaC, alphabet);

			$.post({
				url: "/index.php?page=editor_update",
				data: {
					id: id,
					compile: true,
					token: __TOKEN,
					code: code_de_base
				},
				success: function() {
					getScripts();
				}
			});
		};

		if (commande[1]) {
			$.post({
				url: "/index.php?page=editor_update",
				data: {
					create: true,
					token: __TOKEN
				},
				success: function(res, data) {
					if (res.headers.location && res.headers.location.indexOf("/editor/") != -1) {
						console.log("L'IA a été créée. Nommage en cours...\n");
						var id = /\d+/.exec(res.headers.location);
						$.post({
							url: "/index.php?page=editor_update",
							data: {
								color: 0,
								id: id,
								name: commande.slice(1).join(" "),
								save: true,
								token: __TOKEN
							},
							success: function(res, data) {
								console.log("L'IA a été renommée, téléchargement de cette IA et actualisation des autres IAs.");

								setNewCode(id);
							}
						});
					} else {
						console.log("L'IA n'a pas été créée, problème avec le serveur.");
					}
				}
			});
		} else {
			console.log("Il est nécessaire de saisir un nom.");
		}
	}
	// =====================================================
	// ====================== RENAME =======================
	else if (commande[0] == ".rename") {
		var id = parseInt(commande[1]),
			index = __AI_IDS.indexOf(id);

		if (index != -1) {
			if (commande[2]) {
				$.post({
					url: "/index.php?page=editor_update",
					data: {
						color: 0,
						id: id,
						name: commande.slice(2).join(" "),
						save: true,
						token: __TOKEN
					},
					success: function(res, data) {
						console.log("Le changement " + ((JSON.parse(data)) ? "a" : "\033[91mn'\033[00ma \033[91mpas\033[00m") + " été accepté par le serveur.");
					}
				});
			} else {
				console.log("C'est bien de vouloir renommer son IA, mais faut peut-être choisir un nouveau nom. - Après moi je dis ça... :B");
			}
		} else {
			console.log(".rename [id] [new_name]");
			showListIA();
		}
	}
	// =====================================================
	// ====================== PLUGIN =======================
	else if (commande[0] == ".plugin") {
		if (commande[1] == "update" && commande[2]) {
			var cmd = ".plugin install " + commande[2] + " y";
			console.log("Alias de " + cmd);
			return useCommande(cmd);
		}
		if (commande[1] == "install" && commande[2]) {
			console.log("Obtention de la liste des plugins.");
			getRepositoryJSON(function(res, data) {
				data = JSON.parse(data);

				for (var i = 0; i < data.length; i++) {
					if (data[i].name.toLowerCase() == commande[2].toLowerCase()) {
						if (_PLUGINS[data[i].name] && commande[3] != "y") {
							console.log("\033[92mVous utilisez déjà ce plugin.\033[00m\n");
							return;
						}

						console.log("Téléchargement du plugin : " + data[i].name);
						var url = data[i].url,
							plugname = data[i].name;
						getLeeKloudPlugin(url, function(res, data) {
							sendMP(16520, "Installation de " + plugname + ".");
							setFileContent(url, data);

							console.log("\033[96m");
							splashMessage("Le plugin a été installé !");
							console.log("\033[00m");
							shutdown();
						});
						return;
					}
				}

				console.log("Aucun plugin porte ce nom.\n");
			});
		} else if (commande[1] == "list") {
			console.log("Obtention de la liste des plugins.");
			getRepositoryJSON(function(res, data) {
				data = JSON.parse(data);
				var s = (data.length <= 1) ? "" : "s";
				console.log("\033[96m");
				splashMessage(data.length + " plugin" + s);
				console.log("\033[00m");
				for (var i = 0; i < data.length; i++) {
					console.log("\033[96mName :\033[95m " + data[i].name + "\033[00m");
					console.log("\033[96mDescription :\033[00m " + data[i].description);
					console.log("\033[96mHash :\033[00m " + (_PLUGINS[data[i].name] ? "\033[92m" + _PLUGINS[data[i].name].hash + "\033[00m" : "?"));
					console.log("\033[96mEtat :\033[00m " + (_PLUGINS[data[i].name] ? "\033[92mVous utilisez" : "\033[93mVous n'utilisez pas") + " ce plugin.\033[00m");
					console.log(" ");
				} //\033[96m
			});
		} else {
			console.log("La sous-commande n'existe pas, ou les paramètres sont invalides.");
			printHelp([
				[".plugin install [name] ", "Installe le plugin [name]"],
				[".plugin list           ", "Affiche la liste des plugins que vous pouvez utiliser"],
				[".plugin update [name]  ", "Met à jour le plugin [name]"],
				//[".plugin remove [name]  ", "Supprime le plugin [name]"],
			]);
		}
	}
	// =====================================================
	// ====================== CHALLENGE ====================
	else if (commande[0] == ".challenge") {
		var id = parseInt(commande[1]),
			enemy = parseInt(commande[2]);

		if (__LEEK_IDS[id]) {
			sendFight({
				leek_id: __LEEK_IDS[id],
				challenge_id: enemy
			});
		} else {
			console.log("Le numéro du Leek doit-être entre 0 et " + (__LEEK_IDS.length - 1) + ".");
		}
	}
	// =====================================================
	// ====================== SANDBOX ======================
	else if (commande[0] == ".sandbox") {
		var ia_id = parseInt(commande[1]),
			index = __AI_IDS.indexOf(ia_id),
			leekid = __LEEK_IDS[parseInt(commande[2])];

		if (index != -1) {
			if (leekid) {
				sandbox(ia_id, leekid);
			} else {
				console.log("Le numéro du Leek doit-être entre 0 et " + (__LEEK_IDS.length - 1) + ".");
			}
		} else {
			console.log(".sandbox [id] [num_leek]");
			showListIA();
		}
	}
	// =====================================================
	// ====================== LEEKLOUD-UPDATE ==============
	else if (commande[0] == ".leekloud-update") {
		if (__mustBeUpdate && commande[1] && (commande[1].match(/^o(ui)?/i) || commande[1].match(/^y(es)?/i))) {
			verifyVersion(true);
		} else if (!__mustBeUpdate) {
			console.log("Vous n'avez pas besoin d'utiliser cette commande.");
		} else {
			console.log("Confirmez la commande.");
			rl.line = ".leekloud-update y";
		}
	}
	// =====================================================
	// ====================== CHANGELOG ====================
	else if (commande[0] == ".changelog") {
		var version = commande[1];
		if (!version || /^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}[A-z]?$/.test(version)) {
			showChangelog(version ? version : "0", true);
		} else if (version) {
			console.log("Format de la version incorrect, il doit-être " + __version + " (X.X.X).");
		}
	}
	// =====================================================
	// ====================== LOGOUT =======================
	else if (commande[0] == ".logout") {
		console.log(__FARMER_ID + " " + __TOKEN);
		$.post({
			url: "/index.php?page=farmer_update",
			data: {
				id: __FARMER_ID,
				logout: true,
				token: __TOKEN
			},
			success: function(res, data) {
				console.log("Requête de déconnexion reçue par le serveur.");
			}
		});

		fs.unlinkSync(".temp/cookie");
		return shutdown();
	}
	// =====================================================
	// ===================== HELP ==========================
	else if (["help", "?", ".help", "/?"].indexOf(commande[0]) != -1) {
		console.log("Aide :");
		printHelp(__HELP_COMMANDS);
		console.log("(?) [\033[95mnum_leek\033[00m] est le numéro de votre poireau (entre 0 et " + (__LEEK_IDS.length - 1) + ")");
		console.log("Autres : { \033[95mopen / twitter / chat / forum / leek / doc / .leekloud-update / .logout\033[00m }".replace(/ \/ /g, "\033[00m / \033[95m"));
		console.log(" ");
		console.log("Astuces :");
		console.log("- Si on vous demande de taper \"\033[95m.backup \033[00m[\033[95mid\033[00m]\" ou \"\033[95m.forceupdate \033[00m[\033[95mid\033[00m]\", essayez la flèche du haut.");
		console.log("- Essayez la touche tabulation lors de la saisie d'une commande.");
		console.log("- La commande \033[95m.logout\033[00m permet de vous déconnecter (elle supprime les cookies).");
	}
	// =====================================================
	// ===================== chat ==========================
	else if (commande[0] == "chat") {
		console.log("Le chat 12z : canal de discussion (HomeMade) - Programmation");
		open("http://chat.12z.fr/");
	}
	// =====================================================
	// ======= EN AVANT LES HISTOIRES ! ====================
	else if (__CMD_PLUGINS[commande[0]]) {
		try {
			_PLUGINS[__CMD_PLUGINS[commande[0]]].useCommande(line);
		} catch (err) {
			console.log(err.stack);
		}
	} else {
		var C = false;
		switch (commande[0]) {
			case "open":
				open(process.cwd());
				break;
			case "clear":
				process.stdout.write("\x1Bc");
				invasionB();
				console.log("LeeKloud est actif.");
				break;
			case "twitter":
				C = open("https://twitter.com/GuimDev");
				break;
			case "forum":
				C = open("http://leekwars.com/forum/category-7/topic-221");
				break;
			case "leek":
				C = open("http://leekwars.com/");
				break;
			case "doc":
				C = open("http://leekwars.com/documentation");
				break;
			default:
				console.log("Inconnu regarde l'aide \".help\".");
		}
		if (C) {
			console.log("Page ouverte " + commande[0] + ".");
		}
	}
	console.log(" ");
}

function printHelp(lines) {
	for (var i = 0, line; i < lines.length; i++, line) {
		line = [lines[i][0], lines[i][1]];
		line[0] = line[0].replace(/([\/\[\]\{\}])/g, "\033[00m$1\033[95m");
		console.log("\033[95m" + line.join("\033[00m : ") + ".");
	}
}

function completerId(cmd, line, hits, verify) {
	var verify = (verify) ? verify : function(id, index) {
		return true;
	};

	var t = [cmd];
	if (line.indexOf(cmd) == 0) {
		__AI_IDS.forEach(function(id, index) {
			if (!verify(id, index)) {
				return;
			}
			t.push(cmd + id);
		});
		hits = t.filter(function(c) {
			return c.indexOf(line) == 0;
		});
		if (hits.length == 0) {
			hits = t;
		}
	}
	return hits;
}

function completerMore(line, hits) {
	if (hits.length == 1) {
		line = hits[0];
	}
	hits = completerId(".backup ", line, hits);
	hits = completerId(".forceupdate ", line, hits);
	hits = completerId(".open ", line, hits);
	hits = completerId(".compare ", line, hits);
	hits = completerId(".rename ", line, hits);
	hits = completerId(".sandbox ", line, hits);

	return {
		line: line,
		hits: hits
	};
}

var __CMD_PLUGINS = [],
	__HELP_COMMANDS = [
		[".open    [id]            ", "Ouvrir l'IA"],
		[".compare [id1] [id2]     ", "Comparer deux IAs"],
		[".create  [new_name]      ", "Créer une IA"],
		[".rename  [id] [new_name] ", "Changer le nom de l'IA"],
		[".sandbox [id] [num_leek] ", "Lance un combat de test"],
		[".changelog    [version]  ", "Affiche les entrées du CHANGELOG"],
		[".forceupdate  [id]       ", "Forcer l'envoi de l'IA"],
		[".refresh                 ", "Rafraîchir les scripts depuis le serveur"],
		[".logout                  ", "Déconnecte le farmer (supprime les cookies)"],
		[".plugin    {install / list / update / remove} ", "Gestion des plugins"],
		[".backup    [id] {restore / open / compare}    ", "Gestion des backups"],
		[".challenge [num_leek] [leekid] ", "Lance un challenge [leekid] est l'id du poireau à attaquer (dans l'url)"]
	],
	__TAB_COMPLETIONS = [
		".open ", ".compare ", ".create ", ".rename ",
		".sandbox ", ".changelog", ".forceupdate ",
		".refresh", ".logout", ".plugin ", ".backup ",
		".challenge ", ".help", ".leekloud-update"
	].concat("open / clear / twitter / chat / forum / MP / leek / doc ".split(" / "));

////--------------------------------------------------------------------------------
////--------------------------------------------------------------------------------
////--------------------------------------------------------------------------------

function writeRapportlog(err) {
	var erreur = "-- " + new Date() + " -- \n\n" + err.stack + "\n\n\n";
	setFileContent("rapport.log", getFileContent("rapport.log", true) + erreur);
	console.log("L'erreur a été reportée dans le fichier :\n\033[96m" + fs.realpathSync("./rapport.log") + "\033[0m\n");
}

function saveHistory() {
	setFileContent(".temp/history", JSON.stringify(rl.history.slice(1, 40)));
}

function invasionB(b) {
	b = b ? true : false;
	if (b) {
		process.stdout.write("\x1Bc");
	}
	var a = [2129856, 2195504, 2490380, 2634114, 2634114, 3158401, 3145729, 3178433, 2638914, 2639746, 2504716, 2195504, 2129856];

	var noNegative = function(value) {
		return value = (value < 0) ? 0 : value;
	};

	var stdout = process.stdout;
	console.log(" ");
	for (var i = 0, value = 0; i < a.length; i++) {
		value = a[i].toString(2).substr(1);
		console.log(Array(noNegative((stdout.columns - value.length) / 2).round()).join(" ") + value.replace(/0/g, " "));
	}
	console.log(" ");
}
invasionB(0);

function sha256(data) {
	return crypto.createHash("sha256").update(data).digest("base64");
}

var __HIDDEN_PLAY = false;

function hidden(query, callback) {
	var stdin = process.openStdin(),
		i = 0;
	__HIDDEN_PLAY = true;
	process.stdin.on("data", function(char) {
		if (!__HIDDEN_PLAY) {
			return;
		}
		char = char + "";
		switch (char) {
			case "\u0003":
				process.exit();
				break;
			case "\n":
			case "\r":
			case "\u0004":
				__HIDDEN_PLAY = false;
				break;
			default:
				process.stdout.write("\033[2K\033[200D" + query + "[" + ((i % 2 == 1) ? "=-" : "-=") + "]");
				i++;
				break;
		}
	});

	rl.question(query, function(value) {
		rl.history = rl.history.slice(1);
		callback(value);
	});
}

function fixASCII(data) { // Problème d'encodage, on vire le caractère 65279.
	while (data.charCodeAt(0) == 65279) {
		data = data.replace(/^./, "");
	}
	return data;
}

function get(option) {
	option.method = "GET";
	return ajax(option);
}

function post(option) {
	option.method = "POST";
	return ajax(option);
}

function ajax(option) {
	var data = (option.data) ? querystring.stringify(option.data) : "",
		context = (option.context) ? option.context : {},
		supplob = {
			done: function(a) {
				return (a) ? supplob.done = a : null;
			}
		};

	var options = {
		host: "leekwars.com",
		port: "80",
		path: option.url,
		method: (option.method == "GET") ? "GET" : "POST",
		headers: {
			"User-Agent": "NodeJS " + _Vname.split("/"),
			"Content-Type": "application/x-www-form-urlencoded",
			"Content-Length": data.length,
			"Cookie": myCookie
		}
	};

	var req = http.request(options, function(res) {
		res.setEncoding("utf8");
		var content = "";

		res.on("data", function(chunk) {
			content += chunk;
		});

		res.on("end", function() {
			setFileContent(".temp/debug_print_r.js", print_r(res));
			if (option.success) {
				option.success(res, fixASCII(content), context);
			}
			supplob.done(res, fixASCII(content), context);
		});
	});

	req.on("error", function(e) {
		console.log("\033[91mProblème avec la requête : " + e.message + "\033[00m");
		setTimeout(function() {
			return ajax(option);
		}, 1500);
	});

	req.write(data);
	req.end();

	return supplob;
}

function ajaxLeeKloud(path, success) {
	var options = {
		host: "raw.githubusercontent.com",
		port: "443",
		path: path,
		method: "GET",
		headers: {
			"User-Agent": "NodeJS " + _Vname.split("/")
		}
	};
	var req = https.request(options, function(res) {
		var c = "";
		res.setEncoding("utf8");
		res.on("data", function(chunk) {
			c += chunk;
		});
		res.on("end", function() {
			if (success) {
				success(res, fixASCII(c));
			}
		});
	}).on("error", function(e) {
		console.log("\033[91mProblème avec la requête : " + e.message + "\033[00m");
		setTimeout(function() {
			return ajaxLeeKloud(path, success);
		}, 1500);
	}).end();
}

function getLeeKloudPlugin(path, success) {
	ajaxLeeKloud("/GuimDev/LeeKloud/master/" + path, success);
}

function getRepositoryJSON(success) {
	ajaxLeeKloud("/GuimDev/LeeKloud/master/repository.json", success);
}

function getLeeKloud(success) {
	ajaxLeeKloud("/GuimDev/LeeKloud/master/_LeeKloud.js", success);
}

function getChangeLogLeeKloud(success) {
	ajaxLeeKloud("/GuimDev/LeeKloud/master/CHANGELOG", success);
}

function dataCookieToString(dataCookie) {
	var t = "";
	for (var x = 0; x < dataCookie.length; x++) {
		t += ((t != "") ? "; " : "") + dataCookie[x].key + "=" + dataCookie[x].value;
	}
	return t;
}

function mkdataCookie(cookie) {
	var t, j;
	cookie = cookie.toString().replace(/,([^ ])/g, ",[12],$1").split(",[12],");
	for (var x = 0; x < cookie.length; x++) {
		cookie[x] = cookie[x].split("; ");
		j = cookie[x][0].split("=");
		t = {
			key: j[0],
			value: j[1]
		};
	        if (t.value === "deleted") continue;
		for (var i = 1; i < cookie[x].length; i++) {
			j = cookie[x][i].split("=");
			t[j[0]] = j[1];
		}
		cookie[x] = t;
	}

	return cookie;
}

function print_r(obj) {
	var cache = [];
	return JSON.stringify(obj, function(key, value) {
		if (typeof value === "object" && value !== null) {
			if (cache.indexOf(value) !== -1) {
				return;
			}
			cache.push(value);
		}
		return value;
	});
}

////--------------------------------------------------------------------------------
////----------------------------- // LICENCE CC BY-SA \\ ---------------------------
////-------------- Le code ci-dessous est partagé en licence CC BY-SA --------------
////------------- http://creativecommons.org/licenses/by-nc-sa/3.0/fr/  ------------
////------------------------------------------------------------ Par @GuimDev ------
////--------------------------------------------------------------------------------

function wordwrap(str, width, delimiter, cut) {
	var reg = ".{1," + width + "}(\\s|$)" + ((cut) ? "|.{" + width + "}|.+$" : "|\\S+?(\\s|$)");
	return str.match(RegExp(reg, "g")).join(delimiter || "\n");
}

function LeeKloudStop(bool) {
	saveHistory();
	if (!bool) {
		invasionB(1);
	}
	console.log("Arrêt.");
	process.exit(1)
}

function launcherReadline() {
	console.log(">> Readline : Ok.");

	rl.setPrompt("> ", 2);
	rl.on("line", function(line) {
		useCommande(line);
		rl.prompt();
	});
	rl.on("close", function() {
		LeeKloudStop();
		return;
	});
	rl.on("SIGINT", function() {
		rl.clearLine();
		rl.question("Es-tu sûr de vouloir éteindre le listener ? ", function(answer) {
			return (answer.match(/o(ui)?/i) || answer.match(/y(es)?/i)) ? LeeKloudStop() : rl.output.write("> ");
		});
	});
	rl.prompt();
}

var fu = function(type, args) {
	var t = Math.ceil((rl.line.length + 3) / process.stdout.columns);
	var text = util.format.apply(console, args);
	rl.output.write("\n\x1B[" + t + "A\x1B[0J");
	rl.output.write(text + "\n");
	rl.output.write(Array(t).join("\n\x1B[E"));
	rl._refreshLine();
};

console.log = function() {
	fu("log", arguments);
};
console.warn = function() {
	fu("warn", arguments);
};
console.info = function() {
	fu("info", arguments);
};
console.error = function() {
	fu("error", arguments);
};

function completer(line) {
	var completions = __TAB_COMPLETIONS;
	var hits = completions.filter(function(c) {
		return c.indexOf(line) == 0;
	});
	var b = completerMore(line, hits),
		a = (line != b.line) ? [b.line] : [];

	hits = b.hits;
	if (hits.length == 1) {
		return [hits, line];
	} else {
		console.log("Suggestion :");
		var list = "",
			l = 0,
			c = "",
			t = hits.length ? hits : completions;
		for (var i = 0; i < t.length; i++) {
			c = t[i].replace(/(\s*)$/g, "")
			if (list != "") {
				list += ", ";
			}
			if (((list + c).length + 4 - l) > process.stdout.columns) {
				list += "\n";
				l = list.length;
			}
			list += c;
		}
		console.log(list + "\n");
		return [a, line];
	}
}

////--------------------------------------------------------------------------------
////-------------------------- Fin de la LICENCE CC BY-SA --------------------------
////--------------------------------------------------------------------------------
////--------------------------------------------------------------------------------

////--------------------------------------------------------------------------------
////---------- https://github.com/jjrdn/node-open/blob/master/lib/open.js ----------
////-------------------------------------------- Copyright (c) 2012 Jay Jordan -----
////--------------------------------------------------------------------------------

function open(target, appName, callback) {
	var opener;

	if (typeof(appName) === "function") {
		callback = appName;
		appName = null;
	}

	switch (process.platform) {
		case "darwin":
			if (appName) {
				opener = 'open -a "' + o_escape(appName) + '"';
			} else {
				opener = 'open';
			}
			break;
		case "win32":
			if (appName) {
				opener = 'start "" "' + o_escape(appName) + '"';
			} else {
				opener = 'start ""';
			}
			break;
		default:
			if (appName) {
				opener = o_escape(appName);
			} else {
				opener = 'xdg-open';
			}
			break;
	}

	return exec(opener + ' "' + o_escape(target) + '"', callback);
}

function o_escape(s) {
	return s.replace(/"/, "\\\"");
}
