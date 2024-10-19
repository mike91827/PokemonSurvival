import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { determineBattleOutcome } from '../PokemonBattleCalculation/PokemonBattleCalculation';
import PokemonSpecificData from '../PokemonSpecificData/PokemonBattleRecordGraph';
import WinRate from '../winRate/WinRateGraph';
import PopulationLineGraph from '../TwoLifeGrsaph/PokemonPopulationLineGraph';
import PopulationPieGraph from '../test/PopulationPieGraph';

const PokemonSimulation = () => {

  const [pokemonData, setPokemonData] = useState([]);

  // Represents all the pokemon currently in the population (dynamically updated)
  const [pokemonPopulation, setPokemonPopulation] = useState([]);
  const pokemonPopulationRef = useRef(pokemonPopulation)

  // Stores all the battles each pokemon had
  const [pokemonBattleRecord, setPokemonBattleRecord] = useState({});

  const [pokemonSelected, setPokemonSelected] = useState('');
  const [pokemonSelectedAmount, setPokemonSelectedAmount] = useState('');
  const [addButtonEnabled, setAddButtonEnabled] = useState(false);

  // Represents the chance for a pokemon to randomly die
  const [deathChance, setDeathChance] = useState(0.5)
  const deathChanceRef = useRef(deathChance)
  const [isFighting, setIsFighting] = useState(false);

  // Keeps track of past populations
  const [totalPopulation, setTotalPopulation] = useState({ "totalPopulation": [] });
  const totalPopulationRef = useRef(totalPopulation)

  const [timeToFight, setTimeToFight] = useState(100);
  const [intervalId, setIntervalId] = useState(null);

  // the pokemon the user selected to view specific data about
  const [selectedPokemonData, setSelectedPokemonData] = useState(null);

  // make sure both references are being updated
  useEffect(() => {
    deathChanceRef.current = deathChance
  }, [deathChance])

  useEffect(() => {
    pokemonPopulationRef.current = pokemonPopulation
  }, [pokemonPopulation])

  useEffect(() => {
    fetch('/pokemon.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (result) => {
            setPokemonData(result.data);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const fightIntervalRef = useRef(null);
  const populationIntervalRef = useRef(null);

  useEffect(() => {
    if (fightIntervalRef.current) {
      clearInterval(fightIntervalRef.current);
    }
    if (populationIntervalRef.current) {
      clearInterval(populationIntervalRef.current);
    }

    if (intervalId) {

      fightIntervalRef.current = setInterval(pokemonFight, timeToFight);
      populationIntervalRef.current = setInterval(updatePopulationRecord, 5000);

      return () => {
        clearInterval(fightIntervalRef.current);
        clearInterval(populationIntervalRef.current);
      };
    }
  }, [intervalId, timeToFight]);

  function generateRandomPopulation() {
    let pokemonName, randomAmount
    for (let i = 0; i < 10; i++) {
      let randomId = Math.floor(Math.random() * 800) + 1;
      let pokemon = pokemonData.find(pokemon => parseInt(pokemon['#'], 10) === randomId);
      if (pokemon) {
        pokemonName = pokemon.Name;
        randomAmount = Math.floor(Math.random() * 15) + 1;
        addPokemon(pokemonName, randomAmount);
      }
    }
  }

  function addPokemon(newPokemon, amount) {
    setPokemonPopulation(prevList => {
      // Checks if the pokemon has an existing battle record
      const existingPokemon = pokemonBattleRecord.hasOwnProperty(newPokemon);

      if (existingPokemon) {
        // If Pokémon exists, increase it's population by the inputted amount
        if (prevList.find(pokemon => pokemon.label === newPokemon)) {
          return prevList.map(pokemon => pokemon.label === newPokemon
            ? { ...pokemon, y: parseInt(pokemon.y, 10) + parseInt(amount, 10) }
            : pokemon
          );
        } else {
          // If it is not in the population but has an existing battle record, we add it to the population, but do not create a battle record for it
          let pokemonInfo = pokemonData.find(pokemon => pokemon['Name'] === newPokemon);
          return [...prevList, { label: newPokemon, y: parseInt(amount, 10), pokemonData: pokemonInfo }];
        }
      } else {
        // If Pokémon does not exist and has no battle record, we add it to the population and create a new battle record for it
        let pokemonInfo = pokemonData.find(pokemon => pokemon['Name'] === newPokemon);
        setPokemonBattleRecord(prevDict => ({ ...prevDict, [newPokemon]: { wins: [], lose: [], pokemonData: pokemonInfo } }));
        return [...prevList, { label: newPokemon, y: parseInt(amount, 10), pokemonData: pokemonInfo }];
      }
    });
  }

  function selectPokemonToAdd(e) {
    const value = e.target.value;
    setPokemonSelected(value);
    setAddButtonEnabled(value && pokemonSelectedAmount);
  }

  function selectAmountToAdd(e) {
    const value = e.target.value;
    if (!isNaN(value) && value !== '') {
      setPokemonSelectedAmount(value);
      setAddButtonEnabled(pokemonSelected && value);
    }
  }

  function addPokemonToPopulation() {
    if (addButtonEnabled) {
      addPokemon(pokemonSelected, pokemonSelectedAmount);
    }
  }

  function getRandomPokemon(population) {
    return population[Math.floor(Math.random() * population.length)];
  }

  function pokemonFight() {

    if (isFighting) {
      return;
    }

    if (pokemonPopulationRef.current.length <= 1) {
      return;
    }

    setIsFighting(true);

    let firstPokemon = getRandomPokemon(pokemonPopulationRef.current);
    let secondPokemon = getRandomPokemon(pokemonPopulationRef.current);

    //make sure there is at least one of each pokemon
    if (firstPokemon.y === 0 || secondPokemon.y === 0) {
      return;
    }
    // If the same pokemon were chosen to be the first and second pokemon, then the pokemon has a chance of reproducing or dieing
    // the chance of each is influenced by the death chance
    if (secondPokemon.label === firstPokemon.label) {
      setPokemonPopulation(prevPopulation => prevPopulation.map(pokemon => {
        if (pokemon.pokemonData.Name === firstPokemon.label) {
          const change = Math.random() < deathChanceRef.current ? -1 : 1;
          return { ...pokemon, y: pokemon.y + change };
        }
        return pokemon;
      })
      );
      return;
    }

    const { winner, loser } = determineBattleOutcome(firstPokemon.pokemonData, secondPokemon.pokemonData);

    // increase the winner population by 1 and reduce the loser population by 1
    setPokemonPopulation(prevPopulation => prevPopulation.map(pokemon => {
      if (pokemon.pokemonData === winner) {
        return { ...pokemon, y: pokemon.y + 1 };
      } else if (pokemon.pokemonData === loser) {
        return { ...pokemon, y: Math.max(0, pokemon.y - 1) };
      }
      return pokemon;
    }).filter(pokemon => pokemon.y > 0)
    );

    // update the battle records with this battle results
    setPokemonBattleRecord(prevDictionary => {
      const newDictionary = { ...prevDictionary };

      newDictionary[winner.Name].wins[loser.Name] =
        (newDictionary[winner.Name].wins[loser.Name] || 0) + 1;

      if (!(loser.Name in newDictionary[winner.Name].lose)) {
        newDictionary[winner.Name].lose[loser.Name] = 0;
      }

      newDictionary[loser.Name].lose[winner.Name] =
        (newDictionary[loser.Name].lose[winner.Name] || 0) + 1;

      if (!(winner.Name in newDictionary[loser.Name].wins)) {
        newDictionary[loser.Name].wins[winner.Name] = 0;
      }

      return newDictionary;
    });

    setIsFighting(false);
  }

  // updates the list that keeps track of past populations
  function updatePopulationRecord() {
    let currentPopulation = pokemonPopulationRef.current;
    let currentList = totalPopulationRef.current;
    let total = 0;
    let currentTotalPop = null;
    let date = new Date();
    const currentTime = date.getHours()
      + ':' + date.getMinutes()
      + ":" + date.getSeconds();

    for (let pokemon of currentPopulation) {
      total += pokemon.y;
    }

    for (let key in currentList) {
      // stores the total amount of pokemon that currently exists
      if (key === "totalPopulation") {
        currentTotalPop = currentList[key].slice();
        currentList[key].push({ y: total, label: currentTime });
      } else {
        for (let pokemon of currentPopulation) {
          if (pokemon.label === key) {
            // if pokemon goes extinct then gets brung back to life
            let currentLength = currentTotalPop.length - currentList[key].length;
            for (let i = 0; i < currentLength; i++) {
              currentList[key].push({ y: null, label: currentTime });
            }
            currentList[key].push({ y: pokemon.y, label: currentTime });
          }
        }
      }
    }

    for (let pokemon of currentPopulation) {
      if (!currentList.hasOwnProperty(pokemon.label)) {
        currentList[pokemon.label] = [];
        for (let i of currentTotalPop) {
          currentList[pokemon.label].push({ y: null, label: i.label });
        }
        currentList[pokemon.label].push({ y: pokemon.y, label: currentTime });
      }
    }

    setTotalPopulation(currentList);
  }

  function startAutomaticFight() {
    if (!intervalId) {
      setIntervalId(setInterval(() => { }, 100)); // dummy intervalId to trigger useEffect
    }
  }

  const stopAutomaticFight = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  function changeDeathChance(event) {
    setDeathChance(event.target.value);
  }

  function changeSimulationSpeed(event) {
    setTimeToFight(Number(event.target.value) * 100);
  }

  function viewPokemonData(pokemonName) {
    setSelectedPokemonData(pokemonBattleRecord[pokemonName]);
  }

  return (
    <div className="frontPage">
      <header style={{ flex: 1, textAlign: 'center', backgroundColor: 'red' }}>
        <h1>Pokemon - Survival of the Fittest</h1>
      </header>

      <div style={{ flex: 1, textAlign: 'center' }}>
        <div className='graphSection' style={{ display: 'flex', flexDirection: 'row' }}>

          <div className="controlPanel" style={{ flex: 1 }}>
            <section>
              <h2>Generate Pokémon Population:</h2>
              <button onClick={generateRandomPopulation}>Generate</button>
            </section>

            <section>
              <h2>Simulation Controls:</h2>
              <button onClick={startAutomaticFight}>Start Fighting</button>
              <button onClick={stopAutomaticFight}>Stop Fighting</button>
            </section>

            <section>
              <h2>Select Specific Pokémon To See Data:</h2>
              <select onChange={(event) => viewPokemonData(event.target.value)}>
                <option value="">--Choose a Pokémon--</option>
                {Object.keys(pokemonBattleRecord).map((pokemonName) => (
                  <option key={pokemonName} value={pokemonName}>
                    {pokemonName}
                  </option>
                ))}
              </select>
            </section>

            <section>
              <h2>Choose a Pokémon and Amount to Add</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={pokemonSelected} onChange={selectPokemonToAdd}>
                  <option value="">--Choose a Pokémon--</option>
                  {pokemonData.map((pokemon, index) => (
                    <option key={index} value={pokemon.Name}>
                      {pokemon.Name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={pokemonSelectedAmount}
                  onChange={selectAmountToAdd}
                  placeholder="Enter a number"
                />
              </div>
              <button onClick={addPokemonToPopulation} disabled={!addButtonEnabled}>Add Pokémon</button>
            </section>

            {/* <section>
              <h2>Adjust Simulation Speed</h2>
              <span>Fast</span>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={timeToFight / 100}
                onChange={changeSimulationSpeed}
              />
              <span>Slow</span>
            </section> */}

            <section>
              <h2>Adjust Chance of Death</h2>
              <span>100% Reproduction rate</span>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.01"
                value={deathChance}
                onChange={changeDeathChance}
              />
              <span>100% Death rate</span>
            </section>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>

            <PopulationPieGraph dataPoints={pokemonPopulation} style={{ flex: 1 }} />

            <div style={{ flex: 1 }}>
              <PopulationLineGraph totalPopulation={totalPopulation} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
              <div style={{ flex: 2 }}>
                {!selectedPokemonData ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      fontSize: '24px',
                      textAlign: 'center',
                    }}
                  >
                    Select a Pokémon to see their Data!
                  </div>
                ) : (
                  <div style={{ flex: 2 }}>
                    <PokemonSpecificData
                      winDataPoints={selectedPokemonData.wins}
                      loseDataPoints={selectedPokemonData.lose}
                      name={selectedPokemonData.pokemonData.Name}
                    />
                  </div>
                )}
              </div>

              {selectedPokemonData && (
                <div style={{ flex: 1 }}>
                  <WinRate
                    pokemon={selectedPokemonData}
                    pokemonList={pokemonBattleRecord}
                    name={selectedPokemonData.pokemonData.Name}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>


  );

};

export default PokemonSimulation;