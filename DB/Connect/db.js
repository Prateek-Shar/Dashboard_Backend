import mongoose from "mongoose"
import dotenv from "dotenv"

// For Local Deployemnt
// dotenv.config()
// const uri = process.env.MONGO_URI

const Connect = async () => {
    try {
        await mongoose.connect(MONGO_URI)
        console.log("DB Connected Successfully")
    }

    catch(error) {
        console.log("Error Msg : " , error)
    }
}

export default Connect;