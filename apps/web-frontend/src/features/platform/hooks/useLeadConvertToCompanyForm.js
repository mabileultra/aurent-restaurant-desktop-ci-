import { useState, useMemo } from 'react';
import { guessBusinessTypeFromMessage } from '../utils/leadFormatUtils';
import { generateSecurePassword } from '../utils/passwordGenerator';
import { validateCompanyConvertForm, TIN_LENGTH } from '../utils/leadConvertValidationUtils';

export function useLeadConvertToCompanyForm({ lead, onSubmit, isSubmitting }) {
  const guessedCode = useMemo(() => guessBusinessTypeFromMessage(lead?.message), [lead?.message]);

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState(lead?.phone || '');
  const [legalName, setLegalName] = useState('');
  const [tin, setTin] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [selectedType, setSelectedType] = useState(guessedCode || 'UNIVERSAL');
  const [branchName, setBranchName] = useState('Asosiy filial');
  const [createAdmin, setCreateAdmin] = useState(true);
  const [adminName, setAdminName] = useState(lead?.name || '');
  const [adminEmail, setAdminEmail] = useState(lead?.email || '');
  const [adminLogin, setAdminLogin] = useState(() => {
    const raw = (lead?.email ? lead.email.split('@')[0] : lead?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return raw || 'admin';
  });
  const [adminPassword, setAdminPassword] = useState(() => generateSecurePassword(12));

  const validation = useMemo(() => validateCompanyConvertForm({
    companyName,
    regionCode,
    districtCode,
    tin,
    createAdmin,
    adminLogin,
    adminEmail,
    isSubmitting,
  }), [companyName, regionCode, districtCode, tin, createAdmin, adminLogin, adminEmail, isSubmitting]);

  const { isTinValid, canSubmit, validationHint } = validation;

  const handleRegeneratePassword = () => setAdminPassword(generateSecurePassword(12));

  const handleGeoChange = ({ regionCode: nextRegion, districtCode: nextDistrict }) => {
    setRegionCode(nextRegion);
    setDistrictCode(nextDistrict);
  };

  const handleTinChange = (val) => {
    setTin(val.replace(/\D/g, '').slice(0, TIN_LENGTH));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!canSubmit) return;

    onSubmit?.({
      leadId: lead?.id,
      company: {
        name: companyName.trim(),
        phone: phone.trim(),
        legalName: legalName.trim() || null,
        tin: tin.trim() || null,
        regionCode: regionCode.trim(),
        districtCode: districtCode.trim(),
        businessType: selectedType,
      },
      branchName: branchName.trim() || 'Asosiy filial',
      adminUser: createAdmin
        ? {
            name: adminName.trim(),
            login: adminLogin.trim(),
            email: adminEmail.trim(),
            password: adminPassword,
          }
        : null,
    });
  };

  return {
    companyName,
    setCompanyName,
    phone,
    setPhone,
    legalName,
    setLegalName,
    tin,
    handleTinChange,
    regionCode,
    districtCode,
    handleGeoChange,
    selectedType,
    setSelectedType,
    guessedCode,
    branchName,
    setBranchName,
    createAdmin,
    setCreateAdmin,
    adminName,
    setAdminName,
    adminEmail,
    setAdminEmail,
    adminLogin,
    setAdminLogin,
    adminPassword,
    setAdminPassword,
    handleRegeneratePassword,
    isTinValid,
    canSubmit,
    validationHint,
    handleSubmit,
  };
}
