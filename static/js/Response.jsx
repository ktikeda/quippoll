import React from "react";
import ReactDOM from "react-dom";

export class Response extends React.Component {
  constructor(props) {
    super(props);

    this.state = { selected: false
    }

  } // end constructor

  updateResponse = (evt) => {

    let data = {response_id : this.props.id,
                text : evt.target.value};

    $.post('/api/polls/' + this.props.pollId + '/responses/' + this.props.id,
      data,
      (resp) => console.log(resp));

    //this.props.cbUpdate(data);

    
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

  passDeletion = (evt) => {

    let data = {response_id : this.props.id};
    
    this.props.cbDelete(data);
  } // end passDeletion

  showSaved = () => {
    // implement save badge
  } // end showSaved

  showRankedQuestions = () => {
    let isSelected = this.props.isSelected;
    return(
      <div> {isSelected
        ? <button onClick={this.toggleSelection} className="btn btn-primary btn-sm selected">{ this.props.value }</button>
        : <button onClick={this.toggleSelection} className="btn btn-primary btn-sm">{ this.props.value }</button>
        }
        { this.props.text }
      </div>
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

      if (mode === 'respond') { return (<div> {isSelected
        ? <button onClick={this.toggleSelection} className="response-option btn btn-primary btn-lg btn-block selected">{text}</button>
        : <button onClick={this.toggleSelection} className="response-option btn btn-primary btn-lg btn-block">{text}</button>
      }</div>)
      } else if (mode === 'edit') {
        return (<div><input type="text" id={id} className="" defaultValue={text} onBlur={this.updateResponse} />
                <button className="" type="button" onClick={this.passDeletion}>Delete</button>
                </div>);
      } else if (mode === 'results') {
        return (<div>{text} : {value}</div>);
      } // end if

    } // end if

    
  } // end render

} // end Response

export default Response;