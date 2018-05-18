$(document).ready( function() {

    let namespace = '/poll';

    // Connect to the Socket.IO server.
    // The connection URL has the following format:
    //     http[s]://<domain>:<port>[/<namespace>]
    let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);

    // Event handler for new connections.
    // The callback function is invoked when a connection with the
    // server is established.
    socket.on('connect', function() {
        socket.emit('client_connect', {data: 'Client connected!'});
    });

    // Event handler for server sent data.
    // The callback function is invoked whenever the server emits data
    // to the client.
    socket.on('new_result', function(data) {
        console.log(data);
        
        if (data.val) {
          let tag = "#response-" + String(data.response_id) + "-val";

          console.log(tag);

          $(tag).html(String(data.val));
        } else {
          let id = "response-" + String(data.response_id);

          console.log(id);

          $('#results').append($('<span id="' + id + '">' + data.response + '</span><br>'));

        }

    });

    function subscribeNewResult(cb, id) {
      socket.on('new_result_' + id, function(data) {
        console.log(data);
        cb(null, data);
      socket.emit('subscribeNewResult', 1000);
    }

  });