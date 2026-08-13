import PageSearchField from '../../../../components/ui/PageSearchField';

export default function ProductsSearchField({ value, onChange, placeholder }) {
  return (
    <PageSearchField
      className="max-w-xl"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}
