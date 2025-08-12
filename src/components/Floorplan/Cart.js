import React from 'react';
import CartItem from './CartItems';
import { useState } from 'react';
import "./Cart.css"

const Cart = ({ items, handleCartItems, cartPrice, handleCartPrice }) => {
    const[price, SetPrice] = useState(0);
    
    return (
        <div className='cart-container' style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Main content area */}
            <div className='container-fluid' style={{ flex: 1, padding: '20px' }}>
                <div className="row row-cols-1 row-cols-sm-2 g-4">
                    {items.map((element, index) => (
                        <div className="col" key={element.url || index}>
                            <div className="card shadow-sm h-100">
                                <CartItem 
                                    name={element.name} 
                                    mrp={element.price} 
                                    url={element.url} 
                                    image_url={element.image_url}
                                    handleCartItems={handleCartItems}
                                    handlePrice={SetPrice}
                                    cartPrice={cartPrice}
                                    handleCartPrice={handleCartPrice}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Price bar at bottom */}
            <div className='price-container'>
                    <h2 className='priceh1'>
                        Price : {cartPrice}
                    </h2>
                </div>
            </div>
        
    );
};

export default Cart;