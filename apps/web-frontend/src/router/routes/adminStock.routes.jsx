import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProtectedRoute from '../guards/ProtectedRoute';
import CheckoutRedirect from '../guards/CheckoutRedirect';
import {
  AiAssistantPage,
  CategoriesPage,
  DashboardPage,
  OrdersListPage,
  ProductsPage,
  ScalesPluPage,
  ScalesStationPage,
  StockInventoryCreatePage,
  StockProductsPage,
  StockReceiptCreatePage,
  StockTransferCreatePage,
  SuppliersPage,
} from '../lazyPages';

export const adminStockRoutes = (
  <>
    <Route
      path="dashboard"
      element={(
        <ProtectedRoute module="dashboard">
          <DashboardPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="assistant"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="aiAssistant">
          <AiAssistantPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="products"
      element={(
        <ProtectedRoute module="products">
          <ProductsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="categories"
      element={(
        <ProtectedRoute module="categories">
          <CategoriesPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="scales/station"
      element={(
        <ProtectedRoute module="scalesStation">
          <ScalesStationPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="scales/plu"
      element={(
        <ProtectedRoute module="scalesPlu">
          <ScalesPluPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="stock/products"
      element={(
        <ProtectedRoute module="stockProducts">
          <StockProductsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="stock/receipts/new"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockReceipts">
          <StockReceiptCreatePage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="stock/receipts/:id/edit"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockReceipts">
          <StockReceiptCreatePage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="stock/inventories/new"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockInventories">
          <StockInventoryCreatePage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="stock/transfers/new"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockTransfers">
          <StockTransferCreatePage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="stock/suppliers"
      element={(
        <ProtectedRoute module="stockSuppliers">
          <SuppliersPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="orders/list"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="ordersList">
          <OrdersListPage />
        </ProtectedRoute>
      )}
    />
    <Route path="orders" element={<Navigate to="/orders/list" replace />} />
    <Route path="checkout" element={<CheckoutRedirect />} />
  </>
);
