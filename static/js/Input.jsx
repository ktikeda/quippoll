import React from "react";
import ReactDOM from "react-dom";

export class Input extends React.Component {
  constructor(props) {
    super(props);
  } // end constructor

  updateInput = (evt) => {

    let data = {index : this.props.index, text : evt.target.value};

    this.props.updateInput(data);

    
  } // end updateResponse

  addResponse = (evt) => {
  	evt.preventDefault();
  	let data = {index : this.props.index};

  	this.props.addResponse(data);

  } // end addResponse

	render = () => {
    let buttonText;
    let inputClass = '';
    let divClass = '';

    if (this.props.mode === 'edit') {
      buttonText = 'Save'; 
      inputClass = 'edit text-center';
      divClass = 'button-outline'
    } else {
      buttonText = 'Submit';
    }

    return(
	    <div className={divClass}>
	      
        <input type="text" className={inputClass} onChange={this.updateInput} value={this.props.value} id="response" name="response"/>
	      <button type="button" onClick={this.addResponse}>{buttonText}</button>
	    </div>
	  );
  } // end render

} // endInput

export default Input;
