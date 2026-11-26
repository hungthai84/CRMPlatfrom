import React from 'react';
import { Modal } from '../ui/Primitives';

export const HelpModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Modal open={open} onClose={onClose} title="Trung tâm Hướng dẫn ONECRM" subtitle="Phím tắt & Quy trình vận hành chuẩn">
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">1. Phím tắt điều hướng</h3>
        <ul className="space-y-1 text-xs">
          <li><kbd className="font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Ctrl / Cmd + K</kbd> : Mở Tìm kiếm Toàn hệ thống (Global Search)</li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">2. Luồng vòng đời Khách hàng chuẩn</h3>
        <p className="text-xs leading-relaxed">
          Lead mới → Chấm điểm & Phân công → Chuyển đổi (kiểm tra trùng Email/SĐT) → Tạo Hồ sơ Customer 360° & Cơ hội Bán hàng → Báo giá / Đơn hàng / Hợp đồng → Chăm sóc Đa kênh & Ticket SLA → Chương trình Khách hàng Thân thiết.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">3. Chế độ Demo & Vận hành Thực tế</h3>
        <p className="text-xs leading-relaxed">
          Môi trường dùng thử gắn nhãn DEMO với dữ liệu liên kết đầy đủ 18 phân hệ. Bạn có thể Khôi phục hoặc Xóa sạch dữ liệu mẫu trong <strong>17. Quản trị & Bảo mật</strong> để chuyển sang vận hành chính thức.
        </p>
      </div>
    </div>
  </Modal>
);
