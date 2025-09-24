import mongoose from "mongoose"

const MONGO_URI = process.env.MONGO_URI

const Connect = async () => {

    await mongoose.connect(MONGO_URI)
    .then(() => console.log("DB connected successfully"))
    .catch(() => console.error("Somethign broke while connecting to db"))

}

export default Connect;