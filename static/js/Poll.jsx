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
                  responseOrder: [],
                  responseData: new Map(),
                  chart : 'bar',
                  items : '',
                  input : '',
                  tallys: []
                  };

    onNewResult (this.props.pollId, 
      (err, data) => {
        let responses = this.state.responseData;
        const id = data.response_id;
        // TODO: for each key in data, find corresponding key in responses and reset value
        for (let property in data) {
          //debugger;
          responses.get(id)[property] = data[property];
        }

        this.setState({ responseData : responses });
    }); // end onNewResult

  } // end constructor

  setChart = (evt) => {
    let type = evt.target.id;
    this.setState({chart : type});
  } // end setChart

  handleInput = (evt) => {
    console.log(evt);
    this.setState({ input : evt.target.value });
  } // end handleInput

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

    this.setState({
      responseOrder: arrayMove(this.state.responseOrder, oldIndex, newIndex)
    });

    let id = this.state.responseOrder[newIndex].response_id;
    let data = {response_id : id, weight : newIndex};

    $.post('/api/polls/' + this.props.pollId + '/responses/' + id,
      data,
      (resp) => console.log(resp));

  }; // end onSortEnd

  getUpdate = (data) => {
    let responses = this.state.responseData;

    responses.get(data.response_id).text = data.text;

    this.setState({responseData : responses});

  } // end getUpdate

  getDeletion = (data) => {
    /* get response send response to be deleted to server
       change responses on state */
    const id = data.response_id;
    let url = '/api/polls/' + this.props.pollId + '/responses/' + id;
    let responses = this.state.responseData;
    let response = responses.get(id);
    let order = this.state.responseOrder;

    $.ajax({
      url: '/api/polls/' + this.props.pollId + '/responses/' + id,
      type: 'delete',
      success: (resp) => {
        console.log(resp.status);
        let index = order.indexOf(response);
        order.splice(index, 1);
        responses.delete(id);
        this.setState({responseData : responses, responseOrder : order});

      }
    }); // end $.ajax

  } // end getDeletion

  addTally = (data) => {
    const id = data.response_id;
    let responses = this.state.responseData;
    responses.get(id).tally = data;
    let tally = responses.get(id).tally;
    let tallys = this.state.tallys;

    if (!this.props.multiSelect && this.state.tallys.length !== 0) {
      //debugger;
      let removed = tallys.pop();
      delete responses.get(removed.response_id).tally;
    }

    this.state.tallys.push(tally);

    this.setState({ responseData : responses,
                    tallys : tallys });
  } // end addTally

  deleteTally = (data) => {
    const id = data.response_id;
    let responses = this.state.responseData;

    let tally = responses.get(id).tally;
    let index = this.state.tallys.indexOf(tally);
    this.state.tallys.splice(index, 1);

    delete responses.get(id).tally;

    this.setState({ responseData : responses,
                    tallys : this.state.tallys });

  } // end deleteTally

  createTallys = (evt) => {
    let data = {tallys : this.state.tallys};

    $.ajax({ 
      url: '/api/polls/' + this.props.pollId + '/tallys',
      dataType: 'json',
      contentType : 'application/json',
      type: 'post',
      data: JSON.stringify(data),
      success: (resp) => {
        console.log(resp);

        if (this.props.isAdmin) {
          this.props.routeProps.history.push('/' + this.props.shortCode + '/results');
        } else {
          this.props.cbUpdate({mayRespond : false});
        }

      } // end success
    }); // end ajax
  }

  addResponse = (evt, text='') => {
    //update poll options and reset options to an empty string
    let order = this.state.responseOrder;
    let weight;

    order.length > 0 ? weight = order[order.length-1].weight + 1 : weight = 1;

    let _data = {responses : [{'text' : text,
                               'weight' : weight}]};

    $.ajax({ 
      url: '/api/polls/' + this.props.pollId + '/responses',
      dataType: 'json',
      contentType : 'application/json',
      type: 'post',
      data: JSON.stringify(_data),
      success: (resp) => {
        console.log(resp.status);
        const response = resp.response_data[0];
        const id = response.response_id;
        const rMap = this.state.responseData;
        rMap.set(id, response);

        this.setState({responseData : rMap,
                       responseOrder: this.state.responseOrder.concat(rMap.get(id))});
      } // end success
    }); // end ajax
    
  } // end addResponse

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

  showResponsesForTally = (responses) => {

    let mode = this.props.mode;
    let pollId = this.props.pollId;

    const SortableItem = SortableElement(({value}) =>
      <li key={ value.response_id }><Response 
            key={ value.response_id } 
            id={ value.response_id }
            text={ value.text }
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
          <button className="btn btn-lg btn-success btn-block" type="button" onClick={this.addResponse}>Add option</button>
        </div>);
      
    } else if (mode === 'respond') {
      return (
        <div>
          <ol> {responses.map((response) => {
              return(<li key={ response.response_id }><Response 
                        key={ response.response_id } 
                        id={ response.response_id } 
                        mode={ mode }
                        pollId={ pollId }
                        text={ response.text }
                        value={ response.value }
                        addTally={ this.addTally }
                        deleteTally={ this.deleteTally }
                         /></li>);})}           
            </ol>
            <button className="btn btn-lg btn-success btn-block" type="button" onClick={this.createTallys}>Submit</button>
          </div>

      );
    } else if (mode === 'results') {
      return (<ol> {responses.map((response) => {
            return (<li key={ response.response_id }><Response 
                      key={ response.response_id } 
                      id={ response.response_id } 
                      mode={ mode }
                      pollId={ pollId }
                      text={ response.text }
                      value={ response.value }
                       /></li>);
                      
          })}</ol>);
    } else {
      <div />
    } // end if

  } // end showResponsesForTally


  showResponsesForResponse = (responses) => {
    let mode = this.props.mode;
    let pollId = this.props.pollId;
    let text = this.state.input;
    const url = '/polls/' + this.props.shortCode + '/response'

    if (mode === 'respond') {
      return(
        <form action={url} method="POST">
          <input type="text" id="response" name="response" />
          <input type="submit" value="submit" />
        </form>
      );
    } else if (mode === 'results') {
      return(<ul> {responses.map(function(response){
            return <li key={ response.response_id }><Response 
                      key={ response.response_id } 
                      id={ response.response_id } 
                      mode={ mode }
                      pollId={ pollId }
                      text={ response.text }
                      value={ response.value } /></li>;
          })}</ul>);
    } else {
      return(<div/>);
    }

  } // showResponsesForResponse

  showCharts = (responses) => {
    
    let chart = this.state.chart;
    let mode = this.props.mode
    
    return (
      <div>
        { (chart === 'bar') ? 
          (<BarChart data={responses} />) : 
          ((chart === 'pie') ? 
           (<PieChart data={responses} />) : <div/>)
        }
      </div>

    ) // end of return
  } // end showCharts

  showSubmit = () => {
    <button className="btn btn-lg btn-success btn-block" type="button" onClick={this.saveTallys}>Add option</button>
  } // end showSubmit


render() {
    let responses = this.state.responseOrder;
    const mode = this.props.mode;
    const collectTally = this.props.collectTally;
    const collectResponse = this.props.collectResponse;

    return(
      <div> 
        { this.showNav() }

        { this.showPrompt() }
            
        { responses && collectTally === true ? this.showResponsesForTally(responses) : <div/> }

        { responses && collectResponse === true ? this.showResponsesForResponse(responses) : <div/> }
        
        { responses && mode === 'results' ? this.showCharts(responses) : <div/> }
        
      </div>
    );
    
  } // End of render

  componentDidMount() {
    fetch('/api/polls/' + this.props.pollId + '/responses')
      .then( resp => resp.json())
      .then( data => {
        let order = new Array();
        let rMap = new Map();

        for (let response of data.response_data) {
          rMap.set(response.response_id, response);
        }

        for (let datum of data.response_data) {
          order.push(rMap.get(datum.response_id));
        }

        this.setState({ responseOrder: order, responseData: rMap });
      });
  
  } // end componentDidMount

} // End of Poll

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

export default Poll;