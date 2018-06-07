import React from "react";
import ReactDOM from "react-dom";

import {OrdinalFrame} from "semiotic";

export class BarChart extends React.Component {
  constructor(props) {
      super(props);
    }

  render() {
    const chartData = this.props.data; 

    const colorMap = [
      '#00a2ce',
      '#4d430c',
      '#b3331d',
      '#b6a756'
    ];

    return (<div>
    <OrdinalFrame
          data={chartData}
          oAccessor={"text"}
          rAccessor={"value"}
          style={d => ({ fill: colorMap[chartData.indexOf(d)], stroke: "white" })}
          type={"bar"}
          oLabel={true} />
    </div>);
  } // End of the render function

} // End of BarChart

export default BarChart;
