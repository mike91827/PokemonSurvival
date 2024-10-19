import React, { Component } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import { calculateWinProbability } from '../PokemonBattleCalculation/PokemonBattleCalculation';
 
var CanvasJSChart = CanvasJSReact.CanvasJSChart;
class WinRate extends Component {

	render() {
        const { pokemon, pokemonList, name} = this.props;
     
        let dataPoints = []
        for (let i in pokemonList)
        {
            dataPoints.push({y: calculateWinProbability(pokemon.pokemonData,pokemonList[i].pokemonData), label: i})
        }
		const options = {
			animationEnabled: true,
			theme: "light2",
			title:{
				text: name + " Chance to Win"
			},
			axisX: {
				title: "Pokemon Fighting",
				reversed: true,
			},
			axisY: {
				title: "Percentage to Win",
				includeZero: true,
				labelFormatter: this.addSymbols
			},
			data: [{
				type: "bar",
				dataPoints: dataPoints
			}]
		}
		return (
		<div>
			<CanvasJSChart options = {options}
			/>
		</div>
		);
	}
	addSymbols(e){
		return e.value+"%"
	}
}
export default WinRate;      