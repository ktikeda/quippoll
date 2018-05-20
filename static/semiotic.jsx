// "use strict";
/* class-start*/
const { OrdinalFrame } = Semiotic;

const StaticData = [
  { response: "Red", tallys: 10}, // could be it's own response class
  { response: "Yellow", tallys: 5},
  { response: "Blue", tallys: 20}
];  

class Response extends React.Component {
  constructor(props) {
    super(props);

  } // end constructor

  render() {
    return <div>{this.props.text} : {this.props.value}</div>;
  } // end render

}

class Poll extends React.Component {
  constructor(props) {
      super(props);
      this.state = {prompt : null,
                    responseData: []
                    }; // end this.state
  } // end constructor

  render() {
        
    let responses = this.state.responseData;
    console.log(responses);
    
    return (
      <div>
        <h1>{this.state.prompt}</h1>
          {responses.sort((a, b) => a.order - b.order ).map(function(response){
            return <Response 
                      key={ response.response_id } 
                      order={response.order}
                      text={response.text} 
                      value={response.value} />;
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

      // result = {'response': response.text, 'response_id': response.response_id, 'val': response.value()}
      //subscribeNewResult((err, result) => this.setState({value})); // need to locate response and reassign value

      this.state = {
        chartData : [], //[{}, {}, {}]
        responses: null
      };

      this.onNewResult = this.onNewResult.bind(this);
    }

  onNewResult(x) {
    this.setState({ zipcode });
  }

  render() {
    const chartData = this.props.data; 
    return (<div>
    <OrdinalFrame
          //data={this.props.children}
          data={chartData}
          oAccessor={"text"}
          rAccessor={"value"}
          style={{ fill: "#00a2ce", stroke: "white" }}
          type={"bar"}
          // projection={"radial"}
          oLabel={true}
    />
    </div>);
  } // End of the render function

  componentDidMount() {
    fetch(window.location.href + '/data.json')
    .then(response => response.json())
    .then(data => this.setState({ chartData: data.responses }))
  }

} // End of the component


/* class-end */

/* main-start */

ReactDOM.render(
    <Poll >
        //{(result) => { result.then(rsp => console.log(rsp) ) }}

    </Poll>,
    document.getElementById("root")
);
/* main-end */