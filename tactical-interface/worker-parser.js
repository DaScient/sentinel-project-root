// Web Worker for off-main-thread processing
self.onmessage = function(e) {
    const rawData = e.data;
    
    // Perform any complex filtering or coordinate normalization here
    const processedData = rawData.map(item => {
        return {
            ...item,
            // Ensure coordinates are numeric for the WebGL engine
            lat: parseFloat(item.location?.lat || 0),
            lng: parseFloat(item.location?.lng || 0),
            size: (item.threat_score / 10) * 2 // Scale point size by threat
        };
    });

    self.postMessage(processedData);
};
