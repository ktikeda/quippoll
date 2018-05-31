import React from "react";
import ReactDOM from "react-dom";

export class Response extends React.Component {
  constructor(props) {
    super(props);

    this.state = {text : "",
                  isVisible : true,
                  };

    this.updateResponse = this.updateResponse.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.passDeletion = this.passDeletion.bind(this);

  } // end constructor

  handleChange(evt) {
    this.setState({ text : evt.target.value });
  } // handleChange

  updateResponse(evt) {

    let data = {'response_id' : this.props.id,
                'text' : evt.target.value};

    $.post('/api/polls/' + this.props.pollId + '/responses/' + this.props.id,
      data,
      (resp) => console.log(resp));

    this.props.cbUpdate(data);

    
  } // end updateResponse

  passDeletion(evt) {

    let data = {'response_id' : this.props.id};
    
    this.props.cbDelete(data);
  } 

  showSaved() {
    // implement save badge
  } // end showSaved

  render() {
    let mode = this.props.mode;
    let id = "response-opt-" + this.props.id;
    let weight = this.props.weight
    let text = this.props.text;
    let value = this.props.value;
    let isVisible = this.props.isVisible;

    if (mode === 'respond') {
      return (<button className="response-option btn btn-primary btn-lg btn-block">{text}</button>);
    } else if (mode === 'edit') {
      return (<div><label>{weight}. </label><input type="text" id={id} className="" defaultValue={text} onBlur={this.updateResponse} />
              <button className="" type="button" onClick={this.passDeletion}>Delete</button>
              </div>);
    } else if (mode === 'results') {
      return (<div>{text} : {value}</div>);
    } // end if
  } // end render

  componentDidMount() {
    let resp = fetch('/api/polls/' + this.props.pollId + '/responses/' + this.props.id).then(data => data.json());

    resp.then( data => this.setState({ text: data.text }));
  
  } // end componentDidMount

}

export default Response;