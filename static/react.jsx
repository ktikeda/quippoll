// "use strict";
/* class-start*/
const { OrdinalFrame } = Semiotic;
const SortableContainer = SortableHOC.SortableContainer;
const SortableElement = SortableHOC.SortableElement;
const arrayMove = SortableHOC.arrayMove;

const SortableItem = SortableElement(({value}) =>
  <li><Response 
        key={ value.response_id } 
        id={ value.response_id } 
        mode='edit' />
  </li>
); // end SortableItem

const SortableList = SortableContainer(({items}) => {
  return (
    <ul>
      {items.map((value, index) => (
        <SortableItem key={`item-${index}`} index={index} value={value} />
      ))}
    </ul>
  );
}); // end SortableList

class Response extends React.Component {
  constructor(props) {
    super(props);

    this.state = {text : "",
                  value : "",
                  isVisible : "",
                  };

    this.sendText = this.sendText.bind(this);
    this.handleChange = this.handleChange.bind(this);

  } // end constructor

  handleChange(evt) {
    this.setState({ text : evt.target.value });
  } // sendText

  sendText(evt) {
    console.log(this.props.id);
    console.log(this.state.text);

    console.log(data);

    let data = {'text' : this.state.text,
                'value' : this.state.value,
                'is_visible': this.state.isVisible};

    console.log(data);

    $.post('/response/' + this.props.id + '/data.json',
      data,
      (resp) => console.log(resp));

    
  } // end sendText

  showSaved() {
    // implement save badge
  } // end showSaved

  render() {
    let mode = this.props.mode;
    let id = "response-opt-" + this.props.id;
    let text = this.state.text;
    let value = this.state.value;
    let isVisible = this.state.isVisible;

    if (mode === 'respond') {
      return (<div><button className="response-option btn btn-primary btn-lg btn-block">{text}</button><br/></div>);
    } else if (mode === 'edit') {
      return (<input type="text" id={id} className="" value={text} onChange={this.handleChange} onBlur={this.sendText} />);
    } else if (mode === 'results') {
      return (<div>{text} : {value}</div>);
    } // end if
  } // end render

  componentDidMount() {
    let resp = fetch('/response/' + this.props.id + '/data.json').then(data => data.json());

    resp.then( data => this.setState({ text: data.text }));
    resp.then( data => this.setState({ value: data.value }));
    resp.then( data => this.setState({ isVisible: data.is_visible }));
  
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

    this.setChart = this.setChart.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.sendPrompt = this.sendPrompt.bind(this);

    onNewResult(this.props.id, 
      (err, data) => {
        this.setState({ responseData : data.responses })
        this.setState({ prompt : data.prompt })
    }); // end onNewResult

  } // end constructor

  setChart(evt) {
    let type = evt.target.id;
    this.setState({chart : type});
  } // end setChart

  handleChange(evt) {
    this.setState({ prompt : evt.target.value });
  } // end handleChange

  sendPrompt(evt) {

    let data = {'prompt' : this.state.prompt};

    console.log(data);

    $.post('/poll/' + this.props.id + '/settings',
      data,
      (resp) => console.log(resp));
   
  } // end sendPrompt

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
    console.log(responses);
    console.log(chart);
    
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
      return (<div><input type="text" id={id} className="" value={prompt} onChange={this.handleChange} onBlur={this.sendPrompt} /></div>);
      
    } else {
      return (<h1>{prompt}</h1>);
    } // end if

  } // end showPrompt

  showResponses(responses) {

    if (this.state.mode === 'edit') {
      return (<SortableList items={responses} onSortEnd={this.onSortEnd} />);
      
    } else {
      return (<div> {responses.map(function(response){
            return <Response 
                      key={ response.response_id } 
                      id={ response.response_id } 
                      mode='results' />;
          })}</div>);
    } // end if

  } // end showResponses


  onSortEnd = ({oldIndex, newIndex}, evt) => {
    // send new index to server, server return json with response order data
    console.log(oldIndex);
    console.log(newIndex);
    console.log(evt);

    this.setState({
      responseData: arrayMove(this.state.responseData, oldIndex, newIndex),
    });

    console.log(this.state.responseData);
    // get data of response moved. How can I grab this. Can I look it up by index???

    // let resp = fetch(window.location.href + '/data.json').then(resp => resp.json());
    // resp.then( data => this.setState({ responseData: data.responses }));
    // resp.then( data => this.setState({ items: data.responses }));
    // });
  };  


  render() {
    
    let responses = this.state.responseData;
    //responses = responses.sort((a, b) => a.order - b.order );
    console.log(responses);
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
    let resp = fetch(window.location.href + '/data.json').then(resp => resp.json());

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