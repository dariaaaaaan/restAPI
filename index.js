var express = require('express');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var app = express();

app.get('/', function(req, res) { 
res.end()
});

app.use(bodyParser.json({ type: 'application/json'}));

//middleware is added after we load the body parser

app.use(expressValidator());
// extends the standard express req obj with add functions


var postgres = require('./lib/postgres');

function lookupPhoto( req, res, next){
	var photoId = req.params.id;

	//sql query to select the resource object by ID
	var sql = 'SELECT * FROM photo WHERE id = ?';
	postgres.client.query(sql, [photoId], function (err, result){

	if (err){
		console.error(err);
		res.statusCode=500;
		return res.json({errors: ['Could not retrieve photo']});
	}

	//no results returned mean the object is not found
	if (result.rows.length ===0){

		//we are able to set the http status code on the res obj
		res.statusCode = 404;
		return res.json({errors: ['Photo not found']});
	}

	//by attaching a photo prop to the request, its data is now mad avail in our handle funct
	req.photo = result.rows[0];
	next();
  });
};


//express router object for photos
var photoRouter = express.Router();
//get -- root of resource
photoRouter.get ('/',  function (req, res){});

// parseInt attempts to parse the value to an integer
// it returns a special "NaN" value when it is Not a Number.
var page = parseInt(req.query.page, 10);
if (isNaN(page) || page < 1) {
  page = 1;
}
var limit = parseInt(req.query.limit, 10);
if (isNaN(limit)) {
  limit = 10;
} else if (limit > 50) {
  limit = 50;
} else if (limit < 1) {
  limit = 1;
}



// checkBody comes from the express validator
//tests the desc (not empty) and album id (numeric)
// checks field and gives error message

function validatePhoto( req, res, next){
	req.checkBody('description', 'Invalid description').notEmpty();
	req.checkBody('album_id', 'Invalid album_id').isNumeric();
// checks whether the validation lib detected any issues with the performed tests
	var errors = req.validationErrors();
	if (errors) {
		var response = {errors: [] };
		errors.forEach(function(err){
			response.errors.push(err.msg);
		});

		res.statusCode = 400;
		return res.json(response);
	}
	return next();
	
}


//post -- root of resource - creates new object
photoRouter.post('/', validatePhoto, function(req,res){
	var sql = 'INSERT INTO photo (description, filepath, album_id) VALUES ($1, $2, $3) RETURNING id';
	// retrieve the data to insert from the POST body
	var data = [
	req.body.description,
	req.body.filepath,
	req.body.album_id
	];
	postgres.client.query(sql, data, function(err, result){
		if (err){
			// we shield our cliesnts from internal errors but log them
			console.error(err);
			res.statusCode = 500;
			return res.json({
				errors: ['Failed to create photo']

			});
		}

		var newPhotoId =  result.rows[0].id;
		var sql = 'SELECT * FROM photo WHERE id =$1';
		postgres.client.query(sql, [newPhotoId], function(err, result){
			if (err){
				//we shield our clients from internal errors, but log them
				console.error(err);
				res.statusCode = 500;
				return res.json({
					errors: ['Could not retrieve photo after create']
				});		
			}

			//the request created a new resource obj
			res.statusCode = 201;

			// the result of CREATE should be the same as GET
			res.json(result.rows[0]);
		});

	});

});
// specifying a parameter in path for the get of a specif obj
photoRouter.get('/:id', lookupPhoto, function(req, res){
	res.json(req.photo);
});
//similar to get on an obj, to update --patch
photoRouter.patch('/:id', lookupPhoto, function (req, res){});


//delete a specific object
photoRouter.delete('/:id', lookupPhoto, function(req, res){});
//attach the routers for respective paths
app.use('/photo', photoRouter);



var albumRouter =express.Router();

albumRouter.get('/', function (req, res){});

albumRouter.post('/', function (req, res){});

albumRouter.get('/:id', function (req, res){});

albumRouter.patch('/:id', function (req, res){});

albumRouter.delete('/:id', function (req, res){});

app.use('/album', albumRouter);



module.exports = app;
<<<<<<< HEAD


=======
>>>>>>> d61ba19085a022c0ecaee5b272f88ae11558f9c2
