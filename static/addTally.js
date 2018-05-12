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
  console.log(tallys);
}

function changeTally(evt) {
// use for select-all polls  
  let button = $('#' + evt.target.id);
  console.log(button);
  let response_key = button.val();

  if (button.hasClass('selected')) {
    delete tallys[response_key];
    button.removeClass('selected');
  }  else {
    tallys[response_key] = 'True';
    button.addClass('selected');
  }

  console.log(tallys);
}

function selectTally(evt) {
// use for multiple choice polls
  
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
}

function submitForm(evt) {
  evt.preventDefault();

  let formInputs = {
      "tallys": JSON.stringify(tallys)
  };

  console.log(formInputs);

  let route = '/' + $('#poll').val();

  console.log(route);

  $.post(route, 
       formInputs,
       response_route => window.location.assign(response_route));
}