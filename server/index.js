import express from 'express' // Importa el módulo 'express', que es un framework para construir aplicaciones web en Node.js.
import logger from 'morgan' // Importa 'morgan', un middleware para registrar solicitudes HTTP en la consola.

import { Server } from 'socket.io'; // Importa la clase 'Server' de 'socket.io', que se utiliza para crear un servidor WebSocket.
import { createServer } from 'node:http' // Importa la función 'createServer' del módulo 'http' de Node.js para crear un servidor HTTP.

const port = process.env.PORT ?? 3000; // Define el puerto en el que el servidor escuchará. Usa el puerto definido en la variable de entorno 'PORT' o 3000 por defecto.

const app = express(); // Crea una instancia de la aplicación Express.
const server = createServer(app); // Crea un servidor HTTP utilizando la aplicación Express.
const io = new Server(server); // Crea una instancia de 'Server' de 'socket.io', pasándole el servidor HTTP.

io.on('connection', (socket) => { // Escucha el evento 'connection', que se emite cuando un cliente se conecta al servidor WebSocket.
    console.log('a user has connected'); // Imprime un mensaje en la consola cuando un usuario se conecta.

    socket.on('disconnect', () => { // Escucha el evento 'disconnect', que se emite cuando un cliente se desconecta del servidor.
        console.log('a user has disconnected');
    })

    socket.on('chat message', (msg) => {    // Escucha el evento 'chat message', que se emite cuando un cliente envía un mensaje de chat.
        io.emit('chat message', msg);  // Emite el mensaje de chat a todos los clientes conectados.
    })
}); // Cierra el bloque de la función de conexión.


// Usa morgan como middleware
app.use(logger('dev')); // Configura 'morgan' como middleware para registrar las solicitudes HTTP en formato 'dev'.

app.get('/', (req, res) =>{ // Define una ruta GET para la raíz ('/') de la aplicación.
    // res.send('<h1>Esto es el chat</h1>') // Comentario: esta línea enviaría un mensaje HTML si se descomenta.
    res.sendFile(process.cwd() + '/client/index.html') // Envía el archivo 'index.html' ubicado en la carpeta 'client' como respuesta.
}) // Cierra el bloque de la ruta GET.

server.listen(port, () => { // Inicia el servidor HTTP y lo hace escuchar en el puerto definido.
    console.log(`Server running on port ${port}`); // Imprime un mensaje en la consola indicando que el servidor está en funcionamiento.
    
}) // Cierra el bloque de la función de escucha del servidor.                                       