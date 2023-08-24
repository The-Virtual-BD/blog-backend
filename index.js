const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 5000;

// hamidvirtualbd
// L7Qp4SqUZh3sZtNI

//Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Multer configuration
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./uploads");
	},
	filename: function (req, file, cb) {
		const fileName = `${new Date().getTime()}_${file.originalname}`;
		const normalizedFileName = fileName.replace("\\", "/");
		cb(null, normalizedFileName);
	},
});

const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

//Connect DB URI
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

async function run() {
	try {
		await client.connect();
		console.log("DB Connected");

		//DB Collections
		const articalesCollection = client.db("blogSite").collection("articale");



		/*----------------------------
			 Articale Collection
		------------------------------*/

		app.post("/articale/create", upload.single("artiImg"), async (req, res) => {
			const title = req.body.title;
			const date = req.body.date;
			const proCategory = req.body.proCategory;
			const link = req.body.link;
			const authors = req.body.authors;
			const desc = req.body.desc;
			const articaleType = req.body.articaleType;
			const artiImg = req.file.path.replace(/\\/g, "/");
			createdAt = new Date()

			const newProject = { title, date, proCategory, link, authors, desc, artiImg, articaleType, createdAt };

			const newData = await articalesCollection.insertOne(newProject);
			res.send({ Message: "Articale Added Successfully", newData });
		});

		app.get("/articale/all", async (req, res) => {
			const data = await articalesCollection.find({}).toArray();
			res.send({ Message: "Success!", data: data });
		});

		app.get("/articale/:id", async (req, res) => {
			const id = req.params.id;
			// console.log(id);
			const data = await articalesCollection.findOne({
				_id: new ObjectId(id),
			});
			res.send(data);
		});

		app.delete("/articale/:id", async (req, res) => {
			const id = req.params.id;

			const projectData = await articalesCollection.findOne({
				_id: new ObjectId(id),
			});
			if (!projectData) {
				return res.status(404).send({ Message: "Project not found" });
			}

			// Delete the project data from the database
			const deleteData = await articalesCollection.deleteOne({
				_id: new ObjectId(id),
			});
			// Now, delete the associated image file from the "uploads" directory
			const imagePath = projectData.artiImg;
			try {
				fs.unlinkSync(imagePath); // This will delete the file synchronously
				console.log("Image deleted successfully");
			} catch (err) {
				console.error("Error deleting image:", err);
			}

			res.send({ Message: "Project deleted", deleteData });
		});

		app.put("/articale/:id", upload.single("artiImg"), async (req, res) => {
			const id = req.params.id;
			const project = req.body;
			// console.log(project);

			// Check if a new image is provided in the request
			if (req.file) {
				// Process the new image and store it
				const projImgPath = req.file.path;

				// Delete the old image if it exists
				if (project.artiImg) {
					try {
						fs.unlinkSync(project.artiImg);
						console.log("Old image deleted:", project.artiImg);
					} catch (error) {
						console.log("Error deleting old image:", error);
					}
				}

				project.artiImg = projImgPath;
			}

			const filter = { _id: new ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: project,
			};
			const result = await articalesCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			res.send({ result, project });
		});

	} finally {
	}
}

run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("Hello From Blog Site!");
});

app.listen(port, () => {
	console.log(`Blog Site listening on port ${port}`);
});
