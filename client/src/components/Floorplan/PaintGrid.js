import React from 'react';
import './PaintGrid.css';

const PaintGrid = ({ onPaintSelect }) => {
  const paints = [
    { id: 1, name: 'Classic White', color: '#FFFFFF', price: '$29.99' },
    { id: 2, name: 'Warm Beige', color: '#E8DCC4', price: '$34.99' },
    { id: 3, name: 'Soft Gray', color: '#D3D3D3', price: '$32.99' },
    { id: 4, name: 'Sky Blue', color: '#87CEEB', price: '$39.99' },
    { id: 5, name: 'Sage Green', color: '#9DC183', price: '$36.99' },
    { id: 6, name: 'Blush Pink', color: '#FFB6C1', price: '$38.99' },
  ];

  return (
    <div className="paint-grid">
      {paints.map((paint) => (
        <div
          key={paint.id}
          className="paint-item"
          onClick={() => onPaintSelect(paint)}
        >
          <div
            className="color-preview"
            style={{ backgroundColor: paint.color }}
          />
          <div className="paint-details">
            <span className="paint-name">{paint.name}</span>
            <span className="paint-price">{paint.price}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaintGrid;