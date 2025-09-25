import mongoose from "mongoose"
import dotnet from "dotenv"

dotnet.config()

const uri = process.env.MONGO_URI

const Connect = async () => {

    await mongoose.connect(uri)
    .then(() => console.log("DB connected successfully"))
    .catch(() => console.error("Something broke while connecting to db"))

}

export default Connect;