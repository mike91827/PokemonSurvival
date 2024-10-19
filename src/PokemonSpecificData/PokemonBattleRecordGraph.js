import React from 'react';
// @ts-ignore
import CanvasJSReact from '@canvasjs/react-charts';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const PokemonSpecificData = ({ winDataPoints, loseDataPoints, name }) => {

  function convertDictionaryToDataPoints(dictionary) {
    const dataPoints = [];

    for (const [pokemonName, data] of Object.entries(dictionary)) {

      dataPoints.push({ y: data, label: pokemonName });
    }
    return dataPoints;
  }

  const options = {
    animationEnabled: true,
    theme: "light2",
    title: {
      text: "Battle Record: " + name
    },
    axisX: {
      title: "Pokemon Fought",
    },
    axisY: {
      title: "# Won/Loss",
      includeZero: true,

    },

    toolTip: {
      shared: true
    },
    data: [{
      type: "bar",
      name: "# Won",
      dataPoints: convertDictionaryToDataPoints(winDataPoints)
    }, {
      type: "bar",
      name: "# Loss",
      dataPoints: convertDictionaryToDataPoints(loseDataPoints)
    }

    ]
  };

  return (
    <div>
      <CanvasJSChart options={options} />
    </div>
  );

};

export default PokemonSpecificData;
