const express = require('express');
const cors = require('cors');
const http = require('http');
const bodyPraser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(bodyPraser.json());
const server = http.createServer(app);


app.use(cors());
app.use(express.json());

JWT_SECRET = '12345'

const pool = new Pool({ 
    user: 'postgres',
    host: 'localhost',
    database: 'codefortomorrow',
    password: '12345',
    port: 5432,
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token ==  null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if(err) {
            return res.sendStatus(403);
        }
        res.user = user;
        next();
    });
}

app.post('/api/auth/signup', async(req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if(existingUser.rows.length>0){
            return res.status(400).json({ error: 'User already exists'});
        }

        const newUser = await pool.query('INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *', [email, password]);
        const accessToken = jwt.sign({ email: email }, JWT_SECRET, {expiresIn: '1h'});
        res.json({ accessToken: accessToken });
        
    } catch (error) {
        console.error('Error authenticating user', error);
        res.status(500).json({ error: 'Internal Server Error'});
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password} = req.body;
        const user = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);

        if(user.rows.length === 0) {
            return res.sendStatus(401).json({ error: 'Unauthorized'});
        }

        const accessToken = jwt.sign({ email: email }, JWT_SECRET, {expiresIn: '1h'});
        res.json({ message: "Login Successful" });
    } catch (error) {
        console.error('Error authenticating user', error);
        res.status(500).json({ error: 'Internal Server Error'});
    }
});

app.post('/api/category', authenticateToken, async (req, res) => {
    try {

        res.json({ message: "Hello" });
        const { category_name } = req.body;
        res.json({ message: category_name })
        const result = await pool.query('INSERT INTO categories (category_name) VALUES ($1) RETURNING *', [category_name]);
        res.json({ message: " Successfull added "});
    } catch (error) {
        console.error('Cannot add category', error);
        res.status(500).json({ error: 'Internal Server Error'});
    }
});

app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories');
        res.json(result.rows);
    } catch (error) {
        console.error('Cannot get categories', error);
        res.status(500).json({ error: "Internal Server Error"});
    }
});

app.put('/api/category/:categoryId', authenticateToken, async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const { category_name } = req.body;
        const result = await pool.query('UPDATE categories SET category_name = $1 WHERE id = $2 RETURNING *' [category_name, categoryId]);
        if(result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('error updating category', error)
        res.status(500).json({ error: 'Internal server error'});
    }
});

app.delete('/api/category/:categoryId', authenticateToken, async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const { category_name } = req.body;
        const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING*', [categoryId]);
        if(result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found'});
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category', error)
        res.status(500).json({ error: "Internal Server Error"});
    }
});

app.post('/api/category/:categoryid/service', authenticateToken, async (req, res) => {
    try {
        const { category_id, service_name, type, price } = req.body;
        const categoryId = req.params.categoryId;
        const result = await pool.query('INSERT INTO services (category_id, service_name, type, price) VALUES ($1, $2, $3, $4) RETURNING *', [categoryId, service_name, type, price]);
        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error adding service', error);
        res.status(500).json({ error : 'Internal Serivce error'});
    }
});

app.get('/api/category/:categoryId/services', authenticateToken, async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const result = await pool.query('SELECT * FROM services WHERE category_id = $1', [categoryId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting services', error);
        res.status(500).json({ error: 'Internal Server Error'});
    }
});

app.delete('/api/category/:categoryId/service/:serviceId', authenticateToken, async (req, res) => {
    try {
        const { categoryId,serviceId } =req.params;
        const result = await pool.query('DELETE FROM services WHERE category_id = $1 AND id = $2 RETURNING *', [categoryId, serviceId]);
        if(result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found'});           
            
        }

        res.json({ message: 'Service deleted successfully'});
    } catch (error) {
        console.error('Error using service', error);
        res.status(500).json({ error: 'Internal server Error'})
    }
});

app.put('/api/category/:categoryId/service/:serviceId', authenticateToken, async (req, res) => {
    try {
        const { categoryId, serviceId } = req.params;
        const { service_name, type, price } = req.body;
        const result = await pool.query('UPDATE services SET service_name = $1, type = $2, price = $3 WHERE category_id = $4 AND id = $5 RETURNING *', [service_name, type, price, categoryId, serviceId]);
        if(result.rows.length === 0) {
            return res.status(404).json({ error: 'Services not found'});
        }
        res.json({ message: 'Update successful'});
    } catch (error) {
        console.error('Error using service', error);
        res.status(500).json({ error: 'Internal Server Error'})
    }
});







const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is Working on PORT ${PORT}`)
});

