import { Markup } from 'telegraf';
import { MENU } from '../state/userStateStore.js';

export function mainReplyKeyboard() {
  return Markup.keyboard([
    [MENU.FIND, MENU.NEARBY],
    [MENU.FAVORITES, MENU.HISTORY],
    [MENU.SUPPORT, MENU.ABOUT],
  ]).resize();
}

export function searchReplyKeyboard() {
  return Markup.keyboard([
    [MENU.SCAN, MENU.LAST_QUERIES],
    [MENU.HOME],
  ]).resize();
}

export function nearbyReplyKeyboard() {
  return Markup.keyboard([
    [Markup.button.locationRequest(MENU.SEND_LOCATION)],
    [MENU.HOME],
  ]).resize();
}

export function homeOnlyKeyboard() {
  return Markup.keyboard([[MENU.HOME]]).resize();
}
