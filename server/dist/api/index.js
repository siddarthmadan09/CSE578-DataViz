'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _package = require('../../package.json');

var _express = require('express');

var _facets = require('./facets');

var _facets2 = _interopRequireDefault(_facets);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_ref) {
	var config = _ref.config,
	    db = _ref.db;

	var api = (0, _express.Router)();

	// mount the facets resource
	api.use('/facets', (0, _facets2.default)({ config: config, db: db }));

	// perhaps expose some API metadata at the root
	api.get('/', function (req, res) {
		res.json({ version: _package.version });
	});

	api.get('/offering', function (req, res) {
		var dbo = db.db("dv_project");
		dbo.collection("offerings").find({}).toArray(function (err, result) {
			if (err) {
				throw err;
			}
			res.json(result);
		});
	});

	api.get('/review/:offering_id', function (req, res) {
		var offering_id = parseInt(req.params['offering_id']);
		console.log(offering_id);
		var dbo = db.db("dv_project");
		dbo.collection("reviews").find({ offering_id: offering_id }).toArray(function (err, result) {
			if (err) {
				throw err;
			}
			res.json(result);
		});
	});

	return api;
};
//# sourceMappingURL=index.js.map