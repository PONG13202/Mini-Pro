const { PrismaClient } = require('@prisma/client');
const express = require('express');
const app = express.Router();
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const fileUpload =require('express-fileupload');
const { error } = require('console');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);
const axios = require('axios');

dotenv.config();
app.use(cors());
app.use(express.json());
app.use(fileUpload());

app.post('/ProfileUpload', async (req, res) => {
    try {
       
        if (!req.files || !req.files.myFile) {
            return res.status(400).send({ error: 'No file uploaded' });
        }

        const { userId } = req.body;
        if (!userId) {
            return res.status(400).send({ error: 'No userId provided' });
        }

        const myFile = req.files.myFile;

        const fileBase64 = myFile.data.toString('base64');

        const updatedUser = await prisma.user.update({
            where: { Id: parseInt(userId) },  
            data: {
                Profile_Image: fileBase64
            }
        });

        res.send({ message: 'Profile image uploaded and saved to database', user: updatedUser });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});


function checkSignIn(req, res, next) {
    const secret = process.env.TOKEN_SECRET;
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).send({ message: 'No token provided' });
    }

    try {
        const result = jwt.verify(token, secret);
        req.userId = result.id; 
        next();
    } catch (e) {
        res.status(401).send({ error: 'Unauthorized' });
    }
}
function checkAdmin(req, res, next) {
    const userId = req.userId;

    // Get user status from the database
    prisma.user.findUnique({
        where: { Id: userId },
        select: { Status: true }
    })
    .then(user => {
        if (user && user.Status === 'admin') {
            next(); // User is admin, proceed
        } else {
            return res.status(403).send({ message: 'Forbidden: Admins only' });
        }
    })
    .catch(err => {
        res.status(500).send({ error: err.message });
    });
}
app.post('/googleSignIn', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,
        });
        const payload = ticket.getPayload();

        console.log('Token payload:', payload);

        const userData = {
            User_Name: payload.email.split('@')[0], // Using the email prefix as a username
            First_Name: payload.given_name,
            Last_Name: payload.family_name,
            Email: payload.email,
            Profile_Image: payload.picture // Use the correct property to access the image URL
        };

        let user = await prisma.user.findFirst({
            where: { Email: userData.Email },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    User_Name: userData.User_Name,
                    First_Name: userData.First_Name,
                    Last_Name: userData.Last_Name,
                    Email: userData.Email,
                    Profile_Image: userData.Profile_Image, 
                    Status: 'user', 
                },
            });
        }

        // Generate a JWT token
        const jwtToken = jwt.sign({ id: user.Id }, process.env.TOKEN_SECRET, { expiresIn: '1d' });

        return res.json({ token: jwtToken });
    } catch (error) {
        console.error('Error during Google Sign-In:', error.message);
        return res.status(500).send({ error: 'Authentication failed', details: error.message });
    }
});

app.post('/signIn', async (req, res) => {
    try {
        const { user: User_Name, pass: Password } = req.body;

        if (!User_Name || !Password) {
            return res.status(401).send({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findFirst({
            select: {
                Id: true,
                User_Name: true,
                Password: true,
                Status: true
            },
            where: {
                User_Name: User_Name
            }
        });

        if (user && user.Password === Password && user.Status === 'admin') {
            const secret = process.env.TOKEN_SECRET;
            const token = jwt.sign({ id: user.Id }, secret, { expiresIn: '5d' });

            return res.send({ token });
        }

        res.status(401).send({ message: 'Unauthorized' });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});
app.post('/signInHomepage', async (req, res) => {
    try {
        const { user: User_Name, pass: Password } = req.body;

        if (!User_Name || !Password) {
            return res.status(401).send({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findFirst({
            select: {
                Id: true,
                User_Name: true,
                Password: true,
                Status: true
            },
            where: {
                User_Name: User_Name
            }
        });

        if (user && user.Password === Password) {
            const secret = process.env.TOKEN_SECRET;
            const token = jwt.sign({ id: user.Id }, secret, { expiresIn: '5d' });

            return res.send({ token });
        }

        res.status(401).send({ message: 'Unauthorized' });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});


app.get('/infoHomepage', checkSignIn, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({
            select: {
                Id: true,
                User_Name: true,
                First_Name: true,
                Last_Name: true,
                Profile_Image: true,
                Email: true,
                Status: true
            },
            where: {
                Id: userId
            }
        });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        // No admin check here; accessible to both 'user' and 'admin'
        res.send({ result: user });
    } catch (e) {
        console.error(e); // Log the error for debugging
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.get('/info', checkSignIn, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({
            select: {
                Id: true,
                User_Name: true,
                First_Name: true,
                Last_Name: true,
                Profile_Image: true,
                Email: true,
                Status: true
            },
            where: {
                Id: userId
            }
        });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        if (user.Status !== 'admin') {
            return res.status(403).send({ message: 'Access denied: admin only' });
        }

        res.send({ result: user });
    } catch (e) {
        console.error(e); // Log the error for debugging
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.get('/all', async (req, res) => { 
    try {
       
        const users = await prisma.user.findMany({
            select: {
                Id: true,
                User_Name: true,
                First_Name: true,
                Last_Name: true,
                Profile_Image: true,
                Email: true,
                Status: true
            }
        });

        if (users.length === 0) {
            return res.status(404).send({ message: 'No users found' });
        }

       
        res.send({ result: users });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});
app.put('/update', async (req, res) => {
    const { userId, newStatus } = req.body; 

    const validStatuses = ['user', 'admin']; 
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const user = await prisma.user.update({
            where: { Id: parseInt(userId) },
            data: { Status: newStatus },
        });
        res.json({ result: user }); 
    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: error.message }); 
    }
});

app.post('/register', async (req, res) => {
    try {
        const data = req.body;

      
        if (!data.User_Name || !data.Password || !data.First_Name || !data.Last_Name) {
            return res.status(400).send({ message: 'All fields are required' });
        }

        
        if (data.Password.length < 8) {
            return res.status(400).send({ message: 'Password must be at least 8 characters long' });
        }

    
        const existingUser = await prisma.user.findFirst({
            where: {
                User_Name: data.User_Name
            }
        });

        if (existingUser) {
            return res.status(400).send({ message: 'User already exists' });
        }

        const newUser = await prisma.user.create({
            data: {
                User_Name: data.User_Name,
                Password: data.Password, 
                First_Name: data.First_Name,
                Last_Name: data.Last_Name,
                Status: 'user'
            }
        });

    
        res.send({ result: newUser });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

module.exports = app;
