var stompClient = null;
var punto = null;

function connect() {
    var socket = new SockJS('/stompendpoint');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);
        stompClient.subscribe('/topic/newpoint', function (data) {
            var theObject=JSON.parse(data.body);
            alert(theObject.x+" "+ theObject.y);
        });
    });
}

function sendPoint(x,y){
    punto = {x:x.value,y:y.value};
    stompClient.send("/topic/newpoint", {}, JSON.stringify(punto));
}

function disconnect() {
    if (stompClient != null) {
        stompClient.disconnect();
    }
    setConnected(false);
    console.log("Disconnected");
}


$(document).ready(
        function () {
            connect();
            console.info('connecting to websockets');

        }
);
