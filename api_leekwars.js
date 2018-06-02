const EventEmitter = require("events"),
	querystring = require("querystring"),
	https = require("https"),
	fs = require("fs");

const LeeKloud = require('./class_leekloud.js');

const $ = {
	post: post,
	get: get
};

let myCookie = "";

function saveCookie(res) {
	if (res.headers["set-cookie"] && LeeKloud.cookieStorage) {
		const dataCookie = mkdataCookie(res.headers["set-cookie"]);
		LeeKloud.setFileContent(LeeKloud.cookieStorage, JSON.stringify(dataCookie, null, 4));
		myCookie = dataCookieToString(dataCookie);
	}
}

function raw2json(raw) {
	try {
		return JSON.parse(raw);
	} catch (e) {
		console.log("ERREUR : Parse data impossible", raw);
		console.log(err);
		console.log(err.stack);
		return process.exit();
	}
}

const LeekWarsAPI = (function() {
	function loadCookie() {
		if (fs.existsSync(LeeKloud.cookieStorage)) {
			const dataCookie = JSON.parse(LeeKloud.getFileContent(LeeKloud.cookieStorage));
			myCookie = dataCookieToString(dataCookie);
			return true;
		}
		return false;
	}
	function useSession() {
		const myEmitter = new EventEmitter();

		if (loadCookie()) {
			const updater = update();

			updater.on("success", function(json) {
				myEmitter.emit("success", json);
			});

			updater.on("fail", function(json) {
				fs.unlinkSync(LeeKloud.cookieStorage);
				myEmitter.emit("fail", json);
			});

			return myEmitter;
		} else { 
			return false; // = Pas de cookie pour toi
		}
	}

	function callback_getFarmerInfo(res, data, context) {
		const myEmitter = context.myEmitter;
		let json = raw2json(data);

		if (json.success) {
			myEmitter.emit("success", json);
			saveCookie(res); // volontairement mis après (car dossier par encore créé).
		} else {
			myEmitter.emit("fail", json);
		}
	}

	// GET farmer/get-from-token/{token}
	function get_from_token() {
		const myEmitter = new EventEmitter();

		$.get({
			url: "/api/farmer/get-from-token/$",
			context: {
				myEmitter: myEmitter
			},
			success: callback_getFarmerInfo
		});

		return myEmitter;
	}

	// POST farmer/login/ {login} {password} {keep_connected}
	function login(login, password, keep_connected) {
		const myEmitter = new EventEmitter();

		$.post({
			url: "/api/farmer/login/",
			data: {
				login: login,
				password: password,
				keep_connected: !!keep_connected
			},
			context: {
				myEmitter: myEmitter
			},
			success: callback_getFarmerInfo
		});

		return myEmitter;
	}

	// POST ai/get/ {ai_id} {token}
	function getIA(ai_id) {
		const myEmitter = new EventEmitter();

		$.post({
			url: "/api/ai/get/",
			data: {
				ai_id: ai_id,
				token: "$"
			},
			context: {
				ai_id: ai_id
			},
			success: function(res, data, context) {
				let json = raw2json(data);

				if (json.success) {
					myEmitter.emit("success", json, context);
				} else {
					myEmitter.emit("fail", json, context);
					process.exit();
				}
			}
		});

		return myEmitter;
	}

	// POST /api/message/create-conversation/ {farmer_id} {message} {token}
	function sendMP(conv, msg) {
		$.post({
			url: "/api/message/create-conversation/",
			data: {
				farmer_id: conv,
				message: msg,
				token: "$"
			},
			success: function(res, data, context) {
				console.log(data);
			}
		});
	}

	// POST farmer/update/ {token}
	function update() {
		const myEmitter = new EventEmitter();

		$.post({
			url: "/api/farmer/update/",
			data: {
				token: "$"
			},
			success: function(res, data) {
				let json = raw2json(data);

				if (json.success) {
					myEmitter.emit("success", json);
				} else {
					myEmitter.emit("fail", json);
					process.exit();
				}
			}
		});

		return myEmitter;
	}

	function init(opt) {
		_Vname = opt._Vname || "LeeKloud crash";
	}

	return {
		useSession: useSession,
		get_from_token: get_from_token,
		login: login,
		update: update,
		getIA: getIA,
		sendMP: sendMP,
		init: init
	}
})();

module.exports = LeekWarsAPI;

function get(option) {
	option.method = "GET";
	return ajax(option);
}

function post(option) {
	option.method = "POST";
	return ajax(option);
}

function ajax(option) {
	const data = (option.data) ? querystring.stringify(option.data) : "",
		context = (option.context) ? option.context : {};

	const options = {
		host: "leekwars.com",
		port: "443",
		path: option.url,
		method: (option.method == "GET") ? "GET" : "POST",
		headers: {
			"User-Agent": "NodeJS " + _Vname.split("/"),
			"Content-Type": "application/x-www-form-urlencoded",
			"Accept": "application/json",
			"Content-Length": data.length,
			"Cookie": myCookie
		}
	};

	const req = https.request(options, function(res) {
		res.setEncoding("utf8");
		let content = "";

		res.on("data", function(chunk) {
			content += chunk;
		});

		res.on("end", function() {
			LeeKloud.setFileContent(LeeKloud.folders.tempLK + "debug_print_r.js", print_r(res));
			if (option.success) {
				saveCookie(res);
				option.success(res, content, context);
				//option.success(res, LeeKloud.fixASCII(content), context);
			}
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
}

function dataCookieToString(dataCookie) {
	let t = "";
	for (let x = 0; x < dataCookie.length; x++) {
		t += ((t != "") ? "; " : "") + dataCookie[x].key + "=" + dataCookie[x].value;
	}
	return t;
}

function mkdataCookie(cookie) {
	let t, j;
	cookie = cookie.toString().replace(/,([^ ])/g, ",[12],$1").split(",[12],");
	for (let x = 0, i; x < cookie.length; x++) {
		cookie[x] = cookie[x].split("; ");
		j = cookie[x][0].split("=");
		t = {
			key: j[0],
			value: j[1]
		};
		if (t.value === "deleted") continue;
		for (i = 1; i < cookie[x].length; i++) {
			j = cookie[x][i].split("=");
			t[j[0]] = j[1];
		}
		cookie[x] = t;
	}

	return cookie;
}

function print_r(obj) {
	let cache = [];
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

function fixASCII(data) { // Problème d'encodage, on vire le caractère 65279.
	while (data.charCodeAt(0) == 65279) {
		data = data.replace(/^./, "");
	}
	return data;
}