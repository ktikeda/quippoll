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

      $.post('/api/polls/' + this.props.pollId + '/responses/' + this.props.id,
        data,
        (resp) => console.log(resp));
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
    let isSelected = this.props.isSelected;
    return(
      <span> 
        {isSelected
        ? <button onClick={this.toggleSelection} className="btn btn-primary btn-sm selected">{ this.props.value }</button>
        : <button onClick={this.toggleSelection} className="btn btn-primary btn-sm">{ this.props.value }</button>
        }
        { this.props.text }
      </span>
    )
  } // showRankedQuestions

  render() {
    let mode = this.props.mode;
    let id = "response-opt-" + this.props.id;
    let text = this.props.text;
    let value = this.props.value;
    let isVisible = this.props.isVisible;
    let isSelected = this.props.isSelected;

    if (this.props.pollType === 'ranked questions') {
      return(<div>{ this.showRankedQuestions() }</div>);
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
            
            <button className="close" aria-label="Close" type="button" onClick={this.deleteResponse}>&times;</button>
            </div>

          </li>
        );
      } else if (mode === 'results') {
        return(<li className="li-response">{text} : {value}</li>);
      } // end if

    } // end if
    
  } // end render

} // end Response

export default Response;