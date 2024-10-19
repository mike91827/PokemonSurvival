import Papa from 'papaparse';

let typeAdvantageChart = {};

async function loadTypeAdvantageData() {
  if (Object.keys(typeAdvantageChart).length === 0) { // Check if data is already loaded
    const response = await fetch('/typeAdvantage.csv');
    const csvText = await response.text();
    const parsedData = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    }).data;

    parsedData.forEach(row => {
      const attackingType = row.Attacking;
      typeAdvantageChart[attackingType] = {};

      Object.keys(row).forEach(defendingType => {
        if (defendingType !== 'Attacking') {
          typeAdvantageChart[attackingType][defendingType] = parseFloat(row[defendingType]);
        }
      });
    });
  }
}

loadTypeAdvantageData();

function calculateBaseStrength(pokemon) {
  return (
    parseInt(pokemon.HP, 10) +
    parseInt(pokemon.Attack, 10) +
    parseInt(pokemon.Defense, 10) +
    parseInt(pokemon.Speed, 10) +
    parseInt(pokemon['Sp. Atk'], 10) +
    parseInt(pokemon['Sp. Def'], 10)
  );
}

// Checks how effective type1 is against type2
function getTypeMultiplier(type1, type2) {
  if (type1 === '' || type2 === '') {
    return 1;
  } else {
    if (typeAdvantageChart[type1][type2] === 0) {
      return 0.3;
    } else {
      return typeAdvantageChart[type1][type2];
    }

  }
}


export function calculateWinProbability(pokemon1, pokemon2) {
  const baseStrength1 = calculateBaseStrength(pokemon1)
    * getTypeMultiplier(pokemon1["Type 1"], pokemon2["Type 1"])
    * getTypeMultiplier(pokemon1["Type 1"], pokemon2["Type 2"])
    * getTypeMultiplier(pokemon1["Type 2"], pokemon2["Type 1"])
    * getTypeMultiplier(pokemon1["Type 2"], pokemon2["Type 2"]);

  const baseStrength2 = calculateBaseStrength(pokemon2)
    * getTypeMultiplier(pokemon2["Type 1"], pokemon1["Type 1"])
    * getTypeMultiplier(pokemon2["Type 1"], pokemon1["Type 2"])
    * getTypeMultiplier(pokemon2["Type 2"], pokemon1["Type 1"])
    * getTypeMultiplier(pokemon2["Type 2"], pokemon1["Type 2"]);

  const totalStrength = baseStrength1 + baseStrength2;
  const pokemon1WinChance = (baseStrength1 / totalStrength) * 100;

  return Math.floor(pokemon1WinChance);
}

export function determineBattleOutcome(pokemon1, pokemon2) {
  let oneWinChange = calculateWinProbability(pokemon1, pokemon2);
  const randomValue = Math.floor(Math.random() * 100) + 1;
 
  if (randomValue <= oneWinChange) {
    return { winner: pokemon1, loser: pokemon2 };
  } else {
    return { winner: pokemon2, loser: pokemon1 };
  }
}

