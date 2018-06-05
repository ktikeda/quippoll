import React from "react";
import ReactDOM from "react-dom";

import {OrdinalFrame} from "semiotic";

export class PieChart extends React.Component {
  constructor(props) {
      super(props);
    }

  render() {
    const chartData = this.props.data;
    console.log(chartData);

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

export default PieChart;