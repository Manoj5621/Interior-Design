import React from 'react';
import './FurnitureItem.css';
import { useState } from 'react';

const CartItem = ({ image_url, name, mrp, url, handleCartItems, cartPrice, handleCartPrice}) => {

  const removeFromCart = (image_url_) => {
    handleCartItems((prevItems) =>
      prevItems.filter((item) => item.image_url !== image_url_)
    );
    handleCartPrice((prevprice)=>prevprice-parseInt(mrp))
  };
  
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
            onClick={()=>{removeFromCart(image_url)}}
          >
            Remove From Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;