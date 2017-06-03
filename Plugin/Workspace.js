var _WKfolder = "Workspace/";

var node_fs = require('fs'),
	node_path = require('path');

var fs = {
	existsSync: node_fs.existsSync,
	mkdirSync: node_fs.mkdirSync,
	unwatchFile: node_fs.unwatchFile,
	readdirSync: node_fs.readdirSync,
	readFileSync: node_fs.readFileSync,
	realpathSync: node_fs.realpathSync,
	statSync: node_fs.statSync,
	myFiles: {},
	_addFileInfo: function(key, name) {
		var path = fs.realpathSync(key + "/" + name),
			stat = fs.statSync(path);
		fs.myFiles[key][name] = {
			name: name,
			path: path,
			mtime: new Date(stat.mtime).getTime(),
			stat: stat
		};
	},
	_updateFileInfo: function(key) {
		var files = fs.myFiles[key],
			file = null;
		for (var x in files) {
			file = files[x];
			if (!fs.existsSync(file.path)) {
				return file.name;
			}
		}
		return false;
	},
	watchDir: function(dirname, options, listener) {
		fs.unwatchFile(dirname);
		fs.watch(dirname, options, function(event, filename) {
			if (filename.indexOf(dirname) !== 0) {
				filename = dirname + filename;
			}
			listener(event, filename, dirname);
		});
	},
	watch: function(dirname) {
		var bool = typeof(arguments[1]) == "object",
			options = (bool) ? arguments[1] : {},
			listener = arguments[(bool) ? 2 : 1];

		var key = fs.realpathSync(dirname),
			files = fs.readdirSync(dirname);

		fs.myFiles[key] = {};
		for (var i = 0, file = null; i < files.length; i++) {
			fs._addFileInfo(key, files[i]);
			file = fs.myFiles[key][files[i]];
			//console.log(file.path);
			if (file.stat.isDirectory() && options.recursive) {
				fs.watchDir(dirname + file.name + "/", options, listener);
			}
		}

		node_fs.watch(dirname, {}, function(event, filename) {
			//console.log("if", event, filename, old);
			var old = fs._updateFileInfo(key);
			if (event == "rename" && filename == null && old !== false) {
				event = "unlink";
				filename = old;
				fs.unwatchFile(key + "/" + filename);
				delete fs.myFiles[key][filename];
			} else if (event == "rename" && filename != null && !fs.myFiles[key][filename] && fs.existsSync(dirname + filename + "/")) {
				fs._addFileInfo(key, filename);
				if (old === false) {
					event = "add";
					if (fs.myFiles[key][filename].stat.isDirectory()) {
						event = "addDir";
						if (options.recursive) {
							fs.watchDir(dirname + filename + "/", options, listener);
						}
					}
				} else {
					event = "rename";
					delete fs.myFiles[key][filename];
				}
			} else if (event == "change" && filename != null && fs.myFiles[key][filename] && old === false) {
				var stat = fs.statSync(fs.realpathSync(key + "/" + filename)),
					mtime = new Date(stat.mtime).getTime();
				if (fs.myFiles[key][filename].mtime != mtime && fs.myFiles[key][filename].stat.isFile()) {
					event = "change";
					fs.myFiles[key][filename].mtime = mtime;
				} else {
					return;
				}
			} else {
				return;
			}

			listener(event, dirname + filename);
		}).on("error", function(err) {
			console.log("\033[91mAtchoum !\033[00m");
			(DEBUG_MODE && console.log(err.stack));
			this.close();
		});
	}
}

var getFileContent = null,
	setFileContent = null,
	showListIA = null,
	printHelp = null,
	sha256 = null,
	open = null,
	__IA = null;

var __AI_CORES = [],
	__AI_IDS = [],
	__AI_LEVELS = [],
	__AI_NAMES = [],
	__LEEK_IDS = [],
	__FARMER_ID = 0,
	__FARMER_NAME = "";

var _PLUGINS = [];

var DEBUG_MODE = false;

/*
 * =========================================================================================
 * ======================================= WORKSPACE =======================================
 * =========================================================================================
 */

module.exports = {
	hash: null,
	wkfolder: _WKfolder,
	parent: {},
	rules: {},
	commandes: {
		main: ".workspace",
		completion: ".workspace ",
		//	  [".challenge [num_leek] [leekid] ", "Lance un challenge [leekid] est l'id du poireau à attaquer (dans l'url)"]
		help: [".workspace                     ", "Pour obtenir des informations"]
	},
	useCommande: function(line) {
		var commande = line.split(" ");

		// ===============================================
		// ================ COMPILE ======================
		if (commande[1] == "compile") {
			var id = parseInt(commande[2]),
				index = __AI_IDS.indexOf(id);

			if (index != -1) {
				var myIA = new __IA(id);

				if (fs.existsSync(".temp/" + _WKfolder + "compile[bin" + myIA.id + "].js.lk")) {
					var compile = ".temp/" + _WKfolder + "compile[bin" + myIA.id + "].js.lk";
					myIA.setIAData(getFileContent(compile));
					console.log("L'IA a été correctement compilée.");
				} else {
					console.log("Aucune compilation disponible pour cette IA, essayez \"\033[95m.workspace force\033[00m\" avant de refaire cette commande.");
				}
			} else {
				console.log(".workspace compile [id]");
				showListIA();
			}
		}
		// ===============================================
		// ===================== FORCE ===================
		else if (commande[1] == "force") {
			console.log("Compilation dans une seconde.");
			setTimeout(JSON_config.compile, 1000);
		}
		// ===============================================
		// ===================== COMPARE =================
		else if (commande[1] == "compare" && !_PLUGINS["Prettydiff"]) {
			console.log("Le plugin Prettydiff doit-être installé pour comparer un fichier.");
		} else if (commande[1] == "compare") {
			var id = parseInt(commande[2]),
				index = __AI_IDS.indexOf(id);

			if (index != -1) {
				var myIA = new __IA(id);

				if (fs.existsSync(".temp/" + _WKfolder + "compile[bin" + myIA.id + "].js.lk")) {
					var compile = ".temp/" + _WKfolder + "compile[bin" + myIA.id + "].js.lk";
					_PLUGINS["Prettydiff"].compare(myIA.filepath, compile);
					console.log("Mise à jour de l'IA n°\033[36m" + myIA.id + "\033[00m, \033[36m" + __AI_NAMES[index] + "\033[00m.");
					console.log("Comparaison de l'IA ");
				} else {
					console.log("Aucune compilation disponible pour cette IA, essayez \"\033[95m.workspace force\033[00m\" avant de refaire cette commande.");
				}
			} else {
				console.log(".workspace compare [id]");
				showListIA();
			}
		}
		// ===============================================
		// ===================== DEBUG ===================
		else if (commande[1] == "debug") {
			DEBUG_MODE = !DEBUG_MODE;
			console.log("DEBUG_MODE : " + ((DEBUG_MODE) ? "Activé" : "Désactivé") + ".");
		}
		// ===============================================
		// ===================== DEFAULT =================
		else if (commande[1] == "default") {
			if (!fs.existsSync(_WKfolder + "workspace.json") || commande[2]) {
				var alphaC = "zyxwvutsrqponmlkjihgfedcba~?>=<:.-,+`;@_^!'][";
				var alphabet = "[\n\t{ /1erwokspac:\"id42,l'.uvtègnqéx-fmy*h_]}à";
				var code_de_base = ["zyxwvuuvtsrv$qpronmlksvjyx",
					"xihgijvfedvuuv$cbhgvgsvcb$h$layxxirsk~rnh?",
					"sijv>r~sdvuuv$cs█████████nvr=<csnvnp:>vlmm",
					"ch.~-snvl~,vnp██~n+gpnnhs██rnayxxi`hcsnijv",
					"zyxxxi;@`pcg██sru_acoidvuuv██$n-csk>hp::sv",
					">p~nvcsnv`h█k^hsr██nva██covgl█:nviteuivs>v",
					"gl:nvcsnvnp█~n+gp██nnh██srnay█xxxi;lh:!tea",
					"coiyxx'yx]█dyxwvu██uve██=;sv$q█pronmlksvjy",
					"xxihgijvte█dvuuv$cbhgvgsvcb$h$█layxxirsk~r",
					"nh?sijv`lc█nsdvu█████████uv$cs█nvr=<csnv:s",
					"vnp:>vmlnvl█mmch█.~-█snv█l~,v█np~n+gpnnhsr",
					"nayxxi`hcsn█ijvz█vuu████v$clv█chn>svgsnv`h",
					"k^hsrnv[vh:k██c~r███svjyxxx██i;@`pcgsru_ac",
					"oidyxxxiteu_ac██oidvuuv$n██-csk>hp::sv>p~n",
					"vcsnv`hk^hsrnvac█████████ov[vclvrlkh:svgsv",
					"iteuiayxxxi;lh:!teacoivuuv$nscsk>hp::svcsv",
					"`hk^hsrv;lh:!teacoayxx'yx]y'y"
				].join("").decompressIA(alphaC, alphabet);
				setFileContent(_WKfolder + "workspace.json", code_de_base);
				open(fs.realpathSync(_WKfolder + "workspace.json"));
				console.log("Le fichier a été créé.");
			} else {
				console.log("Forcez la création du fichier avec \"\033[95m.workspace default y\033[00m\".");
			}
		}
		// ===============================================
		// ===================== AIDE ====================
		else {
			console.log("Bienvenue dans les workspace, il n'y a presque pas de commande. :'(\n\n");

			console.log("Aide :");
			printHelp([
				[".worskpace compile", "Autorise la compilation d'une IA."],
				[".worskpace force", "Force la compilation de tous les Workspace."],
				[".worskpace compare", "Compare l'IA actuelle avec l'IA compilé."],
				[".worskpace default", "Créer le fichier d'exemple `worskpace.json`"],
				[".worskpace debug", "Active / Désactive le mode debug (affiche les messages de debug)"]
			]);
		}
	},
	load: function() {
		if (!fs.existsSync(".temp/" + _WKfolder)) {
			fs.mkdirSync(".temp/" + _WKfolder);
		}
		if (!fs.existsSync(_WKfolder)) {
			fs.mkdirSync(_WKfolder);
		}

		var lk = this.parent;

		__IA = lk.__IA;
		__AI_CORES = lk.__AI_CORES;
		__AI_IDS = lk.__AI_IDS;
		__AI_LEVELS = lk.__AI_LEVELS;
		__AI_NAMES = lk.__AI_NAMES;
		__LEEK_IDS = lk.__LEEK_IDS;
		__FARMER_ID = lk.__FARMER_ID;
		__FARMER_NAME = lk.__FARMER_NAME;
		_PLUGINS = lk._PLUGINS;
		getFileContent = lk.getFileContent;
		setFileContent = lk.setFileContent;
		showListIA = lk.showListIA;
		printHelp = lk.printHelp;
		sha256 = lk.sha256;
		open = lk.open;
		String.prototype.decompressIA = lk.decompressIA;

		fs.unwatchFile(_WKfolder);
		fs.watch(_WKfolder, {
			recursive: true
		}, function(event, filename) {
			filename = node_path.relative(_WKfolder, filename).replace(/\\/g, "/");
			console.log("\033[93m[\033[92m" + event + "\033[93m] " + filename + "\033[00m");
			var extension = filename.split('.').pop();
			var path = _WKfolder + filename;
			if (filename.toLowerCase() == "workspace.json") {
				JSON_config.load();
			} else if (JSON_config.table_files == null) {
				return;
			} else if (event == "change" && JSON_config.table_files[path]) {
				JSON_config.compile(JSON_config.table_files[path]);
			} else if (event == "add") {
				JSON_config.addFile(path);
				JSON_config.compile(JSON_config.table_files[path]);
			} else if (event == "unlink" && JSON_config.table_files[path]) {
				var num = JSON_config.table_files[path];

				for (var i = 0, arr; i < num.length; i++) {
					for (var j = 0; j < JSON_config.order_files[num[i]].length; j++) {
						arr = JSON_config.order_files[num[i]][j];
						if (arr && arr.indexOf(path) !== -1) {
							delete arr[arr.indexOf(path)];
						}
					}
				}
				delete JSON_config.table_files[path];
				JSON_config.compile(num);
			}
		});

		JSON_config.load();
	}
};

/*
 * =========================================================================================
 * ====================================== JSON_CONFIG ======================================
 * =========================================================================================
 */

var JSON_config = {
	config: null,
	rules: null,
	table_files: null,
	order_files: null,
	// =====================================================
	// ====================== COMPILE ======================
	compile: function(num) {
		var config = JSON_config.config;
		var order_files = JSON_config.order_files;
		var messages = [];

		num = (num) ? num : false;
		for (var i = 0, content, myIA, actual; i < config.length; i++) {
			myIA = new __IA(config[i].id);
			if ((num !== false && num.indexOf(i) === -1) || !order_files[i]) {
				continue;
			}
			console.log("\033[92m[\033[93m" + i + "\033[92m] Compilation de l'IA : \033[93m" + myIA.name + "\033[92m, \033[93m" + myIA.id + "\033[00m");

			content = "";

			for (var j = 0, path, file, stat; j < order_files[i].length; j++) {
				if (!order_files[i][j]) {
					continue;
				}
				for (var l = 0; l < order_files[i][j].length; l++) {
					path = order_files[i][j][l];
					if (!path || !fs.existsSync(path)) {
						continue;
					}
					file = getFileContent(path);
					stat = fs.statSync(path);
					(DEBUG_MODE && console.log("Ajout de l'IA : " + path));
					content += (content != "") ? "\n\n\n" : "";
					content += "/*\n";
					content += " * @LK_DATE:\"" + stat.mtime.toGMTString() + "\"\n";
					content += " * @LK_PATH:\"" + path + "\"\n";
					content += " * @LK_HASH:\"" + sha256(file) + "\"\n";
					content += " * @LK_FROM:\"" + (content.split("\n").length + 3) + "\"";
					content += "" + " @LK_TO:\"" + ((content + file).split("\n").length + 3) + "\"\n";
					content += " */\n\n";
					content += file + "\n";
				}
			}

			actual = myIA.getIAData();
			if (!/@LK_/.test(actual)) {
				messages.push("L'IA \033[36m" + myIA.filename + "\033[00m semble ne jamais avoir été compilée.");
				messages.push("Pour la première fois vous devez taper \"\033[95m.workspace compile " + myIA.id + "\033[00m\".");
			} else {
				myIA.setIAData(content);
			}
			setFileContent(".temp/" + _WKfolder + "compile[bin" + myIA.id + "].js.lk", content);
		}
		for (var i = 0; i < messages.length; i++) {
			(i === 0 && console.log(""));
			console.log(messages[i]);
		}
		console.log("");
	},
	// =====================================================
	// ====================== ADDFILE ======================
	addFile: function(file, dir) {
		(DEBUG_MODE && console.log(file));
		var the_left_dir = node_path.dirname(node_path.resolve(file));
		for (var j = 0; j < JSON_config.rules.length; j++) {
			for (var k = 0, left, regex, rule, once = true; k < JSON_config.rules[j].length; k++) {
				rule = JSON_config.rules[j][k];
				left = false;
				regex = false;
				if (the_left_dir.toLowerCase().indexOf(rule[0].toLowerCase()) === 0) {
					left = true;
					regex = rule[1].test(node_path.relative(_WKfolder, file).replace(/\\/g, "/"));
					once = ((JSON_config.table_files[file] || []).indexOf(j) === -1);
					if (regex && once === true) {
						console.log("\033[92m[\033[93m" + j + "\033[92m] Inclus : " + file + "\033[00m");

						if (JSON_config.table_files[file]) {
							JSON_config.table_files[file].push(j);
						} else {
							JSON_config.table_files[file] = [j];
						}

						if (!JSON_config.order_files[j]) {
							JSON_config.order_files[j] = [];
						}
						if (!JSON_config.order_files[j][k]) {
							JSON_config.order_files[j][k] = [];
						}
						JSON_config.order_files[j][k].push(file);
					}
				}
				var colorBoolean = function(a) {
					return ((a) ? "\033[92mtrue" : "\033[91mfalse") + "\033[00m";
				};
				(DEBUG_MODE && console.log("[" + colorBoolean(left) + ", " + colorBoolean(regex) + "] " + colorBoolean(once)));
				if (left && regex) {
					break;
				}
			}
		}
	},
	// =====================================================
	// ======================== MAP ========================
	map: function() {
		JSON_config.table_files = {};
		JSON_config.order_files = [];
		var readDir_Recursive = function(dir) {
			(DEBUG_MODE && console.log(dir));

			var files = fs.readdirSync(dir);
			for (var i = 0, file = "", rel = ""; i < files.length; i++) {
				file = dir + files[i];
				var stat = fs.statSync(file);

				if (stat.isDirectory()) {
					file += "/";
					readDir_Recursive(file);
				} else {
					JSON_config.addFile(file);
				}
			}
		};

		readDir_Recursive(_WKfolder);
		(DEBUG_MODE && console.log(JSON_config.table_files));
		(DEBUG_MODE && console.log(JSON_config.order_files));
		(DEBUG_MODE && console.log(""));

		JSON_config.compile();
	},
	// =====================================================
	// ======================= LOAD ========================
	load: function() {
		JSON_config.config = [];
		JSON_config.rules = [];
		JSON_config.table_files = null;
		JSON_config.order_files = null;
		try {
			if (!fs.existsSync(_WKfolder + "workspace.json")) {
				console.log("Le fichier config n'existe pas merci de créer le fichier `\033[92mworkspace.json\033[00m` dans \033[92m" + fs.realpathSync(_WKfolder) + "\033[00m.");
				return console.log("Vous pouvez créer le fichier avec la commande `\033[96m.workspace default\033[00m`.");
			}
			var config = JSON.parse(JSON_stripComments(getFileContent(_WKfolder + "workspace.json")));
		} catch (err) {
			return console.log("Impossible de parser le fichier JSON.", err);
		}

		if (!(config instanceof Array)) {
			return console.log("Le JSON doit être un array : [ { ..1.. }, { ..2.. } ].");
		} else if (config.length == 0) {
			return console.log("Le tableau n'a aucune entrée : [ ? ].");
		} else {
			for (var i = 0, recursive; i < config.length; i++) {
				if (!JSON_config.verify_id(config, i)) {
					return;
				}
				if (!JSON_config.verify_files(config, i)) {
					return;
				}

				recursive = JSON_config.get_recursive(config, i);
				if (DEBUG_MODE) {
					console.log("`array[" + i + "] : [" + i + " => { recursive: " + (recursive ? "true" : "false") + " } ];`");
				}

				JSON_config.rules[i] = [];
				for (var j = 0, left, regex, rule; j < config[i].files.length; j++) {
					config[i].files[j] = config[i].files[j].replace(/\\/g, "/");

					left = config[i].files[j].split("*").shift().split("/").slice(0, -1).join("/");
					left = node_path.resolve(_WKfolder, left);

					regex = (recursive) ? ".+" : "[^\\\\////]+";
					regex = new RegExp("^" + RegExp.escape(config[i].files[j]).replace("\\*", regex) + "$", "i");

					rule = [left, regex];
					JSON_config.rules[i].push(rule);

					(DEBUG_MODE && console.log("New rule :", rule));
				}
			}
			console.log("\033[92m[\033[93m?\033[92m] Fichier JSON chargé.\033[00m\n");
			JSON_config.config = config;
			JSON_config.map();
		}
	},
	// =====================================================
	// ===================== VERIFY_ID =====================
	verify_id: function(config, i) {
		var plus = ".\n |-- > dans array[" + i + "] : [" + i + " => { id: [ ?? ] } ].";
		if (!config[i].id) {
			console.log("L'id est manquante " + plus);
		} else if (typeof(config[i].id) != "number" && config[i].id != parseInt(config[i].id)) {
			console.log("L'id doit-être un chiffre " + plus);
		} else {
			for (var j = 0; j < __AI_IDS.length; j++) {
				if (__AI_IDS[j] == config[i].id) {
					return true;
				}
			}
			if (__AI_IDS.length == 0) {
				console.log("Vous devez créer une IA.");
			} else {
				console.log("L'id '" + config[i].id + "' n'existe pas, les ids valides sont [" + __AI_IDS.join(", ") + "] " + plus);
			}

			return false;
		}
	},
	// =====================================================
	// ==================== VERIFY_FILES ===================
	verify_files: function(config, i) {
		var plus = ".\n |-- > dans array[" + i + "] : [" + i + " => { files: [ ?? ] } ].";
		if (!(config[i].files instanceof Array)) {
			console.log("La propriété 'files' doit-être un array " + plus);
			return false;
		} else {
			for (var j = 0; j < config[i].files.length; j++) {
				if (typeof(config[i].id) == "string") {
					console.log("La clé numéro " + j + " de 'files' doit-être un chemin d'accès (ychaine de texte) " + plus);
					return false;
				}
			}
			if (__AI_IDS.length == 0) {
				console.log("La propriété 'files' doit avoir au minimum une entrée " + plus);
				return false;
			}
		}

		return true;
	},
	// =====================================================
	// =================== GET_RECURSIVE ===================
	get_recursive: function(config, i) {
		if (config[i].recursive === false || config[i].recursive === 0) {
			return false;
		} else if (config[i].recursive === "false" || config[i].recursive === "0") {
			return false;
		}
		return true;
	}
};

RegExp.escape = function(s) {
	return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/*!
strip-json-comments
Strip comments from JSON. Lets you use comments in your JSON files!
https://github.com/sindresorhus/strip-json-comments
by Sindre Sorhus
MIT License
*/

function JSON_stripComments(str) {
	var currentChar;
	var nextChar;
	var insideString = false;
	var insideComment = false;
	var ret = '';

	for (var i = 0; i < str.length; i++) {
		currentChar = str[i];
		nextChar = str[i + 1];

		if (!insideComment && str[i - 1] !== '\\' && currentChar === '"') {
			insideString = !insideString;
		}

		if (insideString) {
			ret += currentChar;
			continue;
		}

		if (!insideComment && currentChar + nextChar === '//') {
			insideComment = 'single';
			i++;
		} else if (insideComment === 'single' && currentChar + nextChar === '\r\n') {
			insideComment = false;
			i++;
		} else if (insideComment === 'single' && currentChar === '\n') {
			insideComment = false;
		} else if (!insideComment && currentChar + nextChar === '/*') {
			insideComment = 'multi';
			i++;
			continue;
		} else if (insideComment === 'multi' && currentChar + nextChar === '*/') {
			insideComment = false;
			i++;
			continue;
		}

		if (insideComment) {
			continue;
		}

		ret += currentChar;
	}

	return ret;
}
