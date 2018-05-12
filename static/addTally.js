  "use strict";

  let tallys = {};

  function addTally(evt) {
  // use for multiple tallys per button button 
    let button = $('#' + evt.target.id);
    console.log(button);
    let response_key = button.val();

    if (tallys[response_key]) {
        tallys[response_key] += 1;
      }  else {
        tallys[response_key] = 1;
      }

    $('#tallys').attr("value", JSON.stringify(tallys));
  }

  function changeTally(evt) {
  // use for select-all polls  
    let button = $('#' + evt.target.id);
    console.log(button);
    let response_key = button.val();

    // TODO: consider changing tally to t/f boolean, look into jquery toggle class
    if (button.hasClass('selected')) {
      delete tallys[response_key];
      button.removeClass('selected');
    }  else {
      tallys[response_key] = 'True';
      button.addClass('selected');
    }

    console.log(tallys);
    console.log(JSON.stringify(tallys));
    $('#tallys').attr("value", JSON.stringify(tallys));
  }

  function selectTally(evt) {
  // use for multiple choice polls

  // TODO: only send property to server that has tally
    
    let button = $('#' + evt.target.id);
    console.log(button);
    let response_key = button.val();

    if (button.hasClass('selected')) {
      delete tallys[response_key];
      button.removeClass('selected');
    
    }  else {
      tallys[response_key] = 'True';

      let selected_button = $('.selected');
      console.log(selected_button);

      if (selected_button.length !== 0) {
        let sid = selected_button.val();
        delete tallys[sid];
        selected_button.removeClass('selected');
      }

      button.addClass('selected');
    }

    console.log(tallys);
    $('#tallys').attr("value", JSON.stringify(tallys));
  }