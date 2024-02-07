import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const { BaseLayer, Overlay } = LayersControl;

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
  

  useEffect(() => {
    axios.get('http://localhost:8000/api/karauli_villages_geojson/')
      .then(response => {
        setGeoJsonData(response.data);
      })
      .catch(error => {
        console.error('Error fetching GeoJSON data:', error);
      });
  }, []);

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        setSelectedVillage(feature.properties);
        setSelectedVillageGeometry(layer);
        setLoading(true);
        axios.get(`http://localhost:8000/api/area_change/${feature.properties.VCT_N_11}/`)
          .then(response => {
            setTimeSeriesData(response.data);
            setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching time series data:', error);
            setLoading(false);
          });
        axios.get(`http://localhost:8000/api/get_karauli_raster/`)
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
          {loading ? (
            <p className='text-black'>Loading time series data...</p>
          ) : timeSeriesData ? (
            <div className="h-full w-full p-6 bg-white"> {/* Set the height and width to full */}
              <Line
                data={{
                  labels: Object.keys(timeSeriesData),
                  datasets: [
                    {
                      label: 'Land cover change',
                      data: Object.values(timeSeriesData).map(yearData => yearData['Built-up']), // Example for 'Built-up' class
                      fill: false,
                      borderColor: 'rgb(75, 192, 192)',
                      tension: 0.1,
                    },
                    // Add more datasets for other classes if needed
                  ],
                }}
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