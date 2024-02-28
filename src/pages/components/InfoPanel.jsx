const InfoPanel = () => {
    return (
      <div
        className="info-panel"
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          zIndex: '1000',
          backgroundColor: '#fff', // Assuming a white background
          color: '#333', // Dark text color
          padding: '20px', // More padding
          borderRadius: '5px',
          width: '300px', // Adjusted width
          height: '100%', // Full height
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'scroll', // In case the content overflows
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', // The font looks like Helvetica Neue
        }}
      >
        {/* The text content is structured based on the image provided */}
        <h1 style={{ fontWeight: 'bold', fontSize: '24px' }}>Jaltol</h1>
        <p>
          A free and open-source tool for stakeholders in watershed management -
          grassroots organisations, philanthropies and governments - to diagnose
          water problems, plan new interventions and assess impact of old ones.
        </p>
        <p>
          Jaltol aims to provide stakeholders with
          <ol>
            <li>access to curated and validated remote sensing datasets at a granular village scale and</li>
            <li>water security indicators derived from remote sensing data, suited for rural water use cases.</li>
          </ol>
        </p>
        <p>
          This we believe can facilitate increasing levels of data/evidence based decision
          making in the rural water management domain.
        </p>
        {/* Placeholder for image */}
        <div
          style={{
            width: '100%',
            height: '150px',
            backgroundColor: '#ddd', // Placeholder color
            textAlign: 'center',
            lineHeight: '150px', // Vertically center placeholder text
            marginBottom: '20px', // Space before changelog
          }}
        >
          Placeholder image
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #ccc' }} />
        <h2 style={{ fontWeight: 'bold', fontSize: '18px' }}>Changelog</h2>
        <p style={{ marginBottom: '5px' }}>28th Feb, 2024: The current version of the web app functions as a raw data access tool. The documentation for the datasets is available <a href="https://welllabs.org/project/data-water-hackathon/" style={{ color: '#3498db' }}target="_blank" rel="noopener noreferrer">here</a>. Through conversations with partner organizations we are in the process of remaking the tool to meet specific use cases, see this <a href="https://docs.google.com/document/d/1O69CQ8f9pmLAvmvLcfQz5X1UXnWokArNa38YMVJSItk/edit?usp=sharing" style={{ color: '#3498db' }}target="_blank" rel="noopener noreferrer">example</a>. Email us at <a href="mailto:welllabs.jaltol@ifmr.ac.in" style={{ color: '#3498db' }}target="_blank" rel="noopener noreferrer">welllabs.jaltol@ifmr.ac.in</a> if you would like to collaborate on a similar use case or suggest a new one.</p>
      </div>
    );
  };

export default InfoPanel;