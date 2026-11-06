import { companyBusinessTypeApi } from '../api';
import { evaluateMainAppAccess } from './mainAppAccess';
import { getRestaurantAppUrl } from '../config/restaurantAppUrl';

export async function fetchMainAppAccess(role) {
  let businessPayload = null;
  let fetchError = false;
  try {
    const res = await companyBusinessTypeApi.get();
    businessPayload = res.data;
  } catch {
    fetchError = true;
    businessPayload = null;
  }
  return {
    businessPayload,
    fetchError,
    access: evaluateMainAppAccess({ role, businessPayload }),
    restaurantAppUrl: getRestaurantAppUrl() || 'https://r-aurent.uz',
  };
}
