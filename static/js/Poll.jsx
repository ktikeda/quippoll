import React from "react";
import ReactDOM from "react-dom";

import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';

import FlipMove from 'react-flip-move';

import Response from './Response.jsx';
import Input from './Input.jsx';
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
                  inputs : [],
                  tallys: []
                  };

  } // end constructor

  /* Functions that callback to parent */

  updatePrompt = (evt) => {

    const data = {prompt : evt.target.value};

    $.post('/api/polls/' + this.props.pollId,
      data,
      resp => console.log(resp)
    );

    this.props.cbUpdate(data);
 
  } // end updatePrompt

  /* Functions to update component state */

  updateChart = (evt) => {
    let type = evt.target.id;

    this.setState({chart : type});

  } // end updateChart

  updateInput = (data) => {
    // get response.txt from Response child and update state
    let inputs = this.state.inputs;
    const index = data.index;
 
    inputs[index] = data.text;

    this.setState({inputs : inputs});

  } // end updateInput

  updateResponseData = (data) => {
    // get response.txt from Response child and update state
    let responses = this.state.responseData;

    responses.get(data.response_id).text = data.text;

    this.setState({responseData : responses});

  } // end updateResponseData

  addInput = () => {
    let inputs = this.state.inputs;

    inputs.push('');

    this.setState({inputs : inputs});
  } // end addInput

  updateResponseOrder = ({oldIndex, newIndex}, evt) => {
    // send new index to server, server return json with response weight data

    this.setState({
      responseOrder: arrayMove(this.state.responseOrder, oldIndex, newIndex)
    });

    let id = this.state.responseOrder[newIndex].response_id;
    let data = {response_id : id, weight : newIndex};

    $.post(
      '/api/polls/' + this.props.pollId + '/responses/' + id,
      data,
      (resp) => {
        console.log(resp)

        socket.emit('response_order_change', {room: this.props.shortCode, data: [oldIndex, newIndex]});
      }
    ); // end post

  }; // end updateResponseOrder

  deleteResponse = (data) => {
    /* get response send response to be deleted to server
       change responses on state */
    const id = data.response_id;
    let responses = this.state.responseData;
    let response = responses.get(id);
    let order = this.state.responseOrder;

    $.ajax({
      url: '/api/polls/' + this.props.pollId + '/responses/' + id,
      type: 'delete',
      success: (resp) => {
        console.log(resp);
        
        let index = order.indexOf(response);
        order.splice(index, 1);
        responses.delete(id);

        this.setState({responseData : responses, responseOrder : order});

        socket.emit('response_deletion', {room: this.props.shortCode, data: {response_id : response.response_id}});

      }
    }); // end $.ajax

  } // end deleteResponse

  addTally = (data) => {
  // add tally to this.state.tallys
    console.log(data);
    const id = data.response_id;
    let responses = this.state.responseData;

    responses.get(id).tally = data;
    let tally = responses.get(id).tally;
    let tallys = this.state.tallys;

    if (!this.props.multiSelect && this.state.tallys.length !== 0) {
      let removed = tallys.pop();
      delete responses.get(removed.response_id).tally;
    }

    // create tally in database if the poll is ranked questions
    if (this.props.pollType === 'ranked questions') {
      let data = {tallys : [tally]};

      $.ajax({ 
        url: '/api/polls/' + this.props.pollId + '/tallys',
        dataType: 'json',
        contentType : 'application/json',
        type: 'post',
        data: JSON.stringify(data),
        success: (resp) => {
          console.log('tally success', resp);
          responses.get(id).tally = resp.tallys[0];
          tally = responses.get(id).tally;
          this.state.tallys.push(tally);
          this.setState({ responseData : responses,
                          tallys : tallys });
        }
      });
    } else {
      
      tallys.push(tally);

      this.setState({ responseData : responses,
                      tallys : tallys });
    } // end if

  } // end addTally

  deleteTally = (data) => {
  // remove tally from this.state.tallys
    console.log(data);
    const id = data.response_id;
    let responses = this.state.responseData;
    let tally = responses.get(id).tally;
    let index = this.state.tallys.indexOf(tally);
    let tallys = this.state.tallys
    
    tallys.splice(index, 1);

    delete responses.get(id).tally;

    this.setState({ responseData : responses,
                    tallys : tallys });

    if (this.props.pollType === 'ranked questions') {
      let data = tally;
      $.ajax({ 
        url: '/api/polls/' + this.props.pollId + '/responses/' + id + '/tallys/' + tally.tally_id,
        dataType: 'json',
        contentType : 'application/json',
        type: 'delete',
        data: JSON.stringify(data),
        success: (resp) => {
          console.log('tally deleted', resp);
        }
      });
    } // end if

  } // end deleteTally

  createTallys = (evt) => {
  // create tally in database and redirect to results page
    let data = {tallys : this.state.tallys};

    $.ajax({ 
      url: '/api/polls/' + this.props.pollId + '/tallys',
      dataType: 'json',
      contentType : 'application/json',
      type: 'post',
      data: JSON.stringify(data),
      success: (resp) => {
        console.log('tally success', resp);

        if (this.props.isAdmin) {
          this.props.routeProps.history.push('/' + this.props.shortCode + '/results');
        } else {
          this.props.cbUpdate({mayRespond : false});
        } // end if
      } // end success
    }); // end ajax
  }

  addResponse = (childData) => {
    //update poll options and reset options to an empty string
    const index = childData.index;
    let order = this.state.responseOrder;
    let weight;
    let text = this.state.inputs[index];
    

    order.length > 0 ? weight = order[order.length-1].weight + 1 : weight = 1;

    let data = {responses : [{'text' : text,
                               'weight' : weight}]};

    $.ajax({ 
      url: '/api/polls/' + this.props.pollId + '/responses',
      dataType: 'json',
      contentType : 'application/json',
      type: 'post',
      data: JSON.stringify(data),
      success: (resp) => {
        console.log(resp);
        const response = resp.response_data[0];
        const id = response.response_id;
        let responses = this.state.responseData;
        responses.set(id, response);
        let inputs = this.state.inputs;
        inputs.splice(index, 1);

        this.setState({inputs : inputs,
                       responseData : responses,
                       responseOrder: this.state.responseOrder.concat(responses.get(id))});

        if (this.props.pollType !== 'ranked questions' && this.props.mode === 'respond') {

          if (this.props.isAdmin) {
            this.props.routeProps.history.push('/' + this.props.shortCode + '/results');
          } else {
            this.props.cbUpdate({mayRespond : false});
          }
        }
      } // end success
    }); // end ajax
    
  } // end addResponse

  /* Functions render elements */

  showNav = () => {
    const mode = this.props.mode
    if (mode === 'results') {

      return(
        <div>
          <button id="pie" onClick={ this.updateChart }><i className="fas fa-chart-pie"></i></button>
          <button id="bar" onClick={ this.updateChart }><i className="fas fa-chart-bar"></i></button>
          <button id="text" onClick={ this.updateChart }><i className="fas fa-font"></i></button>
        </div>
      ) // end return
    } // end if
  } // showNav


  showPrompt = () => {
    
    const id = this.props.pollId;
    const prompt = this.props.prompt;
    const mode = this.props.mode;

    if (mode === 'edit') {
      return (<div><input type="text" id={id} className="" defaultValue={prompt} onBlur={this.updatePrompt} /></div>);
      
    } else {
      return (<h1>{prompt}</h1>);
    } // end if

  } // end showPrompt

  showResponses = (responses) => {

    const mode = this.props.mode;
    const pollId = this.props.pollId;
    const pollType = this.props.pollType;

    const SortableItem = SortableElement(({value}) =>
      <Response 
            key={ value.response_id } 
            id={ value.response_id }
            text={ value.text }
            mode='edit' 
            isVisible={ value.is_visible }
            pollId={ this.props.pollId }
            pollType={ this.props.pollType }
            cbDelete={ this.deleteResponse }
            cbUpdate={ this.updateResponseData } />
      
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
          <SortableList items={responses} updateResponseOrder={this.updateResponseOrder} />
        </div>);
      
    } else if (mode === 'respond') {
      return (
        <FlipMove typeName="ol">
          {responses.map(response => (
              <Response 
                key={ response.response_id } 
                id={ response.response_id } 
                mode={ mode }
                pollId={ pollId }
                pollType={ pollType }
                text={ response.text }
                value={ response.value }
                addTally={ this.addTally }
                deleteTally={ this.deleteTally }
                isSelected={ response.hasOwnProperty('tally') }
                />
          ))}           
        </FlipMove>
      );
    } else if (mode === 'results') {
      return (
        <FlipMove typeName="ol"> 
          {responses.map(response => (
            <Response 
              key={ response.response_id } 
              id={ response.response_id } 
              mode={ mode }
              pollId={ pollId }
              text={ response.text }
              value={ response.value }
              />         
          ))}
        </FlipMove>
      );
    } else {
      <div />
    } // end if

  } // end showResponses

  showInput = () => {
    let inputs = this.state.inputs;
    return(
      <div>
      {inputs.map((value, index) => (
        <Input key={`input-${index}`} index={index} mode={this.props.mode} value={value} updateInput={this.updateInput} addResponse={this.addResponse}/>
      ))}
      </div>
    );
  } // end showInput

  showSubmit = () => {
    return(<button className="btn btn-lg btn-success btn-block" type="button" onClick={this.createTallys}>Submit</button>);
  } // end showSubmit


  showCharts = (responses) => {
    
    let chart = this.state.chart;
    const mode = this.props.mode;
    
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

  showAddInput = () => {
    let inputs = this.state.inputs;
    return(
      <div>
        <button className="btn btn-lg btn-success btn-block" type="button" onClick={this.addInput}>Add option</button>
        
      </div>
    );
  } // end showSubmit


  render() {
    let responses = this.state.responseOrder;
    let inputs = this.state.inputs;
    const mode = this.props.mode;
    const collectTally = this.props.collectTally;
    const collectResponse = this.props.collectResponse;

    return(
      <div> 
        { this.showNav() }

        { this.showPrompt() }

        { responses && collectResponse === true ? this.showInput() : <div/> }
            
        { responses && collectTally === true ? this.showResponses(responses) : <div/> }
        
        { responses && mode === 'results' && collectTally === false ? this.showCharts(responses) : <div/> }
        
        { collectTally === true && mode === 'edit' ? this.showInput() : <div/> }
        
        { mode === 'edit' ? this.showAddInput() : <div/> }

        { mode === 'respond' && collectResponse === false ? this.showSubmit() : <div/>}
        
      </div>
    );
    
  } // End of render

  componentDidMount() {
    let responses = this.state.responseData;
    let order = this.state.responseOrder;
    const pollType = this.props.pollType;

  /* call socketio functions */

    onResponseUpdate (
      (err, data) => {
        const id = data.response_id;

        if (responses.get(id) === undefined) {
          responses.set(id, {});
          order.push(responses.get(id));
        }

        if (responses.size !== 0) {
          for (let property in data) {
            responses.get(id)[property] = data[property];
            if (property === 'value' && pollType === 'ranked questions') {
              order.sort((a, b) => b.value - a.value );
            }
          }
          this.setState({ responseData : responses, responseOrder : order});
        }
    
    }); // end onResponseUpdate

    onResponseDeletion ( 
      (err, data) => {
        const id = data.response_id;

        if (responses.get(id) !== undefined) {
          let response = responses.get(id);
          let index = order.indexOf(response);
          order.splice(index, 1);
          responses.delete(id);
          this.setState({ responseData : responses, responseOrder : order});
        } // end if

    }); // end onResponseUpdate

    onNewOrder( 
      (err, data) => {
        const oldIndex = data.order[0];
        const newIndex = data.order[1];
        this.setState({
          responseOrder: arrayMove(this.state.responseOrder, oldIndex, newIndex)
        });
      
    }); // end onNewOrder

    /* end calling socketio functions */

    if (this.props.mode === 'respond' && this.props.collectResponse === true) {
      let inputs = this.state.inputs;
      inputs.push('');
      this.setState({inputs : inputs});
    }

    // get data from server and set to state
    fetch('/api/polls/' + this.props.pollId + '/responses')
      .then( resp => resp.json())
      .then( data => {

        for (let response of data.response_data) {
          responses.set(response.response_id, response);
        }

        for (let datum of data.response_data) {
          order.push(responses.get(datum.response_id));
        }

        this.setState({ responseOrder: order, responseData: responses });
      });

  } // end componentDidMount

} // End of Poll

export default Poll;