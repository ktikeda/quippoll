// "use strict";
/* class-start*/
const { OrdinalFrame } = Semiotic;

class Response extends React.Component {
  constructor(props) {
    super(props);

  } // end constructor

  render() {
    return (<div>{this.props.order}. {this.props.text} : {this.props.value}</div>)
  } // end render

}

class Poll extends React.Component {
  constructor(props) {
    super(props);
    this.state = {prompt : null,
                  responseData: []
                  };
    this.onNewResult = this.onNewResult.bind(this);
  } // end constructor

  onNewResult(x) {
    this.setState({ zipcode });
  }

  render() {
        
    let responses = this.state.responseData;
    console.log(responses);
    
    return (
      <div>
        <h1>{this.state.prompt}</h1>
          {responses.sort((a, b) => a.order - b.order ).map(function(response){
            return <Response 
                      key={ response.response_id } 
                      order={ response.order }
                      text={ response.text } 
                      value={ response.value } />;
          })}
        <Chart data={responses} />
      </div>

    ) // end of return
    
  } // End of render

  componentDidMount() {
    let resp = fetch(window.location.href + '/data.json').then(response => response.json());

    resp.then( data => this.setState({ prompt: data.prompt }));
    resp.then( data => this.setState({ responseData: data.responses }));
  } // end componentDidMount

} // End of Poll

class Chart extends React.Component {
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
          // projection={"radial"}
          oLabel={true} />
    </div>);
  } // End of the render function

} // End of Chart


/* class-end */

/* main-start */

ReactDOM.render(
    <Poll />,
    document.getElementById("root")
);
/* main-end */