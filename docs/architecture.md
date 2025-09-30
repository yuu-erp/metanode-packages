# 🏗️ Tài liệu Thiết kế Kiến trúc Backend Microservices

> **Phiên bản**: v1.0  
> **Ngày**: YYYY-MM-DD  
> **Người soạn**: [Tên / Team]

---

## 1. Tổng quan (Executive Summary)

- **Mục tiêu hệ thống**:  
  _[Mô tả ngắn gọn mục tiêu kinh doanh / domain chính]_  
- **Phạm vi**:  
  _[Định nghĩa phạm vi của hệ thống, các actor liên quan]_  
- **Công nghệ chính**:  
  - Ngôn ngữ:  
  - Framework:  
  - Database:  
  - Message Broker:  
  - API Gateway:  
  - Orchestration (Kubernetes / ECS / khác):  

---

## 2. Bối cảnh hệ thống (System Context)

- **Mô tả**:  
  _[Mô tả hệ thống tương tác với các bên ngoài như thế nào]_  
- **Actor bên ngoài**:  
  | Actor      | Vai trò                                |
  |------------|----------------------------------------|
  | User       | Sử dụng ứng dụng                       |
  | PartnerAPI | Nhận dữ liệu thanh toán                 |

- **Sơ đồ Context (C4 Model Level 1)**:  
  ![System Context Diagram](./diagrams/system-context.png)

---

## 3. Kiến trúc dịch vụ (Service Architecture)

- **Danh sách các dịch vụ**:  
  | Service         | Chức năng chính                 | Giao tiếp |
  |-----------------|---------------------------------|-----------|
  | Auth Service    | Đăng nhập, xác thực             | REST/gRPC |
  | Order Service   | Quản lý đơn hàng                | REST/gRPC |
  | Payment Service | Xử lý thanh toán                | Kafka     |

- **Sơ đồ Container (C4 Model Level 2)**:  
  ![Container Diagram](./diagrams/container.png)

- **Luồng chính (ví dụ: tạo đơn hàng)**:  
  _[Vẽ sequence diagram mô tả các bước service gọi nhau]_  

---

## 4. Kiến trúc dữ liệu (Data Architecture)

- **Chiến lược database**:  
  - Database per service (khuyến nghị)  
  - Loại DB: SQL / NoSQL / Event Store / Cache Layer  

- **Sơ đồ dữ liệu tổng quát (ERD high-level)**:  
  ![Data Diagram](./diagrams/data-model.png)

- **Chiến lược đồng bộ**:  
  - Eventual consistency (saga / outbox)  
  - Two-phase commit (nếu cần transaction chéo service)

---

## 5. Thiết kế API

- **Chuẩn giao tiếp**: REST / gRPC / GraphQL  
- **Versioning**: `/v1/...`  
- **AuthN / AuthZ**: JWT / OAuth2 / mTLS  
- **Nguyên tắc an toàn**:  
  - Rate limit  
  - Idempotency  
  - Circuit breaker / retry  

---

## 6. Hạ tầng & Triển khai (Infra & Deployment)

- **Kiến trúc triển khai**:  
  _[Mô tả cluster, region, multi-AZ, LB, ingress, gateway]_  
- **CI/CD**: GitHub Actions / GitLab CI / ArgoCD  
- **Quản lý secrets & config**: Vault / SSM / ConfigMap  
- **Observability**:  
  - Logging: ELK stack  
  - Metrics: Prometheus + Grafana  
  - Tracing: OpenTelemetry + Jaeger  

---

## 7. Yêu cầu phi chức năng (NFRs)

| Thuộc tính            | Mục tiêu                 |
|-----------------------|--------------------------|
| Độ sẵn sàng (HA)      | 99.9%                    |
| Độ trễ trung bình API | < 200ms                  |
| Bảo mật               | TLS 1.3, dữ liệu mã hoá   |
| Khả năng mở rộng      | Horizontal scaling k8s    |

---

## 8. Vận hành & Bảo trì (Operational Concerns)

- Chiến lược migration DB  
- Quy trình rollback  
- Playbook xử lý sự cố phổ biến  
- Kế hoạch backup & restore  

---

## 9. Rủi ro & Trade-off

- **Quyết định kiến trúc quan trọng**:  
  - _Chọn Kafka thay RabbitMQ vì throughput tốt hơn_  
  - _Dùng CQRS cho Order Service, trade-off: phức tạp hơn_

---

## 10. Định hướng tương lai

- Mở rộng thêm service X  
- Tích hợp AI recommendation engine  
- Refactor legacy module Y  

---

## Phụ lục

- ADR (Architecture Decision Records)  
- Link tới Swagger / Protobuf / GraphQL schema  
- Link tới repo code chính  

---

> 📌 **Lưu ý**: Tài liệu này phải được **cập nhật liên tục** mỗi khi có thay đổi kiến trúc.

