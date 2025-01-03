import express from 'express';
import dotenv from 'dotenv';
import routeIndex from '@/routes/index.js';
import routeTest from '@/routes/test.js';
import routeMessages from '@/routes/messages.js';
import routeUsers from '@/routes/users.js';


dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use('/', routeIndex);
app.use('/test', routeTest);
app.use('/messages', routeMessages);
app.use('/users', routeUsers);

app.get('/', (req, res) => {
    res.send('Hello World!');
    });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    });

app.get('/api/data', (req, res) => {
    res.json({ message: 'Hello from the API' });
    }   );