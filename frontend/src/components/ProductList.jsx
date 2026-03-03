function ProductList({ products, onAddToCart }) {
  if (products.length === 0) {
    return (
      <div className="loading">
        <p>No products available.</p>
      </div>
    )
  }

  return (
    <div className="product-list">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <p className="description">{product.description}</p>
          <p className="price">${product.price.toFixed(2)}</p>
          <p className="stock">
            {product.stock > 0 
              ? `${product.stock} in stock` 
              : 'Out of stock'}
          </p>
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock <= 0}
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  )
}

export default ProductList
