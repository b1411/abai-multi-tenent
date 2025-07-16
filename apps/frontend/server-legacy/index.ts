import app from './main';
import dotenv from 'dotenv';

dotenv.config();

app.listen(+process.env.BACKEND_PORT!, process.env.BACKEND_HOSTNAME!, () => {
    console.log(`Server is running on port ${process.env.BACKEND_PORT} and hostname ${process.env.BACKEND_HOSTNAME}`);
});