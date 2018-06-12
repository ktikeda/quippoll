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
                  mode : this.props.mode,
                  items : '',
                  inputs : [],
                  tallys: []
                  };

  } // end constructor

  /* Functions that callback to parent */

  updatePrompt = (evt) => {

    const data = {poll_id : this.props.pollId, prompt : evt.target.value};

    $.post('/api/polls/' + this.props.pollId,
      data,
      resp => console.log('server updated', resp)
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

  deleteInput = (index) => {
    let inputs = this.state.inputs;
    inputs.splice(index, 1);

    this.setState({inputs : inputs});
  } // end deleteInput
 
  updateResponseData = (data) => {
    // get response.txt from Response child and update state
    const id = data.response_id;
    let responses = this.state.responseData;
    let response = responses.get(id);
    

    $.post('/api/polls/' + this.props.pollId + '/responses/' + id,
        data,
        (resp) => {
          console.log('response updated on server', resp);
          response.text = data.text;

          this.setState({responseData : responses});

          socket.emit('response_update', 
            {room: this.props.shortCode, 
             data: {response_id : response.response_id, text : response.text}
            }
          );
        }
    );

  } // end updateResponseData

  addInput = () => {
    let inputs = this.state.inputs;

    inputs.push('');

    this.setState({inputs : inputs});
  } // end addInput

  updateResponseOrder = ({oldIndex, newIndex}, evt) => {
    // send new index to server, server return json with response weight data

    if (oldIndex !== newIndex) {
      let order = this.state.responseOrder;

      this.setState({
        responseOrder: arrayMove(order, oldIndex, newIndex)
      });

      let id = this.state.responseOrder[newIndex].response_id;
      let data = {response_id : id, weight : newIndex};
      const shortCode = this.props.shortCode;

      $.post(
        '/api/polls/' + this.props.pollId + '/responses/' + id,
        data,
        (resp) => {
          console.log('reweight responses on server', resp)

          socket.emit('response_order_change', {room: shortCode, data: [oldIndex, newIndex]});
        }
      ); // end post
    }

  }; // end updateResponseOrder

  deleteResponse = (data) => {
    /* get response send response to be deleted to server
       change responses on state */
    const id = data.response_id;
    let responses = this.state.responseData;
    let response = responses.get(id);
    let order = this.state.responseOrder;

    console.log('client requesting server delete response', id)

    $.ajax({
      url: '/api/polls/' + this.props.pollId + '/responses/' + id,
      type: 'delete',
      success: (resp) => {

        console.log('server deleted', resp);
        
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
    console.log('tally created on client', data);
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
          console.log('tally created on server', resp);
          responses.get(id).tally = resp.tallys[0];
          tally = responses.get(id).tally;
          tallys.push(tally);
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
          console.log('server deleted', resp);
        }
      });
    } // end if

  } // end deleteTally

  createTallys = (evt) => {
  // create tally in database and redirect to results page
    let data = {tallys : this.state.tallys};
    const shortCode = this.props.shortCode;

    $.ajax({ 
      url: '/api/polls/' + this.props.pollId + '/tallys',
      dataType: 'json',
      contentType : 'application/json',
      type: 'post',
      data: JSON.stringify(data),
      success: (resp) => {
        console.log('tally created on server', resp);
        let tallys = resp.tallys;
        
        for (let tally of tallys) {
          socket.emit('response_update', {room: shortCode, data: {response_id : tally.response_id}});
        }

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
    const pollType = this.props.pollType;
    let order = this.state.responseOrder;
    let weight;
    let text = this.state.inputs[index];
    let mode = this.props.mode;
    
    // order.length > 0 ? weight = order[order.length-1].weight + 1 : weight = 1;

    let data = {responses : [{'text' : text}]};

    console.log('client sending data to create response');

    $.ajax({ 
      url: '/api/polls/' + this.props.pollId + '/responses',
      dataType: 'json',
      contentType : 'application/json',
      type: 'post',
      data: JSON.stringify(data),
      success: (resp) => {
        console.log('response created on server', resp);

        let inputs = this.state.inputs;
        inputs.splice(index, 1);

        // redirect to results
        if (this.props.pollType !== 'ranked questions' && mode === 'respond') {
          // clean up inputs

          
          if (this.props.isAdmin) {
            this.props.routeProps.history.push('/' + this.props.shortCode + '/results');
          } else {
            this.props.cbUpdate({mayRespond : false});
          }
        } 
        else if ((mode === 'respond' && pollType === 'ranked questions') 
          | (mode === 'edit' && (pollType === 'ranked questions' | pollType === 'open-ended')))
          
        {
          inputs.push('');
        }

        this.setState({inputs : inputs});
      } // end success
    }); // end ajax
    
  } // end addResponse

  /* render elements */

  render() {
    let responses = this.state.responseOrder;
    let inputs = this.state.inputs;
    let chart = this.state.chart;
    const pollId = this.props.pollId;
    const pollType = this.props.pollType;
    const prompt = this.props.prompt;
    const mode = this.props.mode;
    const collectTally = this.props.collectTally;
    const collectResponse = this.props.collectResponse;


    const showNav = () => {
      if (mode === 'results') {
        let barClass = 'fas fa-chart-bar';
        let pieClass = "fas fa-chart-pie";
        let textClass = "fas fa-table"

        if (chart === 'bar') {
          barClass += ' selected';
        } else if (chart === 'pie') {
          pieClass += ' selected';
        } else {
          textClass += ' selected';
        }

        return(
          <div className="d-flex justify-content-around mb-3">
            <i className={barClass} id="bar" onClick={ this.updateChart }></i>
            <i className={pieClass} id="pie" onClick={ this.updateChart }></i>
            <i className={textClass} id="text" onClick={ this.updateChart }></i>
          </div>
        ) // end return
      } // end if
    } // showNav


    const showPrompt = () => {
      if (mode === 'edit') {
        return (<div><input type="text" id="prompt" className="prompt-edit text-center" defaultValue={prompt} onBlur={this.updatePrompt} /></div>);
        
      } else {
        return (<h1 id="prompt" className="text-center">{prompt}</h1>);
      } // end if

    } // end showPrompt

    const showInputs = () => {
      return(
        <ul className="inputs">
        {inputs.map((value, index) => (
          <Input key={`input-${index}`} index={index} mode={mode} pollType={pollType} value={value} updateInput={this.updateInput} deleteInput={this.deleteInput} addResponse={this.addResponse}/>
        ))}
        </ul>
      );
    } // end showInputs

    const showResponses = () => {

      const SortableItem = SortableElement(({value}) =>
        <Response 
              key={ value.response_id } 
              id={ value.response_id }
              text={ value.text }
              mode='edit'
              value={ value.value }
              isVisible={ value.is_visible }
              pollId={ pollId }
              pollType={ pollType }
              cbDelete={ this.deleteResponse }
              cbUpdate={ this.updateResponseData } />
        
      ); // end SortableItem

      const SortableList = SortableContainer(({items}) => {
        if (pollType === 'ranked questions') {
          return(
            <ul className="responses mt-3">
              {items.map((value, index) => (
                <SortableItem key={`item-${index}`} index={index} value={value} />
              ))}
            </ul>
          );
        } else {
          return (
            <ol className="responses">
              {items.map((value, index) => (
                <SortableItem key={`item-${index}`} index={index} value={value} />
              ))}
            </ol>
          );
        }
      }); // end SortableList

      if (mode === 'edit') {
        return (
          <div className="w-100">
            <SortableList items={responses} onSortEnd={this.updateResponseOrder} />
          </div>);
        
      } else if (mode === 'respond') {
        let divClass = '';
        let olClass = 'responses';
        let type = 'ol';

        if (pollType === 'ranked questions') {
          divClass = 'card';
          olClass = olClass + ' list-group list-group-flush';
          type = 'ul'
        }

        return (
          <div className={divClass + ' w-100'}>
          <FlipMove 
            enterAnimation="accordionVertical" 
            leaveAnimation="accordionVertical"
            typeName={type} className={olClass}>
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
          </div>
        );
      } else if (mode === 'results') {
        return (
          <div className="border" id="legend">
          { showNav() }
          <table className="table table-sm">
          <FlipMove
            enterAnimation="accordionVertical" 
            leaveAnimation="accordionVertical"
            typeName="tbody" 
            > 
            {responses.map(response => (
              <Response 
                key={ response.response_id } 
                id={ response.response_id }
                index={ responses.indexOf(response) }
                mode={ mode }
                pollId={ pollId }
                text={ response.text }
                value={ response.value }
                />         
            ))}
          </FlipMove>
          </table>
          </div>
        );
      } // end if

    } // end showResponses

    const showAddInput = () => {
      if (mode === 'edit' && (this.props.pollType === 'select all' | this.props.pollType === 'multiple choice')) {
        return(
          <div className="add-input button">
            <button className="btn btn-lg btn-success btn-block" id="add-input" type="button" onClick={this.addInput}><i className="fas fa-plus"></i></button>
          </div>);
      }
    }; // end showAddInput

    const showSave = () => {
      if (mode === 'edit' && (this.props.pollType === 'select all' | this.props.pollType === 'multiple choice')) {
        return(
          <div className="save button">
            <button className="btn btn-block btn-success" type="button" id="save">Save</button>
            
          </div>);
      }
    }; // end showSave

    const showCharts = () => {    
      if (mode === 'results') {
        if (chart === 'bar') {
          return(<div id="chart" className="ml-auto mr-auto"><BarChart data={responses} /></div>);
        } else if (chart === 'pie') {
          return(<div id="chart" className="ml-auto mr-auto"><PieChart data={responses} /></div>);
        }
      }
    } // end showCharts

    const showSubmit = () => {
      if (mode === 'respond') {
        return(
          <div className="submit button">
            <button className="btn btn-lg btn-success btn-block" id="submit" type="button" onClick={this.createTallys}>Submit</button>
          </div>
        );
      }
    } // end showSubmit


    return(
      <div className="px-5 py-3" id="poll"> 
        

        { showPrompt() }

        { inputs.length > 0 && collectResponse === true && mode === 'respond' ? showInputs() : <div/> }
        
        <div className="d-flex flex-row mt-3">    
          { responses.length > 0 ? showCharts() : <div/> }

          { responses.length > 0 && collectTally === true ? showResponses() : <div/> }

        </div>
        
        { inputs.length > 0 && collectTally === true && mode === 'edit' ? showInputs() : <div/> }
        
        { showAddInput() }

        { showSave() }

        { collectResponse === false ? showSubmit() : <div/>}
        
      </div>
    );
    
  } // End of render

  componentWillUnmount() {
    console.log('componentWillUnmount')
  }

  componentDidUpdate() {
    console.log('componentDidUpdate')
  }

  componentDidMount() {
    let responses = this.state.responseData;
    let order = this.state.responseOrder;
    let mode = this.props.mode;
    const pollType = this.props.pollType;

  /* call socketio functions */
    onResponseCreation (
      (err, data) => {
        responses.set(data.response_id, data);
        order.push(responses.get(data.response_id));

        this.setState({ responseData : responses, responseOrder : order});

      }
    ); // end onResponseCreation
    
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

          if (pollType === 'ranked questions') {
            this.setState({ responseData : responses, responseOrder : order});
          } else {
            this.setState({ responseData : responses });
          }
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

    if ((mode === 'respond' | mode === 'edit') && this.props.collectResponse === true) {
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

        if (pollType === 'ranked questions') {
          order.sort((a, b) => b.value - a.value );
        }

        this.setState({ responseOrder: order, responseData: responses });
      });

  } // end componentDidMount

} // End of Poll

export default Poll;