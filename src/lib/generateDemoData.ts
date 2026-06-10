import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const generateDemoCustomers = async (userId: string) => {
  const demoCustomersData = [
    {
      name: 'Nguyễn Văn An',
      email: 'an.nguyen@vietnamtech.com',
      phone: '0901234567',
      tier: 'Platinum' as const,
      loyaltyPoints: 12500,
      segment: 'High Value',
      lifetimeValue: 156000000,
      churnRisk: 'Low' as const,
      type: 'Khách hàng',
      status: 'Hoạt động',
      tags: ['VIP', 'Đã ký hợp đồng', 'Doanh nghiệp'],
      noteText: '[Ghi âm giọng nói - 08/06/2026 14:15] Đã chốt hợp đồng cung cấp hạ tầng máy chủ CyberCore. Khách rất hài lòng và đề xuất thanh toán trả trước 100% để nhận thêm 2 tháng bảo trì miễn phí.',
      journeyStage: 'Purchase' as const,
      journeySentiment: 'Happy' as const,
    },
    {
      name: 'Trần Thị Bích',
      email: 'bich.tran@corporate.vn',
      phone: '0987654321',
      tier: 'Diamond' as const,
      loyaltyPoints: 45000,
      segment: 'Corporate',
      lifetimeValue: 850000000,
      churnRisk: 'Medium' as const,
      type: 'Khách hàng',
      status: 'Hoạt động',
      tags: ['Khách VIP', 'Đại diện mua hàng', 'Tập đoàn'],
      noteText: '[Ghi âm giọng nói - 09/06/2026 09:30] Thảo luận về việc mở rộng giấy phép phần mềm CRM cho 50 chi nhánh khu vực miền Tây. Khách hàng yêu cầu họp trực tiếp (Offline) tại Trụ sở chính vào tuần tới.',
      journeyStage: 'Loyalty' as const,
      journeySentiment: 'Happy' as const,
    },
    {
      name: 'Lê Hoàng Phong',
      email: 'phong.le@gmail.com',
      phone: '0912345678',
      tier: 'Member' as const,
      loyaltyPoints: 150,
      segment: 'Retail',
      lifetimeValue: 2500000,
      churnRisk: 'High' as const,
      type: 'Tiềm năng',
      status: 'Chờ xử lý',
      tags: ['Liên hệ lại', 'Zalo Lead', 'Mới'],
      noteText: '[Ghi âm giọng nói - 05/06/2026 10:20] Khách hàng cá nhân tìm hiểu gói cá nhân. Tương tác có vẻ giảm sút, đã mời vào nhóm trải nghiệm miễn phí 7 ngày nhưng khách chưa kích hoạt tài tài khoản.',
      journeyStage: 'Consideration' as const,
      journeySentiment: 'Neutral' as const,
    },
    {
      name: 'Phạm Minh Đức',
      email: 'duc.pham@smartsolutions.com.vn',
      phone: '0933445566',
      tier: 'Gold' as const,
      loyaltyPoints: 5800,
      segment: 'SME',
      lifetimeValue: 120000000,
      churnRisk: 'Low' as const,
      type: 'Khách hàng',
      status: 'Hoạt động',
      tags: ['Tiềm năng lớn', 'Đang đề xuất', 'Dịch vụ đám mây'],
      noteText: '[Ghi âm giọng nói - 07/06/2026 16:45] Đang đề xuất triển khai giải pháp ảo hóa đám mây cho văn phòng đại diện. Đức phản hồi tích cực và đang xin ngân sách từ công ty mẹ tại Singapore.',
      journeyStage: 'Consideration' as const,
      journeySentiment: 'Happy' as const,
    },
    {
      name: 'Hoàng Ngọc Bảo',
      email: 'bao.hoang@retailx.vn',
      phone: '0955667788',
      tier: 'Silver' as const,
      loyaltyPoints: 1200,
      segment: 'Retail',
      lifetimeValue: 45000000,
      churnRisk: 'Low' as const,
      type: 'Khách hàng',
      status: 'Hoạt động',
      tags: ['Bán lẻ', 'Khách hàng cũ', 'Có sinh nhật tuần này'],
      noteText: '[Ghi âm âm giọng nói] Khách hàng thân thiết mua lẻ phần cứng. Ghi nhận thông tin bảo hành ổ cứng SSD 1TB miễn phí đến hết tháng 12/2026.',
      journeyStage: 'Retention' as const,
      journeySentiment: 'Neutral' as const,
    },
    {
      name: 'Huỳnh Thanh Trúc',
      email: 'truc.huynh@fashionstar.vn',
      phone: '0900112233',
      tier: 'Platinum' as const,
      loyaltyPoints: 18000,
      segment: 'Corporate',
      lifetimeValue: 340000000,
      churnRisk: 'Medium' as const,
      type: 'Khách hàng',
      status: 'Hoạt động',
      tags: ['Thời trang', 'Nợ tốt', 'Đã chốt vụ xuân hè'],
      noteText: '[Ghi âm giọng nói - 02/06/2026 11:15] Đã tư vấn gói tiếp thị tự động Email và Zalo. Khách đồng ý nâng cấp gói dịch vụ để chuẩn bị cho chuỗi chiến dịch Black Friday sắp tới.',
      journeyStage: 'Loyalty' as const,
      journeySentiment: 'Happy' as const,
    },
    {
      name: 'Phan Quốc Bảo',
      email: 'baopq@logisticsvn.com',
      phone: '0899887766',
      tier: 'Member' as const,
      loyaltyPoints: 420,
      segment: 'SME',
      lifetimeValue: 12000000,
      churnRisk: 'High' as const,
      type: 'Tiềm năng',
      status: 'Tạm ngưng',
      tags: ['Chờ báo giá', 'Nguồn Website', 'Chưa liên hệ được'],
      noteText: 'Gặp sự cố kết nối điện thoại. Đã gửi Email báo giá hạ tầng IoT giám sát container lạnh nhưng chưa nhận nhận được phản hồi.',
      journeyStage: 'Awareness' as const,
      journeySentiment: 'Frustrated' as const,
    },
    {
      name: 'Vũ Nhật Tú',
      email: 'tu.vu@educationtech.edu.vn',
      phone: '0977889900',
      tier: 'Gold' as const,
      loyaltyPoints: 8500,
      segment: 'Corporate',
      lifetimeValue: 210000000,
      churnRisk: 'Low' as const,
      type: 'Khách hàng',
      status: 'Hoạt động',
      tags: ['Đào tạo', 'Trung tâm Anh ngữ', 'Ưu tú'],
      noteText: '[Ghi âm giọng nói - 08/06/2026 15:30] Khách hàng gia hạn gói hệ thống eLearning cho 12 tháng kế tiếp. Yêu cầu bổ sung thêm tính năng học trực tuyến qua video độ phân giải cao.',
      journeyStage: 'Retention' as const,
      journeySentiment: 'Happy' as const,
    }
  ];

  try {
    const batch = writeBatch(db);
    const createdCustomerRefs: { id: string; name: string }[] = [];
    const now = Date.now();

    // 1. Seed Customers & Customer Journeys Touchpoints
    for (let i = 0; i < demoCustomersData.length; i++) {
      const data = demoCustomersData[i];
      const newDocRef = doc(collection(db, 'customers'));
      
      batch.set(newDocRef, {
        ...data,
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      createdCustomerRefs.push({ id: newDocRef.id, name: data.name });

      // Generate custom touchpoints depending on stage
      const touchpointsCol = collection(db, 'customers', newDocRef.id, 'touchpoints');
      
      const touchpointTemplates: { [key: string]: any[] } = {
        'Awareness': [
          { title: 'Nhấp liên kết Quảng cáo Facebook', desc: 'Nhấp vào quảng cáo ra mắt giải pháp AI-Support CRM.', channel: 'website', sentiment: 'Neutral', daysAgo: 10 },
          { title: 'Xem trang bảng giá hệ thống', desc: 'Đã dành 4 phút phân tích tính năng so sánh các gói SME và Premium.', channel: 'website', sentiment: 'Neutral', daysAgo: 8 },
          { title: 'Đăng ký nhận tài liệu sản phẩm', desc: 'Để lại thông tin nhận tài liệu kiến trúc kỹ thuật hệ thống.', channel: 'email', sentiment: 'Happy', daysAgo: 5 }
        ],
        'Consideration': [
          { title: 'Tham gia Webinar trải nghiệm AI', desc: 'Đã hoàn thành khảo sát và phản hồi tích cực về khả năng AI chuyển giọng nói thành văn bản.', channel: 'meeting', sentiment: 'Happy', daysAgo: 12 },
          { title: 'Yêu cầu gọi lại báo giá chi tiết', desc: 'Chuyên viên CRM đã liên hệ giải đáp thắc mắc về phân quyền và bảo mật cloud.', channel: 'phone', sentiment: 'Neutral', daysAgo: 6 },
          { title: 'Hỏi đáp qua Zalo cá nhân', desc: 'Đang thảo luận chi tiết điều khoản bảo hành linh kiện SSD đám mây và hạ tầng ảo hoá.', channel: 'zalo', sentiment: 'Happy', daysAgo: 2 }
        ],
        'Purchase': [
          { title: 'Mở email đề xuất dịch vụ', desc: 'Hệ thống tự động ghi nhận tệp đính kèm bảng chào thầu đã được đối tác xem qua.', channel: 'email', sentiment: 'Neutral', daysAgo: 14 },
          { title: 'Đàm phán phụ lục hợp đồng', desc: 'Gặp gỡ trực tuyến thống nhất tỷ lệ chiết khấu thanh toán trước 12 tháng.', channel: 'meeting', sentiment: 'Happy', daysAgo: 7 },
          { title: 'Ký kết hợp đồng thành công', desc: 'Đã thanh toán đợt 1 và khởi tạo tài khoản quản trị Admin tổng.', channel: 'system', sentiment: 'Happy', daysAgo: 1 }
        ],
        'Retention': [
          { title: 'Phát sinh yêu cầu kỹ thuật ERP', desc: 'Gửi ticket phàn nàn lỗi đồng bộ dữ liệu POS và tệp ERP cũ tại chi nhánh.', channel: 'ticket', sentiment: 'Frustrated', daysAgo: 15 },
          { title: 'Họp khẩn cấp tối ưu hóa SLA', desc: 'Đội trưởng kỹ thuật đã gọi điện giải quyết lỗi đồng bộ và đền bù SLA thoả đáng.', channel: 'phone', sentiment: 'Neutral', daysAgo: 8 },
          { title: 'Phản hồi hài lòng chất lượng hỗ trợ', desc: 'Khách hàng điền khảo sát 5 sao và đánh giá cao tính chuyên nghiệp của agent.', channel: 'chat', sentiment: 'Happy', daysAgo: 3 }
        ],
        'Loyalty': [
          { title: 'Được vinh danh làm đối tác vàng', desc: 'Đạt doanh số tích luỹ Diamond, gửi quà tặng tri ân đặc biệt cuối năm.', channel: 'system', sentiment: 'Happy', daysAgo: 30 },
          { title: 'Tham gia hội thảo chuyên đề PowerCRM', desc: 'Đưa phản hồi trải nghiệm thực tế xuất sắc trước 100 khách mời doanh nghiệp.', channel: 'meeting', sentiment: 'Happy', daysAgo: 15 },
          { title: 'Giới thiệu khách hàng mới (Referral)', desc: 'Huỳnh Thanh Trúc đã gửi link đăng ký trực tiếp giới thiệu cho đơn vị thành viên.', channel: 'zalo', sentiment: 'Happy', daysAgo: 4 }
        ]
      };

      const templates = touchpointTemplates[data.journeyStage] || touchpointTemplates['Consideration'];
      
      for (const t of templates) {
        const tpDocRef = doc(touchpointsCol);
        batch.set(tpDocRef, {
          customerId: newDocRef.id,
          title: t.title,
          description: t.desc,
          channel: t.channel,
          sentiment: t.sentiment,
          timestamp: now - t.daysAgo * 864 * 100000 // converts days to ms slightly offset
        });
      }
    }

    // 2. Seed Tickets (Linked to seeded customers)
    const demoTicketsData = [
      {
        title: 'Lỗi đồng bộ hóa ERP - POS ở cửa hàng Quận 1',
        description: 'Dữ liệu tồn kho không khớp giữa hệ thống POS và phần mềm ERP trung tâm sau phiên hoạt động ngày hôm qua.',
        category: 'technical',
        priority: 'high',
        status: 'new',
        source: 'chat'
      },
      {
        title: 'Yêu cầu tùy chỉnh xuất báo cáo PDF tự động',
        description: 'Khách hàng muốn có thêm tuỳ chọn xuất báo cáo tổng doanh thu theo định dạng PDF gửi trực tiếp qua Email hàng tuần.',
        category: 'product',
        priority: 'medium',
        status: 'processing',
        source: 'email'
      },
      {
        title: 'Than phiền về chậm trễ lắp đặt phần cứng',
        description: 'Đội ngũ kỹ thuật chưa bàn giao máy chủ ảo VPN đúng hạn theo cam kết trong hợp đồng dịch vụ thiết lập hệ thống.',
        category: 'complaint',
        priority: 'urgent',
        status: 'pending',
        source: 'zalo'
      }
    ];

    for (let i = 0; i < demoTicketsData.length; i++) {
      const ticketData = demoTicketsData[i];
      const linkedCustomer = createdCustomerRefs[i % createdCustomerRefs.length];
      const newDocRef = doc(collection(db, 'tickets'));
      const padId = (i + 1).toString().padStart(4, '0');
      
      batch.set(newDocRef, {
        ...ticketData,
        ticketId: `YT-2026-${padId}`,
        customerId: linkedCustomer.id,
        customerName: linkedCustomer.name,
        ownerId: userId,
        slaDeadline: now + (i === 2 ? -3600000 : 86400000), // Overdue for complaint
        createdAt: now,
        updatedAt: now
      });
    }

    // 3. Seed Campaigns
    const demoCampaignsData = [
      {
        name: 'Chiến dịch Khởi động Hè 2026',
        type: 'Email',
        status: 'Active',
        budget: 50000000,
        spent: 12500000,
        leads: 320,
        conversion: 18.2,
        startDate: '2026-05-01',
        endDate: '2026-06-30'
      },
      {
        name: 'Sự kiện Tri ân Khách hàng VIP Diamond',
        type: 'Call',
        status: 'Active',
        budget: 150000000,
        spent: 98000000,
        leads: 120,
        conversion: 45.5,
        startDate: '2026-06-01',
        endDate: '2026-06-15'
      },
      {
        name: 'Quảng cáo Zalo Tiếp thị Tự động Q3',
        type: 'Social',
        status: 'Draft',
        budget: 35000000,
        spent: 0,
        leads: 0,
        conversion: 0,
        startDate: '2026-07-01',
        endDate: '2026-08-31'
      }
    ];

    for (const campaign of demoCampaignsData) {
      const newDocRef = doc(collection(db, 'campaigns'));
      batch.set(newDocRef, campaign);
    }

    // 4. Seed Audit Logs
    const demoAuditLogsData = [
      {
        action: 'Khởi tạo hành trình & dữ liệu mẫu CRM 360',
        details: 'Đã đồng loạt tạo 8 khách hàng kèm 28 mốc lịch sử hành trình (touchpoints), 3 phiếu hỗ trợ liên kết và nhật ký phân quyền hoàn chỉnh.',
        userEmail: 'hungthai84@gmail.com',
        role: 'Super Admin',
        timestamp: now
      },
      {
        action: 'Đã cập nhật cấu hình bảo mật ghi nhớ phiên đăng nhập',
        details: 'Hệ thống đã bật lưu phiên đăng nhập lâu dài 30 ngày an toàn (remember_me).',
        userEmail: 'hungthai84@gmail.com',
        role: 'Super Admin',
        timestamp: now - 3600000
      },
      {
        action: 'Đã kích hoạt tính năng Voice Notes & Shortcuts',
        details: 'Bản beta cho phép ghi âm gặp gỡ trực tiếp chuyển tự động từ giọng nói sang văn bản, đồng thời bật phím tắt Cmd+K & Cmd+N.',
        userEmail: 'hungthai84@gmail.com',
        role: 'Super Admin',
        timestamp: now - 7200000
      }
    ];

    for (const log of demoAuditLogsData) {
      const newDocRef = doc(collection(db, 'audit_logs'));
      batch.set(newDocRef, log);
    }

    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error generating demo data:', err);
    throw err;
  }
};
