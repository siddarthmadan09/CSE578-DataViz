import { version } from '../../package.json';
import { Router } from 'express';
import facets from './facets';

export default ({ config, db }) => {
	let api = Router();

	// mount the facets resource
	api.use('/facets', facets({ config, db }));

	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	api.get('/offering', (req, res) => {
		var dbo = db.db("dv_project");
  		dbo.collection("offerings").find({}).toArray( function(err, result) {
    	if (err){
			throw err;
		}
		res.json(result );
		});
		
	});

	api.get('/review/:offering_id', (req, res) => {
		let offering_id = parseInt(req.params['offering_id']);
		console.log(offering_id);
		var dbo = db.db("dv_project");
  		dbo.collection("reviews").find({offering_id}).toArray( function(err, result) {
    	if (err){
			throw err;
		}
		res.json(result );
		});
		
	});

	return api;
}
