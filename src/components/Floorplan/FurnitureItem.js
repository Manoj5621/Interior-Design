import React from 'react';
import './FurnitureItem.css';

const FurnitureItem = ({ image_url, name, mrp, url, product, cart_items, handleCartItems, cartPrice, handleCartPrice}) => {

  const handleAddToCart = () =>{
    handleCartItems((prevItems => [...prevItems, product]))
    handleCartPrice((prevprice)=>prevprice+parseInt(mrp))
  }

  
  return (
    <div className="furniture-card">
      <div className="image-container">
        <img src={image_url} alt={name} />
      </div>
      
      <div className="content-container">
        <h3 className="product-name">{name}</h3>
        <p className="product-price">{`₹ ${mrp}`}</p>

        <div className="button-container">
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="checkout-button"
          >
            Checkout
          </a>
          
          <button 
            className="cart-button"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default FurnitureItem;