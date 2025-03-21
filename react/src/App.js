import './App.css';
import React from 'react'
import { useState } from 'react'
import {useEffect} from 'react';
import Papa from "papaparse";
import axios from 'axios';
import "recharts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";




function App() {
  const [response, setResponse] = useState('')

  const [text, setText] = useState('')
  const [name, setName] = useState('')
  //years
  const [selectedYear, setSelectedYear] = useState(null)
  const years = Array.from({ length: 50 }, (_, i) => 2023 - i);
  //countries
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  // age groups
  const ageGroupCalls = [
    '0004', '0509', '1014', '1519', '2024', '2529',
    '3034', '3539', '4044', '4549', '5054', '5559',
    '6064', '6569', '7074', '7579', '80UP'
  ];
  const [imageSrc, setImageSrc] = useState("");
  // age labels
  const ageGroups = [
    "0-4",
    "5-9",
    "10-14",
    "15-19",
    "20-24",
    "25-29",
    "30-34",
    "35-39",
    "40-44",
    "45-49",
    "50-54",
    "55-59",
    "60-64",
    "65-69",
    "70-74",
    "75-79",
    "80+"
  ];

  //male data
  const [maleData, setMaleData] = useState({});
  const [maleTotal, setMaleTotal] = useState(null);

  //female data
  const [femaleData, setFemaleData] = useState({});
  const [femaleTotal, setFemaleTotal] = useState(null);

  const [loading, setLoading] = useState(false);

  // fetch csv data of countries and country codes
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.csv")
      .then((res) => res.text())
      .then((csvText) => {
        // Parse CSV using PapaParse
        Papa.parse(csvText, {
          header: true, // Treat the first row as headers
          skipEmptyLines: true,
          complete: (res) => {
            setCountries(res.data); // Store the parsed data
          },
        });
      })
      .catch((error) => console.error("Error fetching CSV:", error));

  }, []);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // get api calls
  const fetchPopulationData = async() => {
    try {
      setImageSrc("");
      const tempMaleData = {};
      const tempFemaleData = {};
      const yearIndex = 2023 - selectedYear

      setLoading(true);

      // male total population
      const resMaleTotal = await axios.get(`https://api.worldbank.org/v2/country/${selectedCountry}/indicator/SP.POP.TOTL.MA.IN?format=json`)
      const tempMaleTotal = resMaleTotal.data[1][yearIndex].value;
      // male population by group
      setMaleTotal(tempMaleTotal)
      
      
      // female total population
      const resFemaleTotal = await axios.get(`https://api.worldbank.org/v2/country/${selectedCountry}/indicator/SP.POP.TOTL.FE.IN?format=json`)
      const tempFemaleTotal = resFemaleTotal.data[1][yearIndex].value;
      // female population by group
      setFemaleTotal(tempFemaleTotal)
      for (const group of ageGroupCalls) {
        const resMale = await axios.get(`https://api.worldbank.org/v2/country/${selectedCountry}/indicator/SP.POP.${group}.MA.5Y?format=json`)
        const latestMaleData = resMale.data[1][yearIndex]
        tempMaleData[group] = latestMaleData.value / 100 * tempMaleTotal;
        const resFemale = await axios.get(`https://api.worldbank.org/v2/country/${selectedCountry}/indicator/SP.POP.${group}.FE.5Y?format=json`)
        const latestFemaleData = resFemale.data[1][yearIndex]
        tempFemaleData[group] = latestFemaleData.value / 100 * tempFemaleTotal;

        await delay(150);
      }
      setLoading(false);
      
      setMaleData(tempMaleData)
      setFemaleData(tempFemaleData)
      
      if (Object.keys(tempMaleData).length && Object.keys(tempFemaleData).length) {
        handleSubmit(tempMaleData, tempFemaleData);
      }
      
    } catch (error) {
      setResponse('Error in Population Call: ' + error);
    }

    
  };

  const handleSubmit = async (maleData, femaleData) => {
      // post to api
    const males_data = ageGroupCalls.map(age => maleData[age] || 0);
    const females_data = ageGroupCalls.map(age => femaleData[age] || 0);
    const countryName = countries.find(country => country["alpha-3"] === selectedCountry).name
    const requestData = { age_groups: ageGroups, males: males_data, females: females_data, country: countryName, year: selectedYear };
    console.log("Sending Data to Backend:", requestData);
    
    

    try {
      const response = await axios.post("http://localhost:4999/v1/api/generate-chart", requestData, {
        responseType: "blob", // Important to handle images!
      });

      const imageURL = URL.createObjectURL(response.data);
      setImageSrc(imageURL);
    } catch (error) {
      console.error("Error generating chart:", error);
    } 
  };
  
  


  return (
    <div className="App">


      <header className="App-header">
        <h2>Population Pyramid Generator</h2>

        <div className="request-box">
          <select id="country-select" value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
            <option value="">-- Choose a country --</option>
            {countries.map((country) => (<option key={country["alpha-3"]} value={country["alpha-3"]}>
              {country.name}
            </option>))}
          </select>

          <select id="year" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="">-- Select a year --</option>
            {years.map((year) => (<option key={year} value={year}>
              {year}
            </option>))}
          </select>

          <button onClick={fetchPopulationData} disabled={!selectedCountry || !selectedYear}>Generate</button>
          
          
        </div>

        <div>
          {/* Show Loading Spinner */}
          {loading && <p>Loading... Please wait ⏳</p>}

          {!loading && imageSrc && <img src={imageSrc} alt="Population Chart" />}

          
        </div>
        
        
        {/* <div>{response}</div> */}

      </header>
    </div>
  );
}

export default App;




  

  
  // const formatPopulationData = () => {
  //   const formattedData =  ageGroups.slice().reverse().map((group) => ({
  //     ageGroup: ageGroupMap[group],
  //     male: maleData[group] ? -Math.round(maleData[group]) : 0,
  //     female: femaleData[group] ? Math.round(femaleData[group]) : 0,
  //   }));

  //   console.log("Final Data: ", formattedData);
  //   return formattedData;
  // };

  



  // // Population Pyramid
  // const PopulationPyramid = ({data}) => {
  //   return (
  //     <ResponsiveContainer width="100%" height={450} minWidth={700}>
  //       <BarChart layout="vertical" data={data} margin={{left: 50, right:50}} barGap={0} >
  //         <XAxis type="number" domain={['auto', 'auto']} 
  //         tickFormatter={(value) => Math.abs(value)} //convert to million 
  //         label={{value: 'Population', position: 'bottom', offset: 0}}
  //         />
  //         <YAxis dataKey="ageGroup" type="category" />
  //         <Tooltip formatter={(value) => Math.abs(value).toLocaleString('en-US')} 
  //           labelFormatter={(label) => `Age Group: ${label}`}/>
  //         <Legend />

  //         {/* Male bar */}
  //         <Bar dataKey="male" fill="#4285F4" name="Male Population" />
  //         {/* Female bar */}
  //         <Bar dataKey="female" fill="#EA4335" name="Female Population" />


  //       </BarChart>
  //     </ResponsiveContainer>
  //   );
  // };