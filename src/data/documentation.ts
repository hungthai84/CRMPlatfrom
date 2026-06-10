export const RAW_DOCUMENTATION = `
# 1. Sơ đồ kiến trúc chuyển đổi số CRM (Architecture Roadmap)
**Kiến trúc tổng thể của hệ thống sẽ được chia thành các lớp sau:**
- **Frontend Layer**: Web App cho nội bộ (React/Next.js/Tailwind), Mobile App cho đội field sales & quản lý (React Native), Cổng thông tin khách hàng (Customer Portal).
- **API Gateway Layer**: NGINX/Kong, Request Routing, Rate Limiting, Authentication qua OAuth2/OIDC an toàn.
- **Microservices Layer**: Customer Service, Sales Service, Marketing Service, Ticket Service, AI Insight Service, Workflow Engine. Giúp dễ dàng mở rộng và bảo trì mà không nghẽn cổ chai.
- **Message Broker**: Hệ thống sự kiện sử dụng Apache Kafka / RabbitMQ. Đảm bảo luồng đi mượt mà (VD: Có Ticket mới -> Tự động trigger Workflow Cảnh báo SLA).
- **Data Layer**:
  - *Primary DB*: PostgreSQL (Xử lý dữ liệu cấu trúc, giao dịch Sales).
  - *NoSQL*: MongoDB (Lưu Logs, dữ liệu phi cấu trúc, JSON documents).
  - *Cache Layer*: Redis (Sessions, tối ưu tốc độ đọc API).
  - *Search Engine*: Elasticsearch (Tìm kiếm toàn văn cho hồ sơ Khách hàng và Knowledge Base cực nhanh).
- **Integration Layer**: Webhooks, REST/GraphQL APIs, ERP/POS Adaptors, 3rd-party connectors (Zalo OA, Facebook, Shopee, v.v).

---

# 2. ERD Database Hoàn Chỉnh (Lược đồ lõi)
Hệ thống xoay quanh thực thể **Customer** hoặc **Account**.
- **User & Security**: \`Users\`, \`Roles\`, \`Permissions\`, \`Departments\`.
- **Customer 360 Layer**: \`Contacts\`, \`Accounts\`, \`Memberships\`, \`Loyalty_Histories\`.
- **Sales Layer**: \`Leads\`, \`Opportunities\`, \`Quotes\`, \`Contracts\`, \`SalesOrders\`.
- **Service Layer**: \`Tickets\`, \`SLA_Policies\`, \`CS_Surveys\`, \`Interactions_Log\`.
- **Marketing Layer**: \`Campaigns\`, \`Campaign_Members\`, \`Automation_Flows\`.
- **Knowledge Layer**: \`Articles\`, \`Categories\`, \`SOPs\`.

---

# 3. Danh sách module chi tiết
Hệ thống được chia làm 5 phân hệ lớn:
1. **Core Platform**: Quản lý truy cập, IAM, RBAC, Cài đặt hệ thống, Security Audits.
2. **Customer Management (CDP Lite)**: Quản lý Hồ sơ 360, Segment Khách hàng, Tổ chức tập đoàn, VIP Tiers.
3. **Sales Cloud**: Opportunity Management (Dạng Kanban), Báo giá tự động PDF, Hợp đồng, Lead Scoring.
4. **Service Cloud**: Ticketing System (Theo SLA), Knowledge Base nội bộ & khách hàng, Omnichannel Inbox (gom FB, Zalo, Web, Zalo vào 1 luồng).
5. **Marketing Cloud**: Email/SMS Campaigns, Automation Flows kéo thả (Customer Journey). Báo cáo ROI.

---

# 4. User Flow (Ví dụ: Quy trình chuyển đổi khách hàng B2B)
1. **Marketing** chạy Campaign hội thảo -> Add Leads vào CRM.
2. **Lead Assignment Rules** tự động gán Lead cho team Sales tùy thuộc khu vực/ngành nghề.
3. **Sales Representative** gọi điện -> Qualify (đạt tiêu chuẩn) -> Convert thành Contact & tạo Opportunity mới.
4. Sale kéo Opportunity qua các bước Kanban (Qualify -> Proposal -> Negotiation).
5. Khi ở bước **Negotiation**, Sale nhấn "Generate Quote" để xuất báo giá động kèm chiết khấu được duyệt (Approval Workflow).
6. Khách hàng xem qua Email Tracking, đồng ý -> Cấu hình Opportunity thành *Closed Won*.
7. Tự động trigger đẩy data qua **Hệ thống ERP** để xuất hóa đơn.

---

# 5. Use Case Diagram (Tổng thể Quyền Hạn)
- **Marketing Staff**: Lên kịch bản Customer Journey, Quản lý các mẫu Email, Theo dõi ngân sách Campaign.
- **Sales Staff**: Check Kanban Pipeline hàng ngày, thực hiện log các cuộc gọi, tạo báo giá, chốt đơn.
- **CS Staff**: Túc trực Inbox đa kênh, phân loại Ticket, tra cứu Knowledge Base để trả lời và đóng Ticket kịp SLA.
- **C-Level / Managers**: Xem Dashboard tổng quan theo thời gian thực, duyệt các luồng giảm giá ngoại lệ (Approval), đổi KPIs.

---

# 6. Database Schema (Complete Relational Structure - PostgreSQL)
To meet the enterprise requirement, here is the complete relational logical schema for all modules:

\`\`\`sql
-- USER MANAGEMENT & RBAC
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- 'Super Admin', 'CRM Admin', 'Sales Staff', etc.
    description TEXT
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    resource VARCHAR(100), -- 'Tickets', 'Customers'
    action VARCHAR(50) -- 'Read', 'Write', 'Delete'
);

CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id),
    permission_id INT REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    role_id INT REFERENCES roles(id),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMERS & LEADS
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    company VARCHAR(150),
    address TEXT,
    loyalty_tier VARCHAR(50), -- 'Silver', 'Gold', etc.
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to UUID REFERENCES users(id)
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(150),
    source VARCHAR(100), -- 'Facebook', 'Website', 'Event'
    status VARCHAR(50), -- 'New', 'Qualified', 'Lost'
    lead_score INT DEFAULT 0,
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SALES CRM
CREATE TABLE opportunities (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   title VARCHAR(255) NOT NULL,
   customer_id UUID REFERENCES customers(id),
   owner_id UUID REFERENCES users(id),
   stage VARCHAR(50) NOT NULL, -- 'Proposal', 'Negotiation', 'Won'
   amount DECIMAL(15,2),
   probability INT CHECK (probability >= 0 AND probability <= 100),
   expected_close_date DATE,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMER SERVICE
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    assigned_to UUID REFERENCES users(id),
    type VARCHAR(100), -- 'Complaint', 'Warranty', 'Technical Support'
    priority VARCHAR(50), -- 'Low', 'High', 'Urgent'
    status VARCHAR(50), -- 'Open', 'InProgress', 'Closed'
    subject VARCHAR(255),
    description TEXT,
    sla_breach_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LOYALTY MANAGEMENT
CREATE TABLE loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    current_tier VARCHAR(50),
    total_points INT DEFAULT 0,
    redeemable_points INT DEFAULT 0,
    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TASK MANAGEMENT
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    status VARCHAR(50), -- 'Pending', 'Completed'
    owner_id UUID REFERENCES users(id),
    related_to_type VARCHAR(50), -- 'Lead', 'Customer', 'Opportunity'
    related_to_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EXECUTIONS & SURVEYS
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- 'NPS', 'CSAT'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id),
    customer_id UUID REFERENCES customers(id),
    score INT,
    feedback TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MARKETING
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- 'Email', 'SMS', 'Zalo'
    status VARCHAR(50),
    budget DECIMAL(15,2),
    start_date DATE,
    end_date DATE
);
\`\`\`

---

# 7. API Specification (REST Core Example)
Hỗ trợ chuẩn RESTful cho bên thứ 3 và frontend:
- \`GET /api/v1/customers\` (List/Filter Customers)
- \`GET /api/v1/customers/:id/360\` (Bóc tách profile toàn diện cho màn hình C360)
- \`POST /api/v1/opportunities\` (Tạo cơ hội bán hàng mới)
- \`PATCH /api/v1/tickets/:id\` (Thay đổi trạng thái Ticket hoặc SLA)
- \`POST /api/v1/webhooks/zalo\` (Nhận tin nhắn Zalo OA thời gian thực)

---

# 8. Wireframe UI
*(Vui lòng sử dụng các tính năng ở thanh điều hướng bên trái của phần mềm DEMO này để trải nghiệm UI/UX Enterprise thực tế do AI thiết kế. Hệ thống hỗ trợ Navbar, Main Content, Customer 360, Kanban).*

---

# 9. Dashboard KPI Tổng Thể
Một trung tâm chỉ huy số liệu (Command Center):
- **C-Level View**: Doanh thu T-1, Giá trị vòng đời (CLV), Tỉ lệ giữ chân.
- **Sales View**: Phễu chuyển đổi (Conversion Tube), Cơ hội dự kiến (Forecast), Win/Loss Ratio.
- **Service View**: Khối lượng Ticket mới (Volume), Tỉ lệ giải quyết ở phản hồi đầu (FCR), ART (Average Resolution Time), CSAT.

---

# 10. Roadmap triển khai 12 tháng (Hồ sơ Vendor)
- **Tháng 1-2**: Requirement Gathering & System Architecture (Chốt Scope, ký kết, dựng Prototype).
- **Tháng 3-5**: Core Platform & Sales Cloud (Dev, API, Database structuring).
- **Tháng 6-7**: Service Cloud & Omnichannel Routing Engine.
- **Tháng 8-9**: Marketing Cloud (Automation Builder) & Loyalty Logic.
- **Tháng 10**: Tích hợp Hệ sinh thái mở rộng (ERP, POS, Payment Gateways).
- **Tháng 11**: UAT (User Acceptance Testing) & Training Core Team & Sạch hóa dữ liệu.
- **Tháng 12**: Go-live (Chạy thực tế) & Giai đoạn Hypercare (Hỗ trợ 24/7 sau Go-live 1 tháng).

---

# 11. Ước tính Nhân sự triển khai (Vendor IT Team)
Đội hình Agile Tối ưu:
- 1 Project Manager (Scrum Master).
- 2 Business Analysts (Lấy yêu cầu và vẽ quy trình).
- 1 Solution Architect (Kiến trúc Cloud & App).
- 4 Backend Developers (NodeJS Core).
- 4 Frontend Developers (ReactJS Dashboard & PWA).
- 2 QA/QC Testers.
- 1 DevOps/Cloud Engineer.

---

# 12. Ước tính chi phí đầu tư (Tham khảo cấp Enterprise Custom)
- **Custom Build (CAPEX, Phí xay dựng 1 lần)**: $150,000 - $350,000 tùy độ phức tạp của Tích hợp Legacy Systems (ERP cũ).
- **Cloud & Usage (OPEX, Phí vận hành định kì)**: $3,000 - $5,000 / tháng (Bao gồm AWS K8s Infrastructure, API Twilio/Zalo, Email SES, Elasticsearch nodes).
- *Lưu ý: Mua SaaS truyền thống có thể rẻ hơn lúc đầu nhưng bị khóa license ($50-$150/user/month). Xây dựng riêng ở cấp Enterprise thì CAPEX cao lúc đầu, nhưng Break-even tại năm thứ 3 nếu cty có > 200 users.*

---

# 13. Rủi ro & Phương án giảm thiểu (Risk Management)
1. **Kháng cự sự thay đổi từ Sales Team (Họ quen dùng Excel/Zalo cá nhân)**:
   - *Xử lý*: UI phải xuất sắc và tiện lợi hơn Zalo/Excel. Phải có chính sách từ C-Level (Không có trên CRM thì k ghi nhận hoa hồng).
2. **Migration - Dữ liệu cũ bị trùng lặp, thiếu thông tin (Dirty Data)**:
   - *Xử lý*: Chạy các script AI Cleansing và Deduping (Gộp trùng) kéo dài 3-4 tuần trước khi Go-live chính thức.

---

# 14. Kế hoạch tích hợp AI 
AI không chỉ là Chatbot, nó là Insight:
- **Phase 1 (Quick Win)**: Tích hợp GenAI để tóm tắt lịch sử Ticket siêu dài, và Suggestion Replies dựa trên Knowledge Base.
- **Phase 2 (Predictive, Sau 6 tháng)**: AI Lead Scoring (chấm điểm Lead dựa trên độ tươi, điểm chạm) => Auto ưu tiên gọi.
- **Phase 3 (Prescriptive, Sau 1 năm)**: Hệ thống AI Recommendation Next-Best-Action - Gợi ý Sales nên gọi vào giờ nào, chào sản phẩm Upsell gì tiếp theo với KH Cụ thể.

---

# 15. Tầm nhìn mở rộng Hệ thống 5 năm tới
- Nâng cấp thành **Customer Data Platform (CDP)** hội tụ dữ liệu Real-time cực lớn để xử lý quảng cáo Programmatic Ads tự động.
- Kiến trúc **Multi-Tenant** để Mở thêm công ty con (Subsidiaries) chung 1 server nhưng Data Isolate.
- Xây dựng **Partner/Franchise Portal**: Cổng riêng cho Đại lý đăng nhập, xem báo giá, đặt hàng B2B tự động không cần chat tay.
`;
