import { Toaster } from 'react-hot-toast';
import '../../styles/shared/toaster.css';
import { APP_TOASTER_CONTAINER_STYLE, APP_TOAST_BASE_STYLE } from './toasterLayout';

export default function ThemedToaster() {
  return (
    <Toaster
      position="top-right"
      containerClassName="app-toaster print:hidden"
      containerStyle={APP_TOASTER_CONTAINER_STYLE}
      toastOptions={{
        duration: 4000,
        style: APP_TOAST_BASE_STYLE,
      }}
    />
  );
}
