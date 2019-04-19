"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (callback) {
	// connect to a database if needed, then pass it to `callback`:
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://localhost:27017/";

	MongoClient.connect(url, function (err, db) {
		if (err) throw err;
		callback(db);
	});
};
//# sourceMappingURL=db.js.map