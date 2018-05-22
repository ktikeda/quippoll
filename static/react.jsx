// "use strict";
/* class-start*/
const { OrdinalFrame } = Semiotic;

class Response extends React.Component {
  constructor(props) {
    super(props);

    this.state = {text : "",
                  order: "",
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

    let data = {'order' : this.state.order, 
                'text' : this.state.text,
                'value' : this.state.value,
                'is_visible': this.state.isVisible};

    console.log(data);

    $.post('/response/' + this.props.id + '/data.json',
      data,
      () => console.log('Saved'));

    
  } // end sendText

  showSaved() {

  } // end showSaved

  render() {
    let mode = this.props.mode;
    let id = "response-opt-" + this.props.id;
    let text = this.state.text;
    let order = this.state.order;
    let value = this.state.value;
    let isVisible = this.state.isVisible;

    if (mode === 'respond') {
      return (<div><button className="response-option btn btn-primary btn-lg btn-block">{text}</button><br/></div>);
    } else if (mode === 'edit') {
      return (<div><input type="text" id={id} className="" value={text} onChange={this.handleChange} onBlur={this.sendText} /></div>);
    } else if (mode === 'results') {
      return (<div>{order}. {text} : {value}</div>);
    } // end if
  } // end render

  componentDidMount() {
    let resp = fetch('/response/' + this.props.id + '/data.json').then(data => data.json());

    resp.then( data => this.setState({ text: data.text }));
    resp.then( data => this.setState({ order: data.order }));
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
                  mode : 'edit'
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
    console.log(type);
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
      () => console.log('Saved'));

    
  } // end sendText

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


  render() {
    
    let responses = this.state.responseData;
    responses = responses.sort((a, b) => a.order - b.order );
    let mode = this.state.mode
    
    return(
      <div> 
        { this.showNav() }

        { this.showPrompt() }
            
          {responses.map(function(response){
            return <Response 
                      key={ response.response_id } 
                      id={ response.response_id } 
                      mode={ mode } />;
          })}
        
        { this.showResults(responses) }
        
      </div>);
    
  } // End of render

  componentDidMount() {
    let resp = fetch(window.location.href + '/data.json').then(response => response.json());

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

ReactDOM.render(
    <Poll id="1" />,
    document.getElementById("root")
);
/* main-end */