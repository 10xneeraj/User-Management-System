require('dotenv').config();
const { faker } = require('@faker-js/faker');
const mysql = require('mysql2');
const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
});

let getRandomUser = () => {
    return [
        faker.string.uuid(),
        faker.internet.username(),
        faker.internet.email(),
        faker.internet.password()
    ];
};

// Home route
app.get("/", (req, res) => {
    let q = 'SELECT count(*) as count FROM users';
    
    connection.query(q, (err, result) => {
        if (err) {
            console.error(err);
            res.send('Database error');
            return;
        }
        res.render('home', { count: result[0].count });
    });
});

// Show all users
app.get("/users", (req, res) => {
    let q = 'SELECT * FROM users';
    
    connection.query(q, (err, result) => {
        if (err) {
            console.error(err);
            res.send('Database error');
            return;
        }
        res.render('show-users', { users: result });
    });
});

// Edit user form
app.get("/users/:id/edit", (req, res) => {
    let { id } = req.params;
    let q = 'SELECT * FROM users WHERE id = ?';
    
    connection.query(q, [id], (err, result) => {
        if (err) {
            console.error(err);
            res.send('Database error');
            return;
        }
        if (result.length === 0) {
            res.send('User not found');
            return;
        }
        res.render('edit', { user: result[0] });
    });
});

// Update user
app.patch("/users/:id", (req, res) => {
    let { id } = req.params;
    let { username: newUsername, password: formPass } = req.body;
    
    // Step 1: Get current user to verify password
    let selectQ = 'SELECT * FROM users WHERE id = ?';
    
    connection.query(selectQ, [id], (err, result) => {
        if (err) {
            console.error(err);
            res.send('Database error');
            return;
        }
        
        if (result.length === 0) {
            res.send('User not found');
            return;
        }
        
        let user = result[0];
        
        // Step 2: Check if password matches
        if (formPass !== user.password) {
            res.send('Incorrect password');
            return;
        }
        
        // Step 3: Update username
        let updateQ = 'UPDATE users SET username = ? WHERE id = ?';
        connection.query(updateQ, [newUsername, id], (err, result) => {
            if (err) {
                console.error(err);
                res.send('Database error');
                return;
            }
            res.redirect('/users');
        });
    });
});

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});