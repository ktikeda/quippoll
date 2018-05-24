// "use strict";
/* class-start*/
const { OrdinalFrame } = Semiotic;
const SortableContainer = SortableHOC.SortableContainer;
const SortableElement = SortableHOC.SortableElement;
const arrayMove = SortableHOC.arrayMove;



class Response extends React.Component {
  constructor(props) {
    super(props);

    this.state = {text : "",
                  isVisible : "",
                  };

    //this.sendText = this.sendText.bind(this);
    this.passChange = this.passChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.passUpdate = this.passUpdate.bind(this);
    this.passDeletion = this.passDeletion.bind(this);

  } // end constructor

  handleChange(evt) {
    this.setState({ text : evt.target.value });
  } // handleChange

  // sendText(evt) {

  //   let data = {'text' : this.state.text,
  //               'value' : this.state.value,
  //               'is_visible': this.state.isVisible};

  //   $.post('/api/responses/' + this.props.id,
  //     data,
  //     (resp) => console.log(resp));

    
  // } // end sendText
  passChange(evt) {

    let data = {'id' : this.props.id,
                'text' : evt.target.value };

    this.props.cbChange(data);
  } 


  passUpdate(evt) {

    let data = {'text' : this.state.text};

    this.props.cbUpdate(data);
  } 

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
      return (<div><label>{weight}. </label><input type="text" id={id} className="" value={text} onChange={this.passChange} onBlur={this.sendText} />
              <button className="" type="button" onClick={this.passDeletion}>Delete</button>
              </div>);
    } else if (mode === 'results') {
      return (<div>{text} : {value}</div>);
    } // end if
  } // end render

  componentDidMount() {
    let resp = fetch('/api/polls/' + this.props.pollId + '/responses/' + this.props.id).then(data => data.json());

    resp.then( data => this.setState({ text: data.text }));
  //   resp.then( data => this.setState({ value: data.value }));
  //   resp.then( data => this.setState({ isVisible: data.is_visible }));
  
  } // end componentDidMount

}

class Poll extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
                  prompt : "",
                  responseData: [],
                  chart : 'text',
                  mode : 'edit',
                  items : ""
                  };

    this.setObjectByPath = this.setObjectByPath.bind(this);
    this.setChart = this.setChart.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.updatePrompt = this.updatePrompt.bind(this);
    this.handleOptionAdd = this.handleOptionAdd.bind(this);
    this.getDeletion = this.getDeletion.bind(this);
    this.getUpdate = this.getUpdate.bind(this);
    this.getChange = this.getChange.bind(this);

    onNewResult(this.props.id, 
      (err, data) => {
        this.setState({ responseData : data.responses })
        this.setState({ prompt : data.prompt })
    }); // end onNewResult

  } // end constructor

  // util by https://itnext.io/updating-properties-of-an-object-in-react-state-af6260d8e9f5
  setObjectByPath(fieldPath, value) {
    this.setState({
      responseData: R.set(R.lensPath(fieldPath), value, this.state.responseData)
    })
  }

  setChart(evt) {
    let type = evt.target.id;
    this.setState({chart : type});
  } // end setChart

  handleChange(evt) {
    this.setState({ prompt : evt.target.value });
  } // end handleChange

  updatePrompt(evt) {

    let data = {'prompt' : this.state.prompt};

    $.post('/api/polls/' + this.props.id,
      data,
      resp => console.log(resp)
    );
   
  } // end updatePrompt

  onSortEnd = ({oldIndex, newIndex}, evt) => {
    // send new index to server, server return json with response weight data

    function assignWeight(array, index) {
      // take an array of objects and assigns object.weight based on the object's position in the array.
      let prevWeight = 0;
      let nextWeight = 0;
      let length = array.length;

      if (length === 1) {
        
        return array;

      } else if (index === 0) {
        
        nextWeight = array[index+1].weight;

      } else if (index === length-1) {
        
        // weight should be greater than prevWeight
        prevWeight = array[index-1].weight;
        

      } else {
        prevWeight = array[index-1].weight;
        nextWeight = array[index+1].weight;

        

      }
      let weight = (prevWeight + nextWeight) / 2.0;

      array[index].weight = weight;

      return array;

    } // end assignweight

    this.setState({
      responseData: arrayMove(this.state.responseData, oldIndex, newIndex),
    });

    let responses = this.state.responseData;

    for (let response of responses) {

      $.post('/api/polls/' + this.props.id + '/responses/' + response.response_id,
        response,
        (resp) => console.log(resp));
    } // end for

  }; // end onSortEnd

  getDeletion(response) {
    /* get response send response to be deleted to server
       change responseData on state */
    let url = '/api/polls/' + this.props.id + '/responses/' + response.response_id;
    console.log(url);

    $.ajax({
      url: '/api/polls/' + this.props.id + '/responses/' + response.response_id,
      type: 'delete',
      success: (resp) => {
        console.log(resp.status);
        fetch('/api/polls/' + this.props.id + '/responses')
        .then(resp => resp.json())
        .then(data => this.setState({responseData: data.response_data}));
      }
    }); // end $.ajax

  } // end getDeletion

  getUpdate(response) {
    /* get updated response, send to server
       server send back new responseData
       change responseData on state */

  } // end getUpdate

  getChange(data) {
    /* update responseData state */
    let responses = this.state.responseData;
    console.log('getChange');
    console.log(data)

    for (let response of responses) {
      if (response.response_id === data.id) {
        response.text = data.text
      }

    console.log(responses);
    this.setState({responseData : responses});

    }

  } // end getChange

  handleOptionAdd(evt) {
    //update poll options and reset options to an empty string
    let _data = {responseData : [{'text' : '',
                               'weight' : this.state.responseData.length + 1}]};

    $.ajax({ 
      url: '/api/polls/' + this.props.id + '/responses',
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

  showNav() {
    if (this.state.mode === 'results') {

      return (
        <div>
          <button id="pie" onClick={ this.setChart }><i className="fas fa-chart-pie"></i></button>
          <button id="bar" onClick={ this.setChart }><i className="fas fa-chart-bar"></i></button>
          <button id="text" onClick={ this.setChart }><i className="fas fa-font"></i></button>
        </div>
      ) // end return
    } // end if
  } // showNav

  showResults(responses) {
    
    let chart = this.state.chart;
    
    if (this.state.mode === 'results') {

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

      return(<p>{this.state.mode}</p>);

    } // end if
  } // end showResults

  showPrompt() {
    
    let id = this.props.id;
    let prompt = this.state.prompt;

    if (this.state.mode === 'edit') {
      return (<div><input type="text" id={id} className="" value={prompt} onChange={this.handleChange} onBlur={this.updatePrompt} /></div>);
      
    } else {
      return (<h1>{prompt}</h1>);
    } // end if

  } // end showPrompt

  showResponses(responses) {

    let mode = this.state.mode;

    const SortableItem = SortableElement(({value}) =>
      <li><Response 
            key={ value.response_id } 
            id={ value.response_id }
            weight={ value.weight } 
            mode='edit' 
            text={ value.text }
            isVisible={ value.is_visible }
            pollId={ this.props.id }
            cbDelete={ this.getDeletion }
            cbUpdate={ this.getUpdate }
            cbChange={ this.getChange } />
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


    if (this.state.mode === 'edit') {
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
                      weight={ response.weight }
                      text={ response.text }
                      value={ response.value } /></li>;
          })}</ol></div>);
    } // end if

  } // end showResponses





  render() {
    
    let responses = this.state.responseData;
    //responses = responses.sort((a, b) => a.weight - b.weight );
    let mode = this.state.mode

    return(
      <div> 
        { this.showNav() }

        { this.showPrompt() }
            
        { this.showResponses(responses) }
        
        { this.showResults(responses) }
        
      </div>);
    
  } // End of render

  componentDidMount() {
    let resp = fetch('/api/polls/' + this.props.id).then(resp => resp.json());

    resp.then( data => this.setState({ id: data.poll_id }));
    resp.then( data => this.setState({ prompt: data.prompt }));
    resp.then( data => this.setState({ responseData: data.responses }));
  
  } // end componentDidMount

} // End of Poll

class BarChart extends React.Component {
  constructor(props) {
      super(props);
    }

  render() {
    const chartData = this.props.data; 

    return (<div>
    <OrdinalFrame
          data={chartData}
          oAccessor={"text"}
          rAccessor={"value"}
          style={{ fill: "#00a2ce", stroke: "white" }}
          type={"bar"}
          oLabel={true} />
    </div>);
  } // End of the render function

} // End of BarChart

class PieChart extends React.Component {
  constructor(props) {
      super(props);
    }

  render() {
    const chartData = this.props.data; 

    return (<div>
    <OrdinalFrame
          data={chartData}
          oAccessor={"text"}
          rAccessor={() => 1}
          dynamicColumnWidth={"value"}
          style={{ fill: "#00a2ce", stroke: "white" }}
          type={"bar"}
          projection={"radial"}
          oLabel={true} />
    </div>);
  } // End of the render function

} // End of PieChart


/* class-end */

/* main-start */

// add flag, document.cookie.isadmin in vanilla js
ReactDOM.render(
    <Poll id="1" />,
    document.getElementById("root")
);
/* main-end */