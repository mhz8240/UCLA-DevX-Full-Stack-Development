const express = require("express");
const bodyParser = require('body-parser');
const axios = require("axios");
const cors = require('cors');



/* INITIALIZE SERVER */
const app = express();
const route = express.Router();
const port = process.env.PORT || 4999;

app.use(cors());
app.use(bodyParser.json()); // to parse the JSON in requests 
app.use('/v1', route); // add the routes we make

app.listen(port, () => {    
  console.log(`Server listening on port ${port}`);
});

// Proxy API: Forward React requests to Flask
route.post("/api/generate-chart", async (req, res) => {
    try {
        // Forward the request to Flask (running on port 5001)
        const flaskResponse = await axios.post("http://localhost:5001/api/generate-chart", req.body, {
            responseType: "arraybuffer", // Important for image handling
        });

        // Set content type to image
        res.setHeader("Content-Type", "image/png");
        res.send(flaskResponse.data);
    } catch (error) {
        console.error("Error communicating with Flask:", error.message);
        res.status(500).json({ error: "Failed to generate chart" });
    }
});



/* ACCESS DATABASE */
async function insertUser (newUser) {
    try {
        const usersCollection = client.db(DB_NAME).collection("users");
        const result = await usersCollection.insertOne(newUser);

        return await usersCollection.findOne({ _id: result.insertedId });
    } catch (error) {
        console.error("Error inserting user into the database:", error);
        throw error;
    }
};

async function getAllUsers () {
    // get user collection and find all users
    const usersCollection = client.db(DB_NAME).collection("users");
    return await usersCollection.find().toArray();
};

async function getUser (name) {
    // get user collection and find users that match name
    const usersCollection = client.db(DB_NAME).collection("users");
    return await usersCollection.find({ name: name }).toArray();
};

/* WEEK 4: DATABASE ROUTES */
route.post('/users', async (req, res) => {
    try {
        const newUser = req.body;
        if (!newUser || Object.keys(newUser).length === 0) {
            return res.status(400).json({ error: "Invalid user data" });
        }

        const createdUser = await insertUser(newUser);
        console.log("Inserted new user:", createdUser);
        res.status(201).json(createdUser);
    } catch (error) {
        console.error("Failed to create a new user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

route.get('/users/:name?', async (req, res) => {
    try {
        const name = req.params.name;
        let users;

        if (name) {
            users = await getUser(name);
        }
        else {
            users = await getAllUsers(); // get users
        }
    
        console.log("Fetched users:", users);
        res.status(200).json(users);
    } catch (error) {
        console.error("Failed to fetch all users:", error);
        res.status(500).json({ error: message });
    }
});


/* OLD ROUTES */
// static GET
route.get('/simple-get', (req, res) => {
  res.send("here");
});

// dynamic GET (response is based on data in request)
route.get('/dynamic-get/:text', (req, res) => {
  res.send(req.params.text);
});

// external API
route.get('/pokemon/:name', async (req, res) => {
  const pokemonName = req.params.name.toLowerCase(); // we extract data from the request

  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    
    // store data from the API response
    const pokemonData = {
      name: response.data.name,
      id: response.data.id,
      height: response.data.height,
      weight: response.data.weight,
    };

    res.json(pokemonData);
  } catch (error) {
    res.status(404).send({ error: "Pokémon not found!" });
  }
});