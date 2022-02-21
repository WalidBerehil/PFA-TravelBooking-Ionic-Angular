import {environment} from '../../environments/environment';
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const Busboy = require('busboy');
const os = require('os');
const path = require('path');
const fs = require('fs');

const fbAdmin = require('firebase-admin');
const { v4: uuid } = require('uuid');
uuid();

const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
	projectId: environment.projectId,
});

fbAdmin.initializeApp({
	credential: fbAdmin.credential.cert(require('privatekey.json')),
});

/**
 * HTTP function that supports CORS requests.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
 exports.corsEnabledFunction = (req, res) => {
	// Set CORS headers for preflight requests
	// Allows GETs from any origin with the Content-Type header
	// and caches preflight response for 3600s
  
	res.set('Access-Control-Allow-Origin', '*');
  
	if (req.method === 'OPTIONS') {
	  // Send response to OPTIONS requests
	  res.set('Access-Control-Allow-Methods', 'GET');
	  res.set('Access-Control-Allow-Headers', 'Content-Type');
	  res.set('Access-Control-Max-Age', '3600');
	  res.status(204).send('');
	} else {
	  res.send('Hello World!');
	}
  };

exports.storeImage = functions.https.onRequest((req, res) => {
	return cors(req, res, () => {
		if (req.method !== 'POST') {
			return res.status(500).json({ message: 'Not allowed.' });
		}

		if (
			!req.headers.authorization ||
			!req.headers.authorization.startsWith('Bearer ')
		) {
			return res.status(401).json({ error: 'Unauthorized!' });
		}

		let idToken;
		idToken = req.headers.authorization.split('Bearer ')[1];

		const busboy = new Busboy({ headers: req.headers });
		let uploadData;
		let oldImagePath;

		busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
			const filePath = path.join(os.tmpdir(), filename);
			uploadData = { filePath: filePath, type: mimetype, name: filename };
			file.pipe(fs.createWriteStream(filePath));
		});

		busboy.on('field', (fieldname, value) => {
			oldImagePath = decodeURIComponent(value);
		});

		busboy.on('finish', () => {
			const id = uuid();
			let imagePath = 'images/' + id + '-' + uploadData.name;
			if (oldImagePath) {
				imagePath = oldImagePath;
			}

			return fbAdmin
				.auth()
				.verifyIdToken(idToken)
				.then((decodedToken) => {
					console.log(uploadData.type);
					return storage
						.bucket(environment.projectId+'.appspot.com')
						.upload(uploadData.filePath, {
							uploadType: 'media',
							destination: imagePath,
							metadata: {
								metadata: {
									contentType: uploadData.type,
									firebaseStorageDownloadTokens: id,
								},
							},
						});
				})
				.then(() => {
					return res.status(201).json({
						imageUrl:
							'https://storage.googleapis.com/v1/b/' +
							storage.bucket(environment.projectId+'.appspot.com').name +
							'/o/' +
							encodeURIComponent(imagePath) +
							'?alt=media&token=' +
							id,
						imagePath: imagePath,
					});
				})
				.catch((error) => {
					console.log(error);
					return res.status(401).json({ error: 'Unauthorized!' });
				});
		});
		return busboy.end(req.rawBody);
	});
});
