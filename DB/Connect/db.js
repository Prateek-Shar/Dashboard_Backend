import mongoose from "mongoose"

const uri = "mongodb+srv://Prateek:OlRw9NVC1zG4rNOa@clusterone.jxcodtj.mongodb.net/Dashboard?retryWrites=true&w=majority&appName=ClusterOne";

const Connect = async () => {
    try {
        await mongoose.connect(uri)
        console.log("DB connected successfully")
    }

    catch(error) {
        console.log("Error" , error);
    }
}

export default Connect;