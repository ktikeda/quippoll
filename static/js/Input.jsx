import React from "react";
import ReactDOM from "react-dom";

export class Input extends React.Component {
  constructor(props) {
    super(props);
  } // end constructor

  updateInput = (evt) => {

    let data = {text : evt.target.value};

    this.props.updateInput(data);

    
  } // end updateResponse

	render = () => {
    <form>
      <input type="text" onChange={this.updateInput} id="response" name="response"/>
      <input type="submit" value="submit" onClick={this.props.addResponse} />
    </form>
  } // end render

} // endInput

export default Input;
