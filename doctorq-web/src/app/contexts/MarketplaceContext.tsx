"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types
export interface Product {
  id_produto: string;
  nm_produto: string;
  ds_descricao: string;
  ds_categoria: string;
  ds_marca: string;
  vl_preco: number;
  vl_preco_original?: number;
  nr_avaliacao_media?: number;
  nr_total_avaliacoes?: number;
  st_estoque: boolean;
  ds_selo?: string;
  ds_imagem_url?: string;
}

export interface CartItem extends Product {
  quantidade: number;
  vl_subtotal: number;
}

interface MarketplaceContextType {
  // Cart
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantidade?: number) => void;
  removeFromCart: (id_produto: string) => void;
  updateCartQuantity: (id_produto: string, quantidade: number) => void;
  clearCart: () => void;

  // Favorites
  favorites: Product[];
  favoritesCount: number;
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (id_produto: string) => void;
  isFavorite: (id_produto: string) => boolean;
  toggleFavorite: (product: Product) => void;

  // Comparison
  comparison: Product[];
  comparisonCount: number;
  addToComparison: (product: Product) => boolean;
  removeFromComparison: (id_produto: string) => void;
  isInComparison: (id_produto: string) => boolean;
  clearComparison: () => void;

  // UI State
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isFavoritesOpen: boolean;
  setIsFavoritesOpen: (isOpen: boolean) => void;
  isComparisonOpen: boolean;
  setIsComparisonOpen: (isOpen: boolean) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [comparison, setComparison] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("estetiQ_cart");
    const savedFavorites = localStorage.getItem("estetiQ_favorites");
    const savedComparison = localStorage.getItem("estetiQ_comparison");

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }

    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error("Error loading favorites from localStorage:", error);
      }
    }

    if (savedComparison) {
      try {
        setComparison(JSON.parse(savedComparison));
      } catch (error) {
        console.error("Error loading comparison from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("estetiQ_cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("estetiQ_cart");
    }
  }, [cart]);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (favorites.length > 0) {
      localStorage.setItem("estetiQ_favorites", JSON.stringify(favorites));
    } else {
      localStorage.removeItem("estetiQ_favorites");
    }
  }, [favorites]);

  // Save comparison to localStorage whenever it changes
  useEffect(() => {
    if (comparison.length > 0) {
      localStorage.setItem("estetiQ_comparison", JSON.stringify(comparison));
    } else {
      localStorage.removeItem("estetiQ_comparison");
    }
  }, [comparison]);

  // Cart functions
  const addToCart = (product: Product, quantidade: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id_produto === product.id_produto);

      if (existingItem) {
        // Update quantity if item already exists
        return prevCart.map((item) =>
          item.id_produto === product.id_produto
            ? {
                ...item,
                quantidade: item.quantidade + quantidade,
                vl_subtotal: (item.quantidade + quantidade) * item.vl_preco,
              }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          ...product,
          quantidade,
          vl_subtotal: quantidade * product.vl_preco,
        };
        return [...prevCart, newItem];
      }
    });

    // Auto-open cart when item is added
    setIsCartOpen(true);
  };

  const removeFromCart = (id_produto: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id_produto !== id_produto));
  };

  const updateCartQuantity = (id_produto: string, quantidade: number) => {
    if (quantidade <= 0) {
      removeFromCart(id_produto);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id_produto === id_produto
          ? {
              ...item,
              quantidade,
              vl_subtotal: quantidade * item.vl_preco,
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Favorites functions
  const addToFavorites = (product: Product) => {
    setFavorites((prevFavorites) => {
      if (prevFavorites.find((fav) => fav.id_produto === product.id_produto)) {
        return prevFavorites;
      }
      return [...prevFavorites, product];
    });
  };

  const removeFromFavorites = (id_produto: string) => {
    setFavorites((prevFavorites) =>
      prevFavorites.filter((fav) => fav.id_produto !== id_produto)
    );
  };

  const isFavorite = (id_produto: string): boolean => {
    return favorites.some((fav) => fav.id_produto === id_produto);
  };

  const toggleFavorite = (product: Product) => {
    if (isFavorite(product.id_produto)) {
      removeFromFavorites(product.id_produto);
    } else {
      addToFavorites(product);
    }
  };

  // Comparison functions
  const addToComparison = (product: Product): boolean => {
    // Limite de 4 produtos para comparação
    if (comparison.length >= 4) {
      return false;
    }

    // Verifica se já está na comparação
    if (comparison.some((item) => item.id_produto === product.id_produto)) {
      return false;
    }

    setComparison((prevComparison) => [...prevComparison, product]);
    return true;
  };

  const removeFromComparison = (id_produto: string) => {
    setComparison((prevComparison) =>
      prevComparison.filter((item) => item.id_produto !== id_produto)
    );
  };

  const isInComparison = (id_produto: string): boolean => {
    return comparison.some((item) => item.id_produto === id_produto);
  };

  const clearComparison = () => {
    setComparison([]);
  };

  // Computed values
  const cartCount = cart.reduce((total, item) => total + item.quantidade, 0);
  const cartTotal = cart.reduce((total, item) => total + item.vl_subtotal, 0);
  const favoritesCount = favorites.length;
  const comparisonCount = comparison.length;

  const value: MarketplaceContextType = {
    // Cart
    cart,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,

    // Favorites
    favorites,
    favoritesCount,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,

    // Comparison
    comparison,
    comparisonCount,
    addToComparison,
    removeFromComparison,
    isInComparison,
    clearComparison,

    // UI State
    isCartOpen,
    setIsCartOpen,
    isFavoritesOpen,
    setIsFavoritesOpen,
    isComparisonOpen,
    setIsComparisonOpen,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error("useMarketplace must be used within a MarketplaceProvider");
  }
  return context;
};
