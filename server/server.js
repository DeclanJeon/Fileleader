const express = require("express");
const { Server } = require("socket.io");
const app = express();
const path = require("path");
const Logger = require("./Logger");
const log = new Logger("server");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("ABCDEF1234567890", 12);
const roomID = nanoid();

let io, server, host;
let channels = {}; // collect channels
let sockets = {}; // collect sockets
let peers = {}; // collect peers info grp by channels

let textFile = "textFile";
let videoFile = "videoFile";
let audioFile = "audioFile";
let pdfFile = "pdfFile";
let imageFile = "imageFile";
let csvFile = "csvFile";

server = require("http").createServer(app);
io = new Server({
    pingTimeout: 100000,
    upgradeTimeout: 200000,
}).listen(server);

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../views")));
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.redirect(`${roomID}`);
});

app.get("/:room", (req, res) => {
    res.render("index", { roomId: req.params.room });
});

io.on("connection", (socket) => {
    socket.channels = {};
    sockets[socket.id] = socket;

    socket.on("connect", (socket) => {
        log.debug("[" + socket.id + "] connection accepted");

        socket.on("disconnect", (reason) => {
            log.debug("[" + socket.id + "] disconnected", { reason: reason });
            delete sockets[socket.id];
        });
    });

    socket.on("join", (config) => {
        log.debug("[" + socket.id + "] join ", config);

        let channel = config.channel;
        let peer_name = config.peerId;

        if (channel in socket.channels) {
            log.debug("[" + socket.id + "] [Warning] already joined", channel);
            return;
        }

        // no channel aka room in channels init
        if (!(channel in channels)) channels[channel] = {};

        // no channel aka room in peers init
        if (!(channel in peers)) peers[channel] = {};

        // room locked by the participants can't join
        if (peers[channel]["Locked"] === true) {
            log.debug("[" + socket.id + "] [Warning] Room Is Locked", channel);
            socket.emit("roomIsLocked");
            return;
        }

        // collect peers info grp by channels
        peers[channel][socket.id] = {
            peer_name: peer_name,
        };
        log.debug("connected peers grp by roomId", peers);

        channels[channel][socket.id] = socket;
        socket.channels[channel] = channel;

        socket.join(channel);
    });

    socket.on(textFile, (channel, data) => {
        socket.broadcast.to(channel).emit(`send-${textFile}`, data);
    });
});

server.listen(PORT, () => {
    log.debug(`Server Listener....${PORT}`);
});
