  "use strict";

  let tallys = {};

  function addTally(evt) {
  // use for multiple tallys per button button 
    let button = $('#' + evt.target.id);
    console.log(button);
    let response_id = button.val();

    if (tallys[response_id]) {
        tallys[response_id] += 1;
      }  else {
        tallys[response_id] = 1;
      }

    $('#tallys').attr("value", JSON.stringify(tallys));
  }

  function changeTally(evt) {
  // use for select-all polls  
    let button = $('#' + evt.target.id);
    console.log(button);
    let response_id = button.val();

    // TODO: consider changing tally to t/f boolean, look into jquery toggle class
    if (button.hasClass('selected')) {
    // decrement tally
      tallys[response_id] -= 1;
      button.removeClass('selected');
    }  else {
      if (tallys[response_id]) {
        tallys[response_id] += 1;
      }  else {
        tallys[response_id] = 1;
      }
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
    let response_id = button.val();

    if (button.hasClass('selected')) {
    // decrement tally
      tallys[response_id] -= 1;
      button.removeClass('selected');
    
    }  else {
      
      if (tallys[response_id]) {
        tallys[response_id] += 1;
      }  else {
        tallys[response_id] = 1;
      }

      let selected_button = $('.selected');
      console.log(selected_button);

      if (selected_button.length !== 0) {
        let sid = selected_button.val();
        tallys[sid] -= 1;
        selected_button.removeClass('selected');
      }

      button.addClass('selected');
    }

    console.log(tallys);
    $('#tallys').attr("value", JSON.stringify(tallys));
  }