import React from 'react';
import PlatformEmailTemplateEditor from './PlatformEmailTemplateEditor';
import PlatformEmailTemplatesList from './PlatformEmailTemplatesList';

export default function PlatformEmailTemplatesTab({ flow }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row items-start">
      <PlatformEmailTemplatesList flow={flow} />
      <PlatformEmailTemplateEditor flow={flow} />
    </div>
  );
}
