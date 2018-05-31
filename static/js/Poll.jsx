import React from "react";
import ReactDOM from "react-dom";

import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';

import Response from './Response.jsx';
import BarChart from './BarChart.jsx';
import PieChart from './PieChart.jsx';

export class Poll extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
                  responseData: [],
                  chart : 'text',
                  items : ""
                  };

    onNewResult (this.props.pollId, 
      (err, data) => {
        this.setState({ responseData : data.responses })
        this.setState({ prompt : data.prompt })
    }); // end onNewResult

  } // end constructor

  setChart = (evt) => {
    let type = evt.target.id;
    this.setState({chart : type});
  } // end setChart

  handleChange = (evt) => {
    this.setState({ prompt : evt.target.value });
  } // end handleChange

  updatePrompt = (evt) => {

    const data = {prompt : evt.target.value};

    $.post('/api/polls/' + this.props.pollId,
      data,
      resp => console.log(resp)
    );

    this.props.cbUpdate(data);
 
  } // end updatePrompt

  onSortEnd = ({oldIndex, newIndex}, evt) => {
    // send new index to server, server return json with response weight data

    function assignWeight(array, index) {
      // take an array of objects and assigns object.weight based on the object's position in the array.
      let prevWeight = 0;
      let nextWeight;
      let length = array.length;
      let weight

      if (length === 1) {
        
        return array;

      } else if (index === 0) {
        
        nextWeight = array[index+1].weight;

      } else if (index === length-1) {
        
        // weight should be greater than prevWeight
        prevWeight = array[index-1].weight;
        weight = prevWeight + 1;
        array[index].weight = weight;
        return array

      } else {
        prevWeight = array[index-1].weight;
        nextWeight = array[index+1].weight; 

      }
      
      weight = (prevWeight + nextWeight) / 2.0;

      array[index].weight = weight;

      return array;

    } // end assignWeight

    // console.log(evt);

    this.setState({
      responseData: assignWeight(arrayMove(this.state.responseData, oldIndex, newIndex), newIndex)
    });

    let response = this.state.responseData[newIndex];

    // implement reWeigh if String(response.weight).length > 15

    $.post('/api/polls/' + this.props.pollId + '/responses/' + response.response_id,
      response,
      (resp) => console.log(resp));

  }; // end onSortEnd

  getUpdate = (data) => {
    let responses = this.state.responseData;

    for (let response of responses) {
      if (response.response_id === data.response_id) {
        response.text = data.text;
      }
    }

    this.setState({responseData : responses});

  }

  getDeletion = (response) => {
    /* get response send response to be deleted to server
       change responseData on state */
    let url = '/api/polls/' + this.props.pollId + '/responses/' + response.response_id;

    $.ajax({
      url: '/api/polls/' + this.props.pollId + '/responses/' + response.response_id,
      type: 'delete',
      success: (resp) => {
        console.log(resp.status);
        fetch('/api/polls/' + this.props.pollId + '/responses')
        .then(resp => resp.json())
        .then(data => this.setState({responseData: data.response_data}));
      }
    }); // end $.ajax

  } // end getDeletion

  handleOptionAdd = (evt) => {
    //update poll options and reset options to an empty string
    let responses = this.state.responseData;

    let _data = {responseData : [{'text' : '',
                                  'weight' : responses[responses.length-1].weight + 1}]};

    $.ajax({ 
      url: '/api/polls/' + this.props.pollId + '/responses',
      dataType: 'json',
      contentType : 'application/json',
      type: 'post',
      data: JSON.stringify(_data),
      success: (resp) => {
        console.log(resp);
        this.setState({responseData: this.state.responseData.concat(resp.response_data)});
      }
    });
    
  } // end handleOptionAdd

  /* Begin render elements */

  showNav = () => {
    let mode = this.props.mode
    if (mode === 'results') {

      return (
        <div>
          <button id="pie" onClick={ this.setChart }><i className="fas fa-chart-pie"></i></button>
          <button id="bar" onClick={ this.setChart }><i className="fas fa-chart-bar"></i></button>
          <button id="text" onClick={ this.setChart }><i className="fas fa-font"></i></button>
        </div>
      ) // end return
    } // end if
  } // showNav

  showResults = (responses) => {
    
    let chart = this.state.chart;
    let mode = this.props.mode
    
    if (mode === 'results') {

      return (
        <div>
          
              { (chart === 'bar') ? 
                (<BarChart data={responses} />) : 
                ((chart === 'pie') ? 
                 (<PieChart data={responses} />) : (<p>{chart}</p>))
              }
        </div>

      ) // end of return
    } else {

      return(<p>{mode}</p>);

    } // end if
  } // end showResults

  showPrompt = () => {
    
    let id = this.props.pollId;
    let prompt = this.props.prompt;
    let mode = this.props.mode;

    if (mode === 'edit') {
      return (<div><input type="text" id={id} className="" defaultValue={prompt} onBlur={this.updatePrompt} /></div>);
      
    } else {
      return (<h1>{prompt}</h1>);
    } // end if

  } // end showPrompt

  showResponses = (responses) => {

    let mode = this.props.mode;
    let pollId = this.props.pollId;

    const SortableItem = SortableElement(({value}) =>
      <li key={ value.response_id }><Response 
            key={ value.response_id } 
            id={ value.response_id }
            text={ value.text }
            weight={ value.weight } 
            mode='edit' 
            isVisible={ value.is_visible }
            pollId={ this.props.pollId }
            cbDelete={ this.getDeletion }
            cbUpdate={ this.getUpdate } />
      </li>
    ); // end SortableItem

    const SortableList = SortableContainer(({items}) => {
      return (
        <ol>
          {items.map((value, index) => (
            <SortableItem key={`item-${index}`} index={index} value={value} />
          ))}
        </ol>
      );
    }); // end SortableList


    if (mode === 'edit') {
      return (
        <div>
          <SortableList items={responses} onSortEnd={this.onSortEnd} />
          <button className="btn btn-lg btn-success btn-block" type="button" onClick={this.handleOptionAdd}>Add option</button>
        </div>);
      
    } else {
      return (<div><ol> {responses.map(function(response){
            return <li><Response 
                      key={ response.response_id } 
                      id={ response.response_id } 
                      mode={ mode }
                      pollId={ pollId }
                      text={ response.text }
                      weight={ response.weight }
                      value={ response.value } /></li>;
          })}</ol></div>);
    } // end if

  } // end showResponses


  render() {
    let responses = this.state.responseData;
    //responses = responses.sort((a, b) => a.weight - b.weight );
    let mode = this.props.mode

    return(
      <div> 
        { this.showNav() }

        { this.showPrompt() }
            
        { responses ? this.showResponses(responses) : <div/> }
        
        { responses ? this.showResults(responses) : <div/> }
        
      </div>);
    
  } // End of render

  componentDidMount() {
    fetch('/api/polls/' + this.props.pollId + '/responses')
      .then( resp => resp.json())
      .then( data => this.setState({ responseData: data.response_data }));
  
  } // end componentDidMount

} // End of Poll

export default Poll;