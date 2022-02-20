let socket = io();
let roomId = ROOM_ID;

let fileSelect = document.querySelector("#fileInputControl");
let textArea = document.querySelector("#preview");
let imageArea = document.querySelector("#image-preview");
let videoArea = document.querySelector("#video-preview");
let audioArea = document.querySelector("#audio-preview");

(function () {
    socket.on("connect", handleConnect);

    socket.on("send-textFile", (data) => {
        // textArea.textContent = data;
        // imageArea.src = data;
        // audioArea.src = data;
        videoArea.src = data;
    });
})();

(function () {
    fileReaderAction();
})();

function fileReaderAction() {
    fileSelect.addEventListener("change", fileInputControlChangeEventHandler);
}

function fileInputControlChangeEventHandler(e) {
    let fileInputControl = e.target;
    let files = fileInputControl.files;
    let firstFile = files[0];
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(firstFile);

    fileReader.onload = (e) => {
        let fileContents = e.target.result;
        let videoBlob = new Blob([new Uint8Array(fileContents)]);
        let url = window.URL.createObjectURL(videoBlob);
        // textArea.textContent = fileContents;
        // imageArea.src = fileContents;
        videoArea.src = url;
        socket.emit("textFile", roomId, url);
    };

    // fileReader.readAsText(firstFile);
}

async function sendToServer(msg, config = {}) {
    await socket.emit(msg, config);
}

function handleConnect() {
    console.log("Connected to signaling server");

    let myPeerId = socket.id;
    console.log("My peer id [ " + myPeerId + " ]");
    joinToChannel();
}

function joinToChannel() {
    console.log("join to channel", roomId);
    sendToServer("join", {
        channel: roomId,
        peerId: socket.id,
    });
}
