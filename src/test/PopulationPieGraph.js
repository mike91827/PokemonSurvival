import React, { Component } from 'react';

import CanvasJSReact from '@canvasjs/react-charts';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

class PopulationPieGraph extends Component {
  render() {
    const options = {
      animationEnabled: true,
      exportEnabled: true,
      theme: "dark2",
      title: {
        text: "Pokemon Environment"
      },
      data: [{
        type: "pie",
        indexLabel: "{label}: {y}",
        startAngle: -90,
        dataPoints: this.props.dataPoints || [{}] 
      }]
    };

    return (
      <div style={this.props.style}>
        <CanvasJSChart options={options} />
      </div>
    );
  }
}

export default PopulationPieGraph;
