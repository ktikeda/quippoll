import React from "react";
import ReactDOM from "react-dom";

import {OrdinalFrame} from "semiotic";

export class BarChart extends React.Component {
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

export default BarChart;
