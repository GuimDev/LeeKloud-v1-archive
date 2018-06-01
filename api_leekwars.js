const EventEmitter = require("events"),
	querystring = require("querystring"),
	https = require("https"),
	fs = require("fs");

const $ = {
	post: post,
	get: get
};

let _Vname = "";
let myCookie = "";

const LeekWarsAPI = (function() {
	function useSession() {
		if (fs.existsSync(".temp/cookie")) {
			const dataCookie = JSON.parse(getFileContent(".temp/cookie"));
			myCookie = dataCookieToString(dataCookie);
			return true;
		}
		return false;
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
			success: function(res, data) {
				try {
					var answer = JSON.parse(data);
				} catch (e) {
					console.error("ERREUR : Parse data impossible");
					return myEmitter.emit("error", data);
				}
				if (answer.success) {
					let dataCookie = mkdataCookie(res.headers["set-cookie"]);
					setFileContent(".temp/cookie", JSON.stringify(dataCookie));

					myCookie = dataCookieToString(dataCookie);

					myEmitter.emit("success", data);
				} else {
					myEmitter.emit("fail", data);
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
		login: login,
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
		var content = "";

		res.on("data", function(chunk) {
			content += chunk;
		});

		res.on("end", function() {
			setFileContent(".temp/debug_print_r.js", print_r(res));
			if (option.success) {
				option.success(res, fixASCII(content), context);
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

function getFileContent(filename, check) {
	if (check && !fs.existsSync(filename)) return "";
	return fixASCII(fs.readFileSync(filename).toString());
}

function setFileContent(filename, data) {
	return fs.writeFileSync(filename, data);
}

function fixASCII(data) { // Problème d'encodage, on vire le caractère 65279.
	while (data.charCodeAt(0) == 65279) {
		data = data.replace(/^./, "");
	}
	return data;
}
