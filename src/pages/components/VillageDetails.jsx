import PropTypes from 'prop-types';

const VillageDetails = ({ village }) => {
  if (!village) {
    return (
      <div className="w-1/2 h-screen bg-gray-100 p-4">
        Select a village to see the details
      </div>
    );
  }

  return (
    <div className="w-1/2 h-screen bg-gray-100 p-4">
      <h2 className="text-xl font-bold mb-4 text-black">Village Analysis Data</h2>
      <p className='text-black'><strong>Name:</strong> {village.VCT_N_11}</p>
      {/* You can add more details based on the properties available in your village object */}
      <p className='text-black'><strong>District:</strong> {village.Dist_N_11}</p>
      {/* Repeat for other properties as needed */}
    </div>
  );
};

VillageDetails.propTypes = {
  village: PropTypes.shape({
    VCT_N_11: PropTypes.string,
    Dist_N_11: PropTypes.string,
    // Add other property types as necessary
  }),
};

export default VillageDetails;
