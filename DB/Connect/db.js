import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const uri = process.env.MONGO_URI

const Connect = async () => {
    try {
        await mongoose.connect(uri)
        console.log("DB Connected Successfully")
    }

    catch(error) {
        console.log("Error Msg : " , error)
    }
}

export default Connect;