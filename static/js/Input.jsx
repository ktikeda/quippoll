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
    let text = evt.target.value;

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

    if (this.props.mode === 'edit') {
        return(
          <li className="li-response">
          <div className="button-outline">
            <input type="text" 
                   className="response-input edit text-center" 
                   onChange={this.updateInput} 
                   onBlur={this.addResponse}
                   value={this.props.value} />
            <button className="close" aria-label="Close" type="button" onClick={this.deleteInput}>&times;</button>
          </div>
          </li>
        );

    } else {
        return(
          <div>
            <input type="text" className="response-input" onChange={this.updateInput} value={this.props.value} />
            <button type="button" onClick={this.addResponse}>Submit</button>
          </div>
        );
    }

  } // end render

} // endInput

export default Input;
