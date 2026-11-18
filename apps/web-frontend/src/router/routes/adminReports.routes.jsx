import React from 'react';
import { adminReportsSalesRoutes } from './adminReportsSales.routes';
import { adminReportsStockRoutes } from './adminReportsStock.routes';

export const adminReportsRoutes = (
  <>
    {adminReportsSalesRoutes}
    {adminReportsStockRoutes}
  </>
);
