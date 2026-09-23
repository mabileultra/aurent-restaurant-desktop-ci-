import { companyBusinessTypeApi } from '../api';
import { evaluateMainAppAccess } from './mainAppAccess';
import { getRestaurantAppUrl } from '../config/restaurantAppUrl';

export async function fetchMainAppAccess(role) {
  let businessPayload = null;
  try {
    const res = await companyBusinessTypeApi.get();
    businessPayload = res.data;
  } catch {
    businessPayload = null;
  }
  return {
    businessPayload,
    access: evaluateMainAppAccess({ role, businessPayload }),
    restaurantAppUrl: getRestaurantAppUrl() || 'https://r-aurent.uz',
  };
}
