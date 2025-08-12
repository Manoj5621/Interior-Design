import React, { useState, useEffect } from "react";
import './ModelGrid.css'

const ModelGrid = ({ apiKey, onModelSelect }) => {
  const [models, setModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // For input field
  const [query, setQuery] = useState("Sofa"); // Default query

  // Function to fetch models from Sketchfab API
  const fetchModels = async () => {
    try {
      const response = await fetch(
        `https://api.sketchfab.com/v3/search?type=models&q=${query}&downloadable=true`,
        {
          headers: {
            Authorization: "Token 34049ad4ef4e47948ecc4fb52d39c8c4",
          },
        }
      );
      const data = await response.json();
      setModels(data.results || []);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  
  // Fetch models when the component mounts or query changes
  useEffect(() => {
    fetchModels();
  }, [query]);

  // Handle model selection
  const handleModelSelect = (model) => {
    onModelSelect(model.uid);
  };

  // Handle search button click
  const handleSearch = () => {
    setQuery(searchQuery);
  };

  return (
    <div className="model-grid-container">
      {/* Search bar at the top */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for 3D models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          onClick={handleSearch}
        >
          Search
        </button>
      </div>

      {/* Model grid */}
      <div className="model-grid">
        {models.map((model) => (
          <div
            key={model.uid}
            className="model-card"
            onClick={() => handleModelSelect(model)}
          >
            <img
              src={model.thumbnails.images[0].url}
              alt={model.name}
              style={{ width: "100%", height: "150px", objectFit: "cover" }}
            />
            <div style={{ padding: "0.5rem", fontSize: "0.9rem" }}>
              {model.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelGrid;
