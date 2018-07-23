import React from "react";
import ReactDOM from "react-dom";

// test

export class Input extends React.Component {
  constructor(props) {
    super(props);
  } // end constructor

  updateInput = (evt) => {

    let data = {index : this.props.index, text : evt.target.value};

    this.props.updateInput(data);

    
  } // end updateResponse

  addResponse = (evt) => {
    let text = this.props.value;

    if (text !== '') {
  	  let data = {index : this.props.index};
  	  this.props.addResponse(data);
    }

  } // end addResponse

  deleteInput = (evt) => {

    let index = this.props.index;
    
    this.props.deleteInput(index);

  } // end deleteResponse

	render = () => {
    let buttonText;
    let inputClass = '';
    let divClass = '';
    let blurFunc = '';

    if (this.props.mode === 'edit' && (this.props.pollType === 'select all' | this.props.pollType === 'multiple choice')) {
        return(
          <li className="li-input">
          <div className="button-outline input">
            <input type="text" 
                   className="response-input edit text-center" 
                   onChange={this.updateInput} 
                   onBlur={this.addResponse}
                   value={this.props.value} />
            <button className="close light" aria-label="Close" type="button" onClick={this.deleteInput}>&times;</button>
          </div>
          </li>
        );

    } else {
        return(
          <li>
          <div className="form-group d-flex">
            <input type="text" className="form-control response-input flex-fill" placeholder="Type your response" onChange={this.updateInput} value={this.props.value} />
            <button type="button" className="submit btn btn-success flex-fill" onClick={this.addResponse}>Submit</button>
          </div>
          </li>
        );
    }

  } // end render

} // endInput

export default Input;
