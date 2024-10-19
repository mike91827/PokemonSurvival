import React, { Component } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';

var CanvasJSChart = CanvasJSReact.CanvasJSChart;


class PopulationLineGraph extends Component {

	constructor(props) {
		super(props);
		this.state = {
			seeTotalPopulation: false,
		};
	}

	toggleTotalPopulation = () => {
		this.setState((prevState) => ({
			seeTotalPopulation: !prevState.seeTotalPopulation,
		}));
	};

	render() {

		const { totalPopulation, style } = this.props;
		const { seeTotalPopulation } = this.state; 
		const data = []

		for (let key in totalPopulation) {
			if (key === "totalPopulation") {
				if (!seeTotalPopulation) {
					data.push({
						name: "Total Population",
						showInLegend: true,
						dataPoints: totalPopulation[key]
					})
				}
			} else {
				data.push({
					type: "spline",
					name: key,
					showInLegend: true,
					dataPoints: totalPopulation[key]
				})
			}
		}
		const options = {
			animationEnabled: true,
			title: {
				text: "Total Population of Pokemon"
			},
			axisY: {
				title: "Number of Pokemon"
			},
			toolTip: {
				shared: true
			},
			data: data
		}

		return (
			<div style={{ style }}>

				<button onClick={this.toggleTotalPopulation}>
					{seeTotalPopulation ? "See Total Population" : "Hide Total Population"}
				</button>
				
				<CanvasJSChart options={options} />
			</div>
		);
	}
}

export default PopulationLineGraph;     