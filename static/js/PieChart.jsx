import React from "react";
import ReactDOM from "react-dom";

import {OrdinalFrame} from "semiotic";

export class PieChart extends React.Component {
  constructor(props) {
      super(props);
    }

  render() {
    const chartData = this.props.data;
    const colorMap = [
      '#F04E48',
      '#FD8E4B',
      '#FDB548',
      '#1AAD8A',
      '#329ED0',
      '#127FB6',
      '#6A58BB'
    ];

    return (<div>
    <OrdinalFrame
          size={[540,400]}
          data={chartData}
          oAccessor={"text"}
          rAccessor={() => 1}
          dynamicColumnWidth={"value"}
          style={d => ({ fill: colorMap[chartData.indexOf(d)], stroke: "white" })}
          type={"bar"}
          projection={"radial"}
          oLabel={true} />
    </div>);
  } // End of the render function

} // End of PieChart

export default PieChart;