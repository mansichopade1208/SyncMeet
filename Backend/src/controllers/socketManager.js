import { Server } from "socket.io";

let connections = {} //object for users connected
let messages = {}
let timeOnline = {}

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: { //* this is only for develepment phase not required for production phase
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => { //connection is made

        socket.on("join-call", (path) => { //*event -> join-call, path -> room user wants to join(path is a variable storing room name/id)
            if (connections[path] === undefined) {
                connections[path] = []
                //first user joins -> create empty array for that path
                // in connections obj - room->key & arr containing socketIds->value
                //! path = "room123"; connections[path] = [] -> connections["room123"] = []; connections["room123"].push(socket.id);
            }
            connections[path].push(socket.id) //arr.push(val)

            timeOnline[socket.id] = new Date();

            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path])
            } //this is sending message to all users that new user joined 

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; a++) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender']
                    )
                }
            } //if some previous msg exist in chat they are send to new user
        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message)
        })

        socket.on("chat-message", (data, sender) => {

            const [matchingRoom, found] = Object.entries(connections) //when a sender sends a chat here we are finding the room in which he belongs
                .reduce(([room, isFound], [roomKey, roomValue]) => { // here [room, isFound] = ['', false] at first -> tracks value from previous iteration 
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }

                    return [room, isFound];
                }, ['', false]); // ['', false] -> this is the initial value i.e. room not found

                //If you do:
                // Object.entries(connections) -> you get:
                // [
                //     ["abc123", ["AAA", "BBB"]],
                //     ["xyz789", ["CCC", "DDD"]]
                // ]

            if(found === true){
                if(messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({"sender": sender, "data": data, "socket-id-sender": socket.id}) 
                //push msg data and sender into messages object for matchingRoom
                console.log("message", Key, ":", sender, data)

                connections[matchingRoom].forEach(elem => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                }); //send msg to each socket in room
            }
        })

        socket.on("disconnect", () => {
            var diffTime = Math.abs(timeOnline[socket.id] - new Date())
        
            var key //for the room user is in
        
            for(const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))){
                // [
                //     ["roomA", ["AAA", "BBB"]], k-> room ; v-> ["AAA", "BBB"]
                //     ["roomB", ["CCC", "DDD"]]
                // ]
                for(let a=0; a<v.length; a++){ 
                    if(v[a] === socket.id){
                        key = k;

                        for(let i=0; i<connections[key].length; i++){
                            io.to(connections[key][i]).emit("user-left", socket.id)
                        }

                        var index = connections[key].indexOf(socket.id)

                        connections[key].splice(index, 1) //remove user form connections 

                        if(connections[key].length === 0){
                            delete connections[key]
                        }
                    }
                }
            }
        })
    })

    return io;
}

