function Orders({ orders }) {
  if (orders.length === 0) {
    return (
      <div className="orders">
        <h2>Your Orders</h2>
        <div className="orders-empty">
          <p>No orders yet.</p>
          <p>Place an order to see it here!</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="orders">
      <h2>Your Orders</h2>
      
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <div>
              <span className="order-id">Order #{order.id}</span>
              <span className="order-date"> • {formatDate(order.created_at)}</span>
            </div>
            <span className={`order-status ${order.status}`}>
              {order.status}
            </span>
          </div>
          
          <div className="order-items">
            {order.items && order.items.map((item, index) => (
              <div key={index} className="order-item">
                <span>{item.name || `Item #${item.item_id}`} × {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="order-total">
            Total: ${order.total.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Orders
