import React from "react";
import ReactDOM from "react-dom";

export class Response extends React.Component {
  constructor(props) {
    super(props);

    this.state = { selected: false
    }

  } // end constructor

  updateResponse = (evt) => {
    
    let text = evt.target.value;

    if (text !== this.props.text && text !== '') {

      let data = {response_id : this.props.id,
                  text : evt.target.value};

      this.props.cbUpdate(data);
  
    }
    
  } // end updateResponse

  toggleSelection = (evt) => {

    let data = {response_id : this.props.id};

    if (this.props.isSelected) {
      this.props.deleteTally(data);
    } else {
      data.value = 1;
      this.props.addTally(data);
    }

    this.setState({ selected : !this.state.selected});

  } // end toggleSelection

  deleteResponse = (evt) => {

    let data = {response_id : this.props.id};
    
    this.props.cbDelete(data);

  } // end deleteResponse

  showSaved = () => {
    // implement save badge
  } // end showSaved

  showRankedQuestions = () => {
    const isSelected = this.props.isSelected;
    const mode = this.props.mode;
    const value = this.props.value;
    
    if (mode === 'edit') {
      return(
        <span className="ranked-response">
          <span className="badge badge-primary mr-3">{ value }</span>
          { this.props.text }
          <button className="close" aria-label="Close" type="button" onClick={this.deleteResponse}>&times;</button>
        </span>
      )

    } else {
      return(
        <span className="ranked-response"> 
          {isSelected
          ? <button onClick={this.toggleSelection} className="value btn btn-primary btn-sm selected">{ this.props.value }</button>
          : <button onClick={this.toggleSelection} className="value btn btn-primary btn-sm">{ this.props.value }</button>
          }
          { this.props.text }
        </span>

      );
    }
  } // showRankedQuestions

  render() {
    let mode = this.props.mode;
    let id = "response-opt-" + this.props.id;
    let text = this.props.text;
    let value = this.props.value;
    let isVisible = this.props.isVisible;
    let isSelected = this.props.isSelected;
    const index = this.props.index;

    if (this.props.pollType === 'ranked questions') {
      return(<li className="list-group-item">
        { this.showRankedQuestions() }</li>);
    } else {

      if (mode === 'respond') { 
        return(
          <li className="li-response">
          <div className="">
            {isSelected
            ? <button onClick={this.toggleSelection} className="response-option btn btn-primary btn-lg btn-inline-block selected">{text}</button>
            : <button onClick={this.toggleSelection} className="response-option btn btn-primary btn-lg btn-inline-block">{text}</button>
            }
          </div>
          </li>
        )
      } else if (mode === 'edit') {
        return(
          <li className="li-response">
            <div className="button-outline">
            <input type="text" id={id} className="edit text-center" defaultValue={text} onBlur={this.updateResponse} />
            
            <button className="close light" aria-label="Close" type="button" onClick={this.deleteResponse}>&times;</button>
            </div>

          </li>
        );
      } else if (mode === 'results') {
        return(
          <tr>
            <td id={'td-' + index} width="30"></td>
            <td>{text}</td>
            <td>{value}</td>
          </tr>)
        // return(<li className="li-response">{text} : {value}</li>);
      } // end if

    } // end if
    
  } // end render

} // end Response

export default Response;