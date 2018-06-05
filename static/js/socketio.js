    const namespace = '/poll';

    // Connect to the Socket.IO server.
    // The connection URL has the following format:
    //     http[s]://<domain>:<port>[/<namespace>]
    const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);

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

    const onResponseCreation = (cb) => {
      socket.on('response_creation', function(data) {
        console.log('received', data);
        cb(null, data);
      });
    }

    const onResponseUpdate = (cb) => {
      socket.on('response_update', function(data) {
        console.log('received', data);
        cb(null, data);
      });
    }

    const onResponseDeletion = (cb) => {
      socket.on('response_deletion', function(data) {
        console.log('received', data);
        cb(null, data);
      });
    }

    const onNewOrder = (cb) => {
      socket.on('new_response_order', function(data){ 
        console.log('received', data);
        cb(null, data);
      }); 
    }
