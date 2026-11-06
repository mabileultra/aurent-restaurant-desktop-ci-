import React from 'react';
import PlatformEmailComposeForm from './PlatformEmailComposeForm';
import PlatformEmailLivePreview from './PlatformEmailLivePreview';

export default function PlatformEmailSendTab({ flow }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
      <PlatformEmailComposeForm flow={flow} />
      <PlatformEmailLivePreview flow={flow} />
    </div>
  );
}
