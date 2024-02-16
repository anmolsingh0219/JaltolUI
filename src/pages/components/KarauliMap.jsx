import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

const { BaseLayer, Overlay } = LayersControl;
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// const API_BASE_URL = 'https://ec2-3-109-201-231.ap-south-1.compute.amazonaws.com/api/';
const API_BASE_URL = 'http://127.0.0.1:8000/api/';

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

const KarauliMap = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [selectedVillageGeometry, setSelectedVillageGeometry] = useState(null);
  const [rasterUrl, setRasterUrl] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [precipitationData, setPrecipitationData] = useState(null);

  
  const [visibleDataSets, setVisibleDataSets] = useState({
    // 'Background': true,
    // 'Built-up': true,
    // 'Water in Kharif': true,
    // 'Water in Kharif+Rabi': true,
    // 'Water in Kharif+Rabi+Zaid':  true,
    // 'Tree/Forests': true,
    // 'Barrenlands': true,
    'Single cropping cropland': true,
    // 'Single Non-Kharif cropping cropland': true,
    'Double cropping cropland': true,
    // 'Triple cropping cropland': true,
    // 'Shrub_Scrub': true,
  });

  const categoryColors = {
    'Background': '#b2df8a', // Assuming these match the order of your 'palette'
  'Built-up': '#6382ff',
  'Water in Kharif': '#d7191c',
  'Water in Kharif+Rabi': '#f5ff8b',
  'Water in Kharif+Rabi+Zaid': '#dcaa68',
  'Tree/Forests': '#33a02c',
  'Barrenlands': '#50c361',
  'Single cropping cropland': '#000000', // Adjusted based on your message, seems like a mismatch
  'Single Non-Kharif cropping cropland': '#dac190',
  'Double cropping cropland': '#a6cee3',
  'Triple cropping cropland': '#38c5f9',
  'Shrub_Scrub': '#6e0002',
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}karauli_villages_geojson/`)
      .then(response => {
        setGeoJsonData(response.data);
      })
      .catch(error => {
        console.error('Error fetching GeoJSON data:', error);
      });
  }, []);
  
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
        setSelectedVillage(feature.properties);
        setSelectedVillageGeometry(layer);
        setLoading(true);

        // Fetch the area change data and precipitation data for the selected village
        Promise.all([
          axios.get(`${API_BASE_URL}area_change/${feature.properties.VCT_N_11}/`),
          axios.get(`${API_BASE_URL}rainfall_data/${feature.properties.VCT_N_11}/`)
        ]).then(([areaChangeResponse, rainfallResponse]) => {
          setTimeSeriesData(areaChangeResponse.data);
          setPrecipitationData(rainfallResponse.data.rainfall_data);
        }).catch(error => {
          console.error('Error fetching data:', error);
        }).finally(() => {
          setLoading(false);
        });
        
        // Fetch raster data as before
        axios.get(`${API_BASE_URL}get_karauli_raster/`)
          .then(response => {
            setRasterUrl(response.data.tiles_url);
          })
          .catch(error => {
            console.error('Error fetching raster data:', error);
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
          label: 'Area (ha)',
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
      borderColor: '#3498db', // Color for precipitation data line
      yAxisID: 'y1',
      tension: 0.1,
    }] : [] // Initialize as an empty array if precipitationData is not available
  };

  // Combine the land cover and precipitation chart data
  const combinedChartData = {
    labels: precipitationChartData.labels.length ? precipitationChartData.labels : landCoverChartData.labels,
    datasets: [
      ...landCoverChartData.datasets,
      ...precipitationChartData.datasets
    ]
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
        }
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
        left: 20,
        right: 20,
        top: 20,
        bottom: 20
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


  return (
    <div className="flex h-screen w-screen">
      <MapContainer center={[26.5, 76.5]} zoom={10} className="h-full w-1/2">
        <LayersControl position="topright">
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </BaseLayer>
          {rasterUrl && (
            <Overlay name="Raster Data" checked>
              <TileLayer url={rasterUrl} />
            </Overlay>
          )}
          {geoJsonData && (
            <Overlay name="Vector Data" checked>
              <GeoJSON data={geoJsonData} onEachFeature={onEachFeature} style={vectorStyle} />
            </Overlay>
          )}
        </LayersControl>
        {selectedVillageGeometry && <FlyToVillage villageGeometry={selectedVillageGeometry} />}
        <Legend />
      </MapContainer>
      <div className="w-1/2 flex flex-col">
        {selectedVillage && (
          <div className="overflow-y-auto p-4 bg-white text-black">
            <h2 className="text-lg font-semibold mb-2">Village Details</h2>
            <p><strong>Name:</strong> {selectedVillage.VCT_N_11}</p>
            <p><strong>Sub District:</strong> {selectedVillage.SubD_N_11}</p>
            <p><strong>State:</strong> {selectedVillage.State_N}</p>
            {/* Additional village details can be added here */}
          </div>
        )}
          <div className="flex-grow p-4 bg-white">
          <div className="text-black text-xl font-semibold mb-4 bg-white">Land Cover Change Over Time</div>
          <div className="flex flex-wrap gap-2 mb-4">
  {timeSeriesData && Object.keys(visibleDataSets).map(category => (
    <button
      key={category}
      onClick={() => toggleDataSetVisibility(category)}
      className={`px-3 py-1 rounded-full text-sm font-medium ${visibleDataSets[category] ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
    >
      {category}
    </button>
  ))}
</div>
          {loading ? (
            <p className='text-black'>Loading time series data...</p>
          ) : timeSeriesData ? (
            <div className="h-full w-full p-6 bg-white"> {/* Set the height and width to full */}
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
      </div>
    </div>
  );
};

export default KarauliMap;