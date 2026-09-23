import { companyBusinessTypeApi } from '../api';
import { evaluateRestaurantAppAccess } from './restaurantAppAccess';
import { getMainAppUrl } from '../config/mainAppUrl';

export async function fetchRestaurantAppAccess(role) {
  let businessPayload = null;
  try {
    const res = await companyBusinessTypeApi.get();
    businessPayload = res.data;
  } catch {
    businessPayload = null;
  }
  return {
    businessPayload,
    access: evaluateRestaurantAppAccess({ role, businessPayload }),
    mainAppUrl: getMainAppUrl(),
  };
}
