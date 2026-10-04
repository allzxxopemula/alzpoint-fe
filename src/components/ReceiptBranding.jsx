const ReceiptHeader = ({ settings }) => (
  <div className="border-b border-dashed border-slate-300 pb-3 text-center">
    <h4 className="text-base font-extrabold text-slate-900">{settings?.cooperative_name || 'Alz Point'}</h4>
    {settings?.address && <p className="mt-1 text-[11px] text-slate-500">{settings.address}</p>}
    {settings?.phone && <p className="text-[11px] text-slate-500">Tel. {settings.phone}</p>}
    {settings?.email && <p className="text-[11px] text-slate-500">{settings.email}</p>}
  </div>
);

export const ReceiptFooter = ({ settings }) => settings?.receipt_footer
  ? <p className="border-t border-dashed border-slate-300 pt-3 text-center text-[11px] text-slate-500">{settings.receipt_footer}</p>
  : null;

export default ReceiptHeader;