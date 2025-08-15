import React, { useState } from 'react';
import FurnitureItem from './FurnitureItem';
import { ClipLoader } from 'react-spinners';

const FurnitureGrid = ({FurnitureLoading, setFurnitureSearch, products, items, handleCartItems, cartPrice, handleCartPrice }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = async () => {
    if (!searchQuery) {
      alert("Please enter a search query");
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5002/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ search_query: searchQuery }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to scrape data');
      }
  
      const data = await response.json();
      console.log(data.message);

      setFurnitureSearch(prev=>!prev)
  
      // Optionally, you can add a success message or handle the response further
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className='container-fluid'>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for Furniture..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch}>
          Search
        </button>
      </div>
      {/* Show only the loading animation when FurnitureLoading is true */}
      {FurnitureLoading ? (
        <div className="loading-container">
          <ClipLoader color="#09f" size={50} />
          <p>Fetching furniture, please wait...</p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 g-4">
          {products.length > 0 ? (
            products.map((element, index) => (
              <div className="col" key={element.url || index}>
                <div className="card shadow-sm h-100">
                  <FurnitureItem
                    name={element.name}
                    mrp={element.price}
                    url={element.url}
                    image_url={element.image_url}
                    cart_items={items}
                    product={element}
                    handleCartItems={handleCartItems}
                    cartPrice={cartPrice}
                    handleCartPrice={handleCartPrice}
                  />
                </div>
              </div>
            ))
          ) : (
            <p>No furniture found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FurnitureGrid;