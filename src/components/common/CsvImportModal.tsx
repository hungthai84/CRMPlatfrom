import React, { useState } from 'react';
import { Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button, Modal, Select } from '../ui/Primitives';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';

interface ParsedRow {
  raw: Record<string, string>;
  error?: string;
  isDuplicate?: boolean;
}

export const CsvImportModal: React.FC<{
  open: boolean;
  onClose: () => void;
  target: 'customers' | 'leads';
}> = ({ open, onClose, target }) => {
  const { customers, leads, createCustomer, createLead } = useCRM();
  const { addToast } = useToast();

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [nameCol, setNameCol] = useState('');
  const [emailCol, setEmailCol] = useState('');
  const [phoneCol, setPhoneCol] = useState('');
  const [importing, setImporting] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      addToast('File không hợp lệ', 'Cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu CSV.', 'error');
      return;
    }

    const cols = lines[0].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    setHeaders(cols);
    setNameCol(cols.find((c) => /name|ten/i.test(c)) || cols[0] || '');
    setEmailCol(cols.find((c) => /email|mail/i.test(c)) || cols[1] || '');
    setPhoneCol(cols.find((c) => /phone|sdt|tel/i.test(c)) || cols[2] || '');

    const parsedRows: ParsedRow[] = lines.slice(1).map((line) => {
      const cells = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      const obj: Record<string, string> = {};
      cols.forEach((h, idx) => {
        obj[h] = cells[idx] || '';
      });
      return { raw: obj };
    });
    setRows(parsedRows);
  };

  const validatedRows = rows.map((r) => {
    const name = r.raw[nameCol] || '';
    const email = r.raw[emailCol] || '';
    const phone = r.raw[phoneCol] || '';
    const errors: string[] = [];
    if (name.length < 2) errors.push('Thiếu tên');
    if (!email.includes('@')) errors.push('Email không hợp lệ');
    const isDup =
      target === 'customers'
        ? customers.some((c) => c.email.toLowerCase() === email.toLowerCase() || (phone && c.phone === phone))
        : leads.some((l) => l.email.toLowerCase() === email.toLowerCase() || (phone && l.phone === phone));
    return {
      ...r,
      error: errors.join(', '),
      isDuplicate: isDup,
    };
  });

  const validCount = validatedRows.filter((r) => !r.error && !r.isDuplicate).length;

  const confirmImport = async () => {
    setImporting(true);
    let imported = 0;
    for (const r of validatedRows) {
      if (r.error || r.isDuplicate) continue;
      if (target === 'customers') {
        await createCustomer({
          type: 'business',
          name: r.raw[nameCol],
          email: r.raw[emailCol],
          phone: r.raw[phoneCol] || '0900000000',
          address: '',
          group: 'Import CSV',
          segment: 'Standard',
          tags: ['CSV Import'],
          ownerName: 'Import',
          score: 65,
          lifetimeValue: 0,
          healthScore: 80,
          status: 'active',
          source: 'Import',
          consent: {
            marketingEmail: false,
            marketingSmsZalo: false,
            aiProcessing: false,
            thirdPartySharing: false,
            consentSource: 'CSV Import (Chưa xác nhận đồng ý tiếp thị)',
            consentedAt: Date.now(),
            purposeNote: 'Quản lý danh bạ cơ bản',
          },
        });
      } else {
        await createLead({
          name: r.raw[nameCol],
          email: r.raw[emailCol],
          phone: r.raw[phoneCol] || '0900000000',
          source: 'Import',
          estimatedValue: 50_000_000,
        });
      }
      imported += 1;
    }
    setImporting(false);
    addToast('Hoàn tất Import CSV', `Đã nhập ${imported} bản ghi mới (bỏ qua trùng lặp & lỗi).`, 'success');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Import CSV – ${target === 'customers' ? 'Khách hàng' : 'Khách hàng tiềm năng'}`}
      subtitle="Ánh xạ cột (Field Mapping), kiểm tra trùng lặp và xem trước trước khi lưu"
      size="lg"
    >
      <div className="space-y-4">
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 cursor-pointer hover:border-[#1951fc]">
          <Upload className="w-6 h-6 text-[#1951fc] mb-2" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Chọn tệp .csv (UTF-8)</span>
          <span className="text-xs text-slate-400 mt-1">Không tự động ghi đè dữ liệu trùng lặp hiện có</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        </label>

        {headers.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select label="Cột Tên" value={nameCol} onChange={(e) => setNameCol(e.target.value)}>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </Select>
              <Select label="Cột Email" value={emailCol} onChange={(e) => setEmailCol(e.target.value)}>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </Select>
              <Select label="Cột Số điện thoại" value={phoneCol} onChange={(e) => setPhoneCol(e.target.value)}>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </Select>
            </div>

            <div className="max-h-56 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2">Tên</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">SĐT</th>
                    <th className="px-3 py-2">Kiểm tra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {validatedRows.slice(0, 20).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{r.raw[nameCol]}</td>
                      <td className="px-3 py-2">{r.raw[emailCol]}</td>
                      <td className="px-3 py-2 font-mono">{r.raw[phoneCol]}</td>
                      <td className="px-3 py-2">
                        {r.error ? (
                          <span className="text-rose-600 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {r.error}
                          </span>
                        ) : r.isDuplicate ? (
                          <span className="text-amber-600 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Trùng lặp (Bỏ qua)
                          </span>
                        ) : (
                          <span className="text-emerald-600 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Hợp lệ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Sẵn sàng nhập {validCount} / {validatedRows.length} dòng hợp lệ
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Hủy</Button>
                <Button disabled={importing || validCount === 0} onClick={confirmImport}>
                  {importing ? 'Đang nhập...' : `Xác nhận nhập ${validCount} bản ghi`}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
