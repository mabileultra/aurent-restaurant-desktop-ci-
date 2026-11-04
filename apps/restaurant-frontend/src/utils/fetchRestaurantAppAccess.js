import { companyBusinessTypeApi } from '../api';
import { evaluateRestaurantAppAccess } from './restaurantAppAccess';
import { getMainAppUrl } from '../config/mainAppUrl';

export async function fetchRestaurantAppAccess(role) {
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
    access: evaluateRestaurantAppAccess({ role, businessPayload }),
    mainAppUrl: getMainAppUrl(),
  };
}
