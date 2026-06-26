const AssetSearch = ({ onSearch }) => {
  return (
    <input
      type="text"
      className="w-full py-[11px] px-4 bg-white border border-[var(--color-border-main)] rounded-[12px] text-[13.5px] text-[var(--color-text-main)] outline-none mb-5 shadow-sm font-sans transition-colors duration-150 focus:border-[var(--color-primary-light)] focus:shadow-[0_0_0_3px_rgba(15,118,110,0.15)]"
      placeholder="🔍  Search Equipment ID, type, or location..."
      onChange={(e) => onSearch(e.target.value)}
    />
  );
};

export default AssetSearch;
