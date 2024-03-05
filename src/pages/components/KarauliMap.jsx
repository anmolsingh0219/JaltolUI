import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { saveAs } from 'file-saver';
import InfoPanel from './InfoPanel';

const { BaseLayer, Overlay } = LayersControl;
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// const API_BASE_URL = 'http://127.0.0.1:8000/api/';
const API_BASE_URL = 'https://jaltol.app/api/';

const initialMapCenter = [22.3511148, 78.6677428]; // Latitude and longitude of India's geographical center
const initialMapZoom = 5; // Zoom level for showing the entire country

function FlyToDistrict({ districtGeometry }) {
  const map = useMap();

  useEffect(() => {
    if (districtGeometry) {
      const bounds = districtGeometry.getBounds();
      map.flyToBounds(bounds, { padding: [50, 50] });
    }
  }, [districtGeometry, map]);

  return null;
}

FlyToDistrict.propTypes = {
  districtGeometry: PropTypes.shape({
    getBounds: PropTypes.func.isRequired,
  }),
};

function FlyToVillage({ villageGeometry }) {
  const map = useMap();

  useEffect(() => {
    if (villageGeometry) {
      const bounds = villageGeometry.getBounds();
      map.flyToBounds(bounds, { padding: [50, 50] });
    }
  }, [villageGeometry, map]);

  return null;
}

FlyToVillage.propTypes = {
  villageGeometry: PropTypes.shape({
    getBounds: PropTypes.func.isRequired,
  }),
};

const districtDisplayNames = {
  'anantapur': 'Anantapur, AP',
  'dhamtari': 'Dhamtari, CG',
  'uttar bastar kanker': 'Kanker, CG',
  'karauli': 'Karauli, RJ',
  'koppal': 'Koppal, KA',
  'thane': 'Palghar, MH',
  'raichur': 'Raichur, KA',
};


const datasetDisplayNames = {
  'Single cropping cropland': 'Single Cropland',
  'Double cropping cropland': 'Double Cropland',
};

const KarauliMap = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [selectedVillageGeometry, setSelectedVillageGeometry] = useState(null);
  const [rasterUrl, setRasterUrl] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [precipitationData, setPrecipitationData] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  // const [districtsGeoJSON, setDistrictsGeoJSON] = useState({});
  const [selectedDistrictGeometry, setSelectedDistrictGeometry] = useState(null);
  const [geoJsonKey, setGeoJsonKey] = useState(Math.random());

  const [carbonUrl, setCarbonUrl] = useState(null);
  const [slopeUrl, setSlopeUrl] = useState(null);

  
  const [visibleDataSets, setVisibleDataSets] = useState({
    // 'Background': true,
    // 'Built-up': true,
    // 'Water in Kharif': true,
    // 'Water in Kharif+Rabi': true,
    // 'Water in Kharif+Rabi+Zaid':  true,
    // 'Tree/Forests': true,
    // 'Barrenlands': true,
    // 'Single cropping cropland': true,
    'Single cropping cropland': true,
    // 'Single Non-Kharif cropping cropland': true,
    // 'Double cropping cropland': true,
    'Double cropping cropland': true,
    // 'Triple cropping cropland': true,
    // 'Shrub_Scrub': true,
    'Precipitation': true,
  });

  const categoryColors = {
  // 'Background': '#b2df8a', // Assuming these match the order of your 'palette'
  // 'Built-up': '#6382ff',
  // 'Water in Kharif': '#d7191c',
  // 'Water in Kharif+Rabi': '#f5ff8b',
  // 'Water in Kharif+Rabi+Zaid': '#dcaa68',
  'Tree/Forests': '#397d49',
  // 'Barrenlands': '#50c361',
  'Single cropping cropland': '#8b9dc3', // Adjusted based on your message, seems like a mismatch
  // 'Single Non-Kharif cropping cropland': '#dac190',
  'Double cropping cropland': '#222f5b',
  // 'Triple cropping cropland': '#38c5f9',
  'Shrub_Scrub': '#946b2d',
  };

  const handleDistrictChange = (event) => {
    const selectedValue = event.target.value;
    const selectedOption = districts.find(option => districtDisplayNames[option.value] === selectedValue);
    setSelectedDistrict(selectedOption || '');
  };

  const fetchGeoJsonData = (districtValue) => {
    axios.get(`${API_BASE_URL}karauli_villages_geojson/${districtValue}/`)
      .then(response => {
        setGeoJsonData(response.data);
        const bounds = L.geoJSON(response.data).getBounds();
        setSelectedDistrictGeometry({ getBounds: () => bounds });
        setGeoJsonKey(Math.random()); // Set a new key to force re-render the GeoJSON
      })
      .catch(error => {
        console.error('Error fetching GeoJSON data for district:', error);
      });
  };

  // Function to fetch raster data
  const fetchRasterData = (districtValue) => {
    axios.get(`${API_BASE_URL}get_karauli_raster/${districtValue}/`)
      .then(response => {
        setRasterUrl(response.data.tiles_url);
      })
      .catch(error => {
        console.error('Error fetching raster data:', error);
      });
  };

  const fetchCarbonData = (districtValue) => {
    axios.get(`${API_BASE_URL}get_district_carbon/${districtValue}/`)
      .then(response => {
        setCarbonUrl(response.data.tiles_url);
      })
      .catch(error => {
        console.error('Error fetching carbon data:', error);
      });
  };

  const fetchSlopeData = (districtValue) => {
    axios.get(`${API_BASE_URL}get_district_slope/${districtValue}/`)
      .then(response => {
        setSlopeUrl(response.data.tiles_url);
      })
      .catch(error => {
        console.error('Error fetching carbon data:', error);
      });
  };

  useEffect(() => {
    // Fetch districts for dropdown
    axios.get(`${API_BASE_URL}list_districts/`)
      .then(response => {
        // Check if the 'districts' key exists in the response data
        if (response.data && Array.isArray(response.data.districts)) {
          // Map over the array from the 'districts' key
          const districtOptions = response.data.districts.map(district => ({ value: district }));
          setDistricts(districtOptions);
        } else {
          // Handle the case where 'districts' is not in the expected format
          console.error('Unexpected format for districts:', response.data);
        }
      })
      .catch(error => console.error('Error fetching districts:', error));
  }, []);

  useEffect(() => {
    if (selectedDistrict && selectedDistrict.value) {
      // Use the actual district value (without state code) to fetch data
      const districtValue = selectedDistrict.value.split(',')[0].trim().toLowerCase();
      fetchGeoJsonData(districtValue);
      fetchRasterData(districtValue);
      fetchCarbonData(districtValue);
      fetchSlopeData(districtValue);
    }
  }, [selectedDistrict]);

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

  const Legend = () => {
    const map = useMap();
  
    useEffect(() => {
      const legend = L.control({ position: "bottomright" });
  
      legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        const categories = Object.keys(categoryColors);
        let labels = ['<div style="text-align: center; margin-bottom: 5px; color: black;"><strong>Legend</strong></div>'];
  
        // Add a flex container for each legend item
        categories.forEach((category) => {
          labels.push(
            '<div class="legend-item" style="display: flex; align-items: center; margin-bottom: 4px; color: black;">' +
            `<div style="background:${categoryColors[category]}; width: 18px; height: 18px; margin-right: 8px;"></div>` +
            `<span style="flex-grow: 1;">${category}</span>` +
            '</div>'
          );
        });
  
        div.innerHTML = labels.join('');
        div.style.backgroundColor = 'rgba(255, 255, 255, 1)'; // semi-transparent white background
        div.style.padding = '6px';
        div.style.borderRadius = '4px';
        div.style.maxWidth = '250px'; // Adjust width as necessary
        div.style.marginBottom = '20px';
        return div;
      };
  
      legend.addTo(map);
  
      return () => map.removeControl(legend);
    }, [map]);
  
    return null;
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        if (selectedVillage && feature.properties.village_na === selectedVillage.village_na) {
          // Deselect and reselect the village to force an update
          setSelectedVillage(null);
          setTimeout(() => setSelectedVillage(feature.properties), 10);
        } else {
          setSelectedVillage(feature.properties);
        }
        setSelectedVillageGeometry(layer);
        setLoading(true);
  
        // Fetch the area change data and precipitation data for the selected village
        Promise.all([
          axios.get(`${API_BASE_URL}area_change/${selectedDistrict.value}/${feature.properties.village_na}/`),
          axios.get(`${API_BASE_URL}rainfall_data/${selectedDistrict.value}/${feature.properties.village_na}/`)
        ]).then(([areaChangeResponse, rainfallResponse]) => {
          setTimeSeriesData(areaChangeResponse.data);
          setPrecipitationData(rainfallResponse.data.rainfall_data);
        }).catch(error => {
          console.error('Error fetching data:', error);
        }).finally(() => {
          setLoading(false);
        });
      },
    });
  };

  const vectorStyle = {
    color: '#3388ff',
    weight: 1,
    opacity: 1,
    fillColor: '#3388ff',
    fillOpacity: 0.2,
  };

  
  const toggleDataSetVisibility = (category) => {
    setVisibleDataSets(prevState => ({ ...prevState, [category]: !prevState[category] }));
  };  

  const landCoverChartData = timeSeriesData ? {
    labels: Object.keys(timeSeriesData),
    datasets: Object.entries(timeSeriesData['2014'] ?? {}).reduce((datasets, [category]) => {
      if (visibleDataSets[category]) {
        datasets.push({
          label: datasetDisplayNames[category],
          data: Object.values(timeSeriesData).map(yearData => yearData[category]),
          fill: false,
          borderColor: categoryColors[category],
          tension: 0.1,
        });
      }
      return datasets;
    }, []),
  } : { labels: [], datasets: [] }; // Initialize as an object with empty properties

  // Prepare your chart data for precipitation
  const precipitationChartData = {
    labels: precipitationData?.map(item => item[0]) ?? [],
    datasets: precipitationData ? [{
      label: 'Precipitation (mm)',
      data: precipitationData.map(item => item[1]),
      fill: false,
      borderColor: '#3498db',
      borderDash: [5, 5], // Color for precipitation data line
      yAxisID: 'y1',
      tension: 0.1,
    }] : [] // Initialize as an empty array if precipitationData is not available
  };

  // Combine the land cover and precipitation chart data
  const combinedChartData = {
    labels: precipitationChartData.labels.length ? precipitationChartData.labels : landCoverChartData.labels,
    datasets: [
      ...landCoverChartData.datasets,
      visibleDataSets['Precipitation'] ? precipitationChartData.datasets : []
    ].flat() // Use .flat() to remove any empty arrays that may result from the ternary operation
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'black', // Y-axis labels color
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)', // Y-axis grid line color
        },
        title: {
          display: true,
          text: 'Area (ha)',
        },
      },
      y1: {
        // New y-axis for precipitation data...
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false, // Only show the grid lines for this axis
        },
        title: {
          display: true,
          text: 'Precipitation (mm)',
        },},
      x: {
        ticks: {
          color: 'black', // X-axis labels color
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)', // X-axis grid line color
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'black' // Legend labels color
        }
      },
      title: {
        display: true,
        text: 'Land Cover Change Over Time', // Add your desired title here
        color: 'black',
        font: {
          size: 18 // Adjust the size as needed
        } },
    },
    layout: {
      padding: { // Add padding around the chart
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      }
    },
    responsive: true,
    maintainAspectRatio: true,
    aspectratio: 3,
    elements: {
      point: {
        radius: 5, // Adjust the point size
      },
      line: {
        borderWidth: 3, // Adjust the line thickness
      }
    },
    backgroundColor: 'white', // Set background color
  };


  // Function to merge time series data and precipitation data
const mergeDataForCSV = (timeSeriesData, precipitationData,population) => {
  const mergedData = Object.keys(timeSeriesData).map((year, index) => {
    const singleCropping = timeSeriesData[year]['Single cropping cropland'] || 0;
    const doubleCropping = timeSeriesData[year]['Double cropping cropland'] || 0;
    const precipitation = precipitationData.find(item => item[0] === year)?.[1] || 0;
    const populationData = index === 0 ? population : "";
    return {
      Year: year,
      'Single Cropland (ha)': singleCropping,
      'Double Cropland (ha)': doubleCropping,
      'Precipitation (mm)': precipitation,
      'Population': populationData,
    };
  });
  return mergedData;
};

// Function to convert merged data to CSV string
const convertToCSV = (mergedData) => {
  const headers = Object.keys(mergedData[0]).join(',') + '\r\n';
  const rows = mergedData.map(row => Object.values(row).join(',')).join('\r\n');
  return headers + rows;
};

// Function to trigger the download of CSV
const downloadCSV = (mergedData) => {
  if (!mergedData || mergedData.length === 0) {
    alert('No data available to download');
    return;
  }

  const csvData = convertToCSV(mergedData);
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  
  // Create a file name using the village name, replacing spaces with underscores
  const fileName = `${selectedDistrict.value.replace(/\s+/g, '_')}_${selectedVillage.village_na}_data.csv`;

  saveAs(blob, fileName);
};

// In your component
const handleDownloadClick = () => {
  const population = selectedVillage ? selectedVillage.tot_p : 0;
  
  const mergedData = mergeDataForCSV(timeSeriesData, precipitationData, population);
  downloadCSV(mergedData, selectedDistrict.value, selectedVillage.village_na );
};

InfoPanel.propTypes = {
  villageName: PropTypes.string.isRequired,
};

  return (
    <div className="flex h-screen w-screen grid-row">
      <InfoPanel /> {/* Render InfoPanel by default */}
      <div className='w-2/5'>
      <MapContainer center={initialMapCenter} zoom={initialMapZoom} className="flex h-full w-full">
        <LayersControl position="topright">
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </BaseLayer>
          {geoJsonData && (
      <Overlay name="Boundary" checked>
        <GeoJSON
          key={`${geoJsonKey}-${selectedDistrict.value}-${selectedVillage?.village_na}`}
          data={geoJsonData}
          onEachFeature={onEachFeature}
          style={vectorStyle}
        />
      </Overlay>
    )}
          {rasterUrl && (
            <Overlay name="LULC Map" checked>
              <TileLayer 
               key={`${selectedDistrict.value}-${selectedVillage?.village_na}`}
              url={rasterUrl}
               />
            </Overlay>
          )}
          {carbonUrl && (
            <Overlay name="Organic Carbon Map" unchecked>
              <TileLayer 
               key={`${selectedDistrict.value}-${selectedVillage?.village_na}`}
              url={carbonUrl}
               />
            </Overlay>
          )}
          {slopeUrl && (
            <Overlay name="Slope Map" unchecked>
              <TileLayer 
               key={`${selectedDistrict.value}-${selectedVillage?.village_na}`}
              url={slopeUrl}
               />
            </Overlay>
          )}
  </LayersControl>
  {selectedDistrictGeometry && <FlyToDistrict districtGeometry={selectedDistrictGeometry} />}
  {selectedVillageGeometry && <FlyToVillage villageGeometry={selectedVillageGeometry} />}
  <Legend />
      </MapContainer>
      </div>
      <div className="w-2/5 flex flex-col bg-white">
      <div className=" w-full pt-4 pl-4 pb-2 text-black">
      <select
  value={selectedDistrict ? districtDisplayNames[selectedDistrict.value] : ""}
  onChange={handleDistrictChange}
  className="max-w-xs bg-white text-black border-2 border-black text-lg p-1 rounded"
  style={{ fontSize: '1rem' }}
>
  <option value="">Select a District</option>
  {districts.map((option) => (
    <option key={option.value} value={districtDisplayNames[option.value]}>
      {districtDisplayNames[option.value]}
    </option>
  ))}
</select>
  <h2 className="text-lg font-semibold mb-1">Takes 5 sec to load a district</h2>
  <h2 className="text-sm font-semibold text-blue-900">*Zoom in on the district to view the Agricultural Land Use Raster Map 2022-23</h2>
  <h2 className="text-sm font-semibold text-blue-900 pt-1">**Click on the layers logo on the top right of the map to view different Map views</h2>
  <hr className="h-px mt-2 mr-4 bg-gray-200 border-0 dark:bg-gray-700"></hr>
</div>

        {selectedVillage && (
          <div className="overflow-y-auto pl-4 bg-white text-black">
            <h2 className="text-xl font-bold mb-1">Village Details</h2>
            <p><strong>Name:</strong> {capitalizeFirstLetter(selectedVillage.village_na)}</p>
            <p><strong>District:</strong> {capitalizeFirstLetter(selectedVillage.district_n)}</p>
            <p><strong>State:</strong> {capitalizeFirstLetter(selectedVillage.state_name)}</p>
            <p><strong>Population:</strong> {selectedVillage.tot_p}</p>
            <hr className="h-px mt-2 mr-4 bg-gray-200 border-0 dark:bg-gray-700"></hr>
            {/* Additional village details can be added here */}
          </div>
          
        )}
          <div className="flex flex-col pt-2 pl-4 pr-4 bg-white">
          <div className="text-black text-2xl font-semibold mb-2 mt-1 bg-white">Land Cover Change Over Time</div>
          <div className="flex flex-wrap gap-2 mb-4">
  {Object.entries(visibleDataSets).map(([category, isVisible]) => (
    <button
      key={category}
      onClick={() => toggleDataSetVisibility(category)}
      className={`px-3 py-1 rounded-full text-sm font-medium ${isVisible ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
    >
      {datasetDisplayNames[category] || category} 
    </button>
  ))}
</div>
          {loading ? (
            <p className='text-red-600 font-bold'>Loading time series data... (20sec)</p>
          ) : timeSeriesData ? (
            <div className="h-full w-full py-2 bg-white"> {/* Set the height and width to full */}
              <Line
               data={combinedChartData}
                options={chartOptions}
                height={null} // Ensuring chart occupies all available height
                width={null} // Ensuring chart occupies all available width
              />
            </div>
          ) : (
            <p className='text-black'>Select a village to view the time series data.</p>
          )}
        </div>
        <button
  onClick={handleDownloadClick}
  disabled={!timeSeriesData || !precipitationData}
  style={{
    backgroundColor: (!timeSeriesData || !precipitationData) ? 'rgba(255, 0, 0, 0.5)' : 'red',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    margin:'2px 12px',
    borderRadius: '5px',
    cursor: (!timeSeriesData || !precipitationData) ? 'not-allowed' : 'pointer',
    // other styles you want to apply
  }}
>
  Download Data as CSV
</button>
      </div>
    </div>
  );
};

export default KarauliMap;