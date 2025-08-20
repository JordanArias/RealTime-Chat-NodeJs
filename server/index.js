import express from 'express' // Importa el módulo 'express', que es un framework para construir aplicaciones web en Node.js.
import logger from 'morgan' // Importa 'morgan', un middleware para registrar solicitudes HTTP en la consola.

import dotenv from 'dotenv' // Importa 'dotenv' para cargar variables de entorno desde un archivo .env.
import {createClient} from '@libsql/client' // Importa la función 'createClient' del cliente de base de datos libsql.

import { Server } from 'socket.io'; // Importa la clase 'Server' de 'socket.io', que se utiliza para crear un servidor WebSocket.
import { createServer } from 'node:http' // Importa la función 'createServer' del módulo 'http' de Node.js para crear un servidor HTTP.

// Define el puerto en el que el servidor escuchará. Usa el puerto definido en la variable de entorno 'PORT' o 3000 por defecto.
const port = process.env.PORT ?? 3000; 
// Crea una instancia de la aplicación Express.
const app = express(); 
// Crea un servidor HTTP utilizando la aplicación Express.
const server = createServer(app); 
// Crea una instancia de 'Server' de 'socket.io', pasándole el servidor HTTP.
const io = new Server(server); 


dotenv.config(); // Carga las variables de entorno desde el archivo .env para que estén disponibles en el proceso.

//CONEXION A LA BASE DE DATOS
// Crea un cliente de base de datos utilizando la URL y el token de autenticación proporcionados en las variables de entorno.
const db = createClient({
    url:'libsql://fast-becatron-fabrizio.aws-us-east-1.turso.io', // URL de conexión a la base de datos.
    authToken: process.env.DB_TOKEN // Token de autenticación para acceder a la base de datos.
})


// await db.execute(`DROP TABLE IF EXISTS messages;`); // Elimina la tabla si existe.

// Ejecuta una consulta SQL para crear una tabla llamada 'messages' si no existe.
// Columna 'id' que se incrementa automáticamente y es la clave primaria.
// Columna 'content' que almacena el contenido del mensaje.
await db.execute(
    `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    user TEXT 
    )`
);


io.on('connection', async (socket) => { // Escucha el evento 'connection', que se emite cuando un cliente se conecta al servidor WebSocket.
    console.log('a user has connected'); // Imprime un mensaje en la consola cuando un usuario se conecta.

    socket.on('disconnect', () => { // Escucha el evento 'disconnect', que se emite cuando un cliente se desconecta del servidor.
        console.log('a user has disconnected'); // Imprime un mensaje en la consola cuando un usuario se desconecta.
    });

    socket.on('chat message', async (msg) => { // Escucha el evento 'chat message', que se emite cuando un cliente envía un mensaje de chat.
        let result; // Declara una variable para almacenar el resultado de la consulta a la base de datos.
        const username = socket.handshake.auth.username ?? 'anonymous'
        try {
            result = await db.execute({ // Intenta ejecutar una consulta SQL para insertar el mensaje en la base de datos.
                sql:`INSERT INTO messages (content, user) VALUES (:msg, :username)`, // Consulta SQL para insertar el contenido del mensaje.
                args: { msg, username } // Argumentos para la consulta, donde 'content' es el mensaje recibido.
            });
        } catch (error) { // Captura cualquier error que ocurra durante la ejecución de la consulta.
            console.log(error); // Imprime el error en la consola para facilitar la depuración.
            return; // Sale de la función si hay un error.
        }
        io.emit('chat message', msg, result.lastInsertRowid.toString(), username); // Emite el mensaje de chat a todos los clientes conectados, incluyendo el ID del mensaje insertado.
    });

    console.log('AUTH: ',socket.handshake.auth); // Imprime en la consola la información de autenticación del socket.
    
    if (!socket.recovered) { // Verifica si el socket no ha recuperado mensajes sin conexión.
        try {
            const result = await db.execute({ // Intenta ejecutar una consulta SQL para recuperar mensajes anteriores.
                sql: `SELECT id, content, user FROM messages WHERE id > ?`, // Consulta SQL para seleccionar mensajes con ID mayor que el desplazamiento del servidor.
                args: [socket.handshake.auth.serverOffset ?? 0] // Argumentos para la consulta, usando el desplazamiento del servidor o 0 si no está definido.
            });

            result.rows.forEach(row => { // Itera sobre cada fila de resultados devueltos por la consulta.
                socket.emit('chat message', row.content, row.id.toString(), row.user); // Emite cada mensaje recuperado al cliente conectado.
            });
        } catch (error) { // Captura cualquier error que ocurra durante la ejecución de la consulta.
            console.log(error); // Imprime el error en la consola para facilitar la depuración.
        }
    }
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