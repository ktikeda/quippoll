// "use strict";
/* class-start*/
const { OrdinalFrame } = Semiotic;

class Response extends React.Component {
  constructor(props) {
    super(props);

  } // end constructor



  render() {
    let mode = this.props.mode

    if (mode === 'respond') {
      return (<div><button className="response-option btn btn-primary btn-lg btn-block">{this.props.text}</button></div>);
    } else if (mode === 'results') {
      return (<div>{this.props.order}. {this.props.text} : {this.props.value}</div>);
    } // end if
  } // end render

}

class Poll extends React.Component {
  constructor(props) {
    super(props);
    this.state = {id : null,
                  prompt : null,
                  responseData: [],
                  chart : 'text',
                  mode : 'respond'
                  };

    this.setChart = this.setChart.bind(this);
    //this.showResults = this.showResults.bind(this);

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
  }

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


  render() {
    let responses = this.state.responseData;
    responses = responses.sort((a, b) => a.order - b.order );
    let mode = this.state.mode
    
    return(
      <div> 
        { this.showNav() }

        <h1>{this.state.prompt}</h1>
            
          {responses.map(function(response){
            return <Response 
                      key={ response.response_id } 
                      order={ response.order }
                      text={ response.text } 
                      value={ response.value }
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