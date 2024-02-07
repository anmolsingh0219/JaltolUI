// // VillageAnalysis.js
// import { useState } from 'react';
// import { MapContainer, TileLayer} from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import axios from 'axios';

// const VillageAnalysis = () => {
//   const [villageName, setVillageName] = useState('');
//   const [villageData, setVillageData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [mapCenter] = useState([28.7041, 77.1025]); // Default center

//   const fetchVillageData = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(`http://localhost:8000/village_analysis/${villageName}/`); // Replace with your Django URL
//       setVillageData(response.data);
//       // Set map center if geographic data is available
//       // Example: setMapCenter([response.data.latitude, response.data.longitude]);
//     } catch (error) {
//       console.error('Error fetching village data:', error);
//       // Handle error appropriately
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <div className="mb-4">
//         <input
//           type="text"
//           value={villageName}
//           onChange={(e) => setVillageName(e.target.value)}
//           placeholder="Enter Village Name"
//           className="p-2 border border-gray-300 rounded"
//         />
//         <button
//           onClick={fetchVillageData}
//           disabled={loading}
//           className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
//         >
//           {loading ? 'Loading...' : 'Fetch Data'}
//         </button>
//       </div>

//       {villageData && (
//         <div>
//           <h3 className="text-lg font-semibold mb-2">Village Data:</h3>
//           <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(villageData, null, 2)}</pre>
//         </div>
//       )}

//       <MapContainer center={mapCenter} zoom={10} style={{ height: '400px' }}>
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         />
//         {/* You can add Markers, Popups, etc. based on your villageData */}
//       </MapContainer>
//     </div>
//   );
// };

// export default VillageAnalysis;
