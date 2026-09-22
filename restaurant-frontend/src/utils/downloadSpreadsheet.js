/** Download blob export (Excel .xlsx). Rejects HTML error pages saved as .xlsx. */
import { assertAndDownloadSpreadsheet } from './assertSpreadsheet';

export function downloadSpreadsheet(blobData, filenamePrefix) {
  return assertAndDownloadSpreadsheet(blobData, filenamePrefix);
}
