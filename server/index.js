import express from 'express'
import logger from 'morgan'

const port = process.env.PORT ?? 3000;

const app = express();

// Usa morgan como middleware
app.use(logger('dev')); // 'dev' es un formato de registro predefinido

app.get('/', (req, res) =>{
    // res.send('<h1>Esto es el chat</h1>')
    res.sendFile(process.cwd() + '/client/index.html')
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    
})