function Cart({ items, total, onUpdateQuantity, onRemove, onPlaceOrder }) {
  if (items.length === 0) {
    return (
      <div className="cart">
        <h2>Shopping Cart</h2>
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <p>Add some products to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="cart">
      <h2>Shopping Cart</h2>
      
      {items.map(item => (
        <div key={item.id} className="cart-item">
          <div className="cart-item-info">
            <h4>{item.name}</h4>
            <p className="price">${item.price.toFixed(2)} each</p>
          </div>
          
          <div className="cart-item-controls">
            <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
              -
            </button>
            <span>{item.quantity}</span>
            <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
              +
            </button>
            <button className="remove" onClick={() => onRemove(item.id)}>
              ✕
            </button>
          </div>
        </div>
      ))}

      <div className="cart-total">
        <h3>Total:</h3>
        <span className="amount">${total.toFixed(2)}</span>
      </div>

      <button className="checkout-btn" onClick={onPlaceOrder}>
        Place Order
      </button>
    </div>
  )
}

export default Cart
