const SessionToUserIDMap = new Map()

export const setUser = (user , id) => {   
    SessionToUserIDMap.set(id, user);
}

export const getUser = ( id ) => {
    SessionToUserIDMap.get(id)
}


