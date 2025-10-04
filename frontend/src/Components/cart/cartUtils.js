// frontend/src/Components/cart/cartUtils.js

// save cart
export const saveCart = (cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));
  };
  
  // load cart
  export const loadCart = () => {
    try {
      const raw = localStorage.getItem("cart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  
  // add a product (from catalogue) to cart
  export const addToCart = (product, qty = 1) => {
    const cart = loadCart();
    const idx = cart.findIndex(i => i.productId === product._id);
    if (idx >= 0) {
      cart[idx].qty += qty;
    } else {
      cart.push({
        productId: product._id,
        name: product.productName,
        price: Number(product.basePrice) || 0,
        qty,
        image: product.images?.[0] || ""
      });
    }
    saveCart(cart);
    return cart;
  };
  
  // update quantity
  export const updateQty = (productId, qty) => {
    const cart = loadCart().map(i => (i.productId === productId ? { ...i, qty } : i));
    saveCart(cart);
    return cart;
  };
  
  // remove item
  export const removeFromCart = (productId) => {
    const cart = loadCart().filter(i => i.productId !== productId);
    saveCart(cart);
    return cart;
  };
  
  // clear all
  export const clearCart = () => localStorage.removeItem("cart");