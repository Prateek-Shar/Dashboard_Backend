import Session from "../DB/schema/session.js";


const getSessionInfo = async(req , res , next) => {
    
    const session_id = req.cookies.SessionID;

    if (!session_id) {
        console.log("❌ SessionID NOT FOUND in cookies");
        return res.status(401).json({message : "Un-authorized access , No Session in Cookies"})
    }

    const session_exists = await Session.findOne({"SessionID" : session_id})

    if (!session_exists) {
        console.log("❌ SessionID exists in cookie but NOT in DB");
        return res.status(401).json({message : "No Session Exists in DB"})
    }

    // console.log(session_exists.SessionID)

    req.sessionInfo = session_exists.SessionID
    next()
}

export default getSessionInfo;