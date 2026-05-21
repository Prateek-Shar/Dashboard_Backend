import { createClient } from "redis"
import dotenv from "dotenv"

dotenv.config()

const pass = process.env.REDIS_URI

// To connect to Redis cloud
export const client = createClient({
    username: 'default',
    password: pass,
    socket: {
        host: 'redis-10151.c84.us-east-1-2.ec2.cloud.redislabs.com',
        port: 10151
    }
});


// To connect locally
// export const client = createClient({
//     url : "redis://127.0.0.1:6379"
// })

const redis_connect = async() => {

    try {
        await client.connect()

        if(client.isOpen) {
            console.log("Redis DB connected successfully")
        }
    }

    catch(error) {
        console.log("Error connecting to redis db : " , error)
    }
    
}



export default redis_connect