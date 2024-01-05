const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://kunalbiza:PzZWg52Muo6B9jTQ@cluster0.ga7ggug.mongodb.net/ftle?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

// Define User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

// Define Table Data Schema
const tableDataSchema = new mongoose.Schema({
    username: String,
    data: [
    ],
});

const User = mongoose.model('User', userSchema);
const TableData = mongoose.model('TableData', tableDataSchema);

// Middleware to check if the request has a valid token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, 'your-secret-key'); // Change this secret key
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// User Registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        const defaultData = [

            {
                "2019": 4,
                "2020": 5,
                "2021": 3,
                "2022": 10,
                "2023": 3,
                "Country": "Country 1",
                "Gender": "Male",
                "AgeGroup": "Age 20-40"
            },
            {
                "2019": 6,
                "2020": 2,
                "2021": 8,
                "2022": 4,
                "2023": 5,
                "Country": "Country 1",
                "Gender": "Male",
                "AgeGroup": "Age 40-60"
            },
            {
                "2019": 6,
                "2020": 6,
                "2021": 1,
                "2022": 5,
                "2023": 10,
                "Country": "Country 1",
                "Gender": "Male",
                "AgeGroup": "Age 60-80"
            },
            {
                "2019": 10,
                "2020": 2,
                "2021": 6,
                "2022": 4,
                "2023": 10,
                "Country": "Country 1",
                "Gender": "Female",
                "AgeGroup": "Age 20-40"
            },
            {
                "2019": 0,
                "2020": 6,
                "2021": 2,
                "2022": 3,
                "2023": 1,
                "Country": "Country 1",
                "Gender": "Female",
                "AgeGroup": "Age 40-60"
            },
            {
                "2019": 7,
                "2020": 9,
                "2021": 6,
                "2022": 9,
                "2023": 2,
                "Country": "Country 1",
                "Gender": "Female",
                "AgeGroup": "Age 60-80"
            },
            {
                "2019": 10,
                "2020": 0,
                "2021": 1,
                "2022": 9,
                "2023": 7,
                "Country": "Country 2",
                "Gender": "Male",
                "AgeGroup": "Age 20-40"
            },
            {
                "2019": 8,
                "2020": 0,
                "2021": 5,
                "2022": 10,
                "2023": 0,
                "Country": "Country 2",
                "Gender": "Male",
                "AgeGroup": "Age 40-60"
            },
            {
                "2019": 3,
                "2020": 1,
                "2021": 10,
                "2022": 1,
                "2023": 4,
                "Country": "Country 2",
                "Gender": "Male",
                "AgeGroup": "Age 60-80"
            },
            {
                "2019": 9,
                "2020": 3,
                "2021": 6,
                "2022": 4,
                "2023": 0,
                "Country": "Country 2",
                "Gender": "Female",
                "AgeGroup": "Age 20-40"
            },
            {
                "2019": 8,
                "2020": 5,
                "2021": 1,
                "2022": 3,
                "2023": 8,
                "Country": "Country 2",
                "Gender": "Female",
                "AgeGroup": "Age 40-60"
            },
            {
                "2019": 8,
                "2020": 4,
                "2021": 5,
                "2022": 6,
                "2023": 7,
                "Country": "Country 2",
                "Gender": "Female",
                "AgeGroup": "Age 60-80"
            }

        ];

        const newTableData = new TableData({ username, data: defaultData });
        await newTableData.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// User Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ user: { id: user._id, username: user.username } }, 'your-secret-key', { expiresIn: '1h' }); // Change this secret key
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Save Data for a User
app.post('/save-data', verifyToken, async (req, res) => {
    const { data } = req.body;
    const username = req.user.username;

    try {
        // Find the document by username
        let tableData = await TableData.findOne({ username });

        if (!tableData) {
            // If user data doesn't exist, create a new document
           // console.log('Creating new document');
            tableData = new TableData({ username, data });
        } else {
            // Replace the entire 'data' field with the new data
           // console.log('Replacing entire data field');
            tableData.data = data;
        }

        // Save the document
        await tableData.save();

       // console.log('Data saved successfully');
        res.json({ message: 'Data saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Get Data for a User
app.get('/get-data', verifyToken, async (req, res) => {
    const username = req.user.username;

    try {
        const tableData = await TableData.findOne({ username });
        if (!tableData) return res.status(404).json({ message: 'Data not found for the user' });
        res.json({ data: tableData.data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
