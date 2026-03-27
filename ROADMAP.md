# Roadmap & Phase Guide

## 1. Mục đích file này

File này dùng để theo dõi tiến trình triển khai dự án theo từng phase.

Khác với `README.md`:
- `README.md` tập trung mô tả dự án đang làm được gì và cách sử dụng
- `ROADMAP.md` tập trung mô tả:
  - dự án được chia phase như thế nào
  - mỗi phase đã làm những gì
  - cách test tay từng phase
  - các điểm cần lưu ý khi review

Mentor có thể đọc file này để nắm:
- trình tự triển khai
- phạm vi của từng phase
- trạng thái hoàn thành
- cách kiểm tra từng nhóm chức năng

## 2. Tổng quan tiến độ

| Phase | Tên phase | Trạng thái |
|---|---|---|
| 1 | Project setup & Database | DONE |
| 2 | Auth Module | DONE |
| 3 | Garden & Vegetable Module | DONE |
| 4 | Sales & Reports Module | DONE |
| 5 | MQTT + Sensors + WebSocket | DONE |
| 6 | Hoàn thiện & kiểm thử tổng | TODO / tùy mức polish cuối |

## 3. Phase 1 - Project setup & Database

### 3.1. Mục tiêu

- Khởi tạo project NestJS
- Cấu hình môi trường và module nền
- Setup Prisma + PostgreSQL
- Hoàn thiện schema database
- Chạy migration
- Setup Swagger và ValidationPipe

### 3.2. Đã triển khai

- Tạo project `NestJS`
- Cài dependency nền:
  - Prisma
  - JWT / Passport
  - Swagger
  - MQTT
  - WebSocket
  - Validation
- Setup:
  - `ConfigModule`
  - `.env`
  - `.env.example`
- Setup:
  - `PrismaModule`
  - `PrismaService`
- Viết `schema.prisma`
- Chạy migration database
- Setup partial unique index cho `Vegetable(gardenId, name)` khi `deletedAt IS NULL`
- Setup Swagger tại:
  - `http://localhost:3000/api`
- Setup global `ValidationPipe`

### 3.3. Thành phần chính

- `src/config/`
- `src/prisma/`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `src/main.ts`

### 3.4. Cách test tay

1. Chạy app:

```bash
npm run start:dev
```

2. Mở Swagger:

```text
http://localhost:3000/api
```

3. Chạy lệnh Prisma:

```bash
npm run prisma:validate
npm run prisma:generate
```

4. Kiểm tra app boot không lỗi
5. Kiểm tra DB kết nối thành công

### 3.5. Kết quả mong đợi

- App chạy được
- Swagger mở được
- Prisma generate thành công
- Migration apply thành công
- Schema DB khớp với thiết kế

## 4. Phase 2 - Auth Module

### 4.1. Mục tiêu

- Đăng ký
- Đăng nhập
- JWT authentication
- Role-based authorization
- API lấy thông tin user hiện tại

### 4.2. Đã triển khai

- `UsersModule`
- `AuthModule`
- `LocalStrategy`
- `JwtStrategy`
- `JwtAuthGuard`
- `RolesGuard`
- `@Roles()`
- `@CurrentUser()`
- `@Public()`

Endpoint:
- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`

### 4.3. Logic chính

- Register:
  - validate input
  - hash password
  - tạo user mới
- Login:
  - validate email/password bằng bcrypt
  - trả về `accessToken`
- JWT:
  - verify token
  - attach user vào request
- Role:
  - `ADMIN`
  - `USER`

### 4.4. Cách test tay

#### Happy path

1. `POST /auth/register`
2. `POST /auth/login`
3. Copy `accessToken`
4. Authorize trong Swagger
5. `GET /users/me`

#### Edge cases nên test

- Register email trùng -> `409`
- Register thiếu field -> `400`
- Register email sai format -> `400`
- Login sai password -> `401`
- `GET /users/me` không token -> `401`
- Token sai format -> `401`
- Token rác -> `401`
- Route cần role admin nhưng user thường gọi -> `403`

### 4.5. Kết quả mong đợi

- User tạo được tài khoản
- Login thành công và nhận JWT
- Route protected cần token hợp lệ
- Role hoạt động đúng

## 5. Phase 3 - Garden & Vegetable Module

### 5.1. Mục tiêu

- CRUD garden
- CRUD vegetable
- Quản lý giá hiện tại
- Quản lý lịch sử giá
- Áp ownership theo `garden`

### 5.2. Đã triển khai

#### Gardens

- `POST /gardens`
- `GET /gardens`
- `GET /gardens/:id`
- `PUT /gardens/:id`
- `DELETE /gardens/:id`

#### Vegetables

- `POST /vegetables`
- `GET /vegetables?gardenId=...`
- `PUT /vegetables/:id`
- `DELETE /vegetables/:id`

#### Price

- `POST /vegetables/:id/price`
- `PUT /vegetables/:id/price`
- `DELETE /vegetables/:id/price`
- `GET /vegetables/:id/price`

### 5.3. Logic chính

- Garden và Vegetable dùng `soft delete`
- User chỉ xem được garden của mình
- Admin xem được tất cả
- `GET /vegetables` bắt buộc có `gardenId`
- Không cho trùng tên rau active trong cùng một garden
- Mọi thao tác giá đều ghi vào `PriceHistory`
- Khi soft delete garden, service sẽ soft delete luôn vegetable active bên dưới

### 5.4. Cách test tay

#### Garden

1. Login bằng user thường
2. Tạo garden mới
3. `GET /gardens`
4. `GET /gardens/:id`
5. `PUT /gardens/:id`
6. `DELETE /gardens/:id`

#### Vegetable

1. Tạo vegetable trong garden của mình
2. List vegetable theo `gardenId`
3. Update `name`, `quantityIn`
4. Delete vegetable

#### Price

1. Set giá lần đầu
2. Get giá hiện tại
3. Update giá
4. Delete giá
5. Set lại giá sau khi delete

#### Edge cases nên test

- User truy cập garden của người khác -> `403`
- Admin truy cập garden của user khác -> pass
- `GET /vegetables` không có `gardenId` -> `400`
- Tạo trùng tên rau trong cùng garden -> `409`
- Cùng tên rau ở 2 garden khác nhau -> pass
- Update `quantityIn < quantityOut` -> `400`
- Vegetable đã soft delete -> không update/get price được
- Garden đã soft delete -> không thao tác vegetable mới được

### 5.5. Kết quả mong đợi

- CRUD garden hoạt động đúng
- CRUD vegetable hoạt động đúng
- Ownership đúng
- Price history được ghi đúng
- Soft delete nhất quán

## 6. Phase 4 - Sales & Reports Module

### 6.1. Mục tiêu

- Tạo giao dịch bán
- Tính doanh thu
- Xem lịch sử giá theo thời gian
- Xem doanh thu theo thời gian

### 6.2. Đã triển khai

#### Sales

- `POST /sales`

#### Reports

- `GET /price?gardenId=&period=day|week|month&date=optional&vegetableId=optional`
- `GET /all/price?gardenId=&period=day|week|month&date=optional`

### 6.3. Logic chính

- `POST /sales`
  - check ownership theo `gardenId`
  - check garden active
  - check vegetable active
  - check vegetable thuộc đúng garden
  - check tồn kho
  - check `price != null`
  - tạo `Sale`
  - tăng `quantityOut`
  - thực hiện trong cùng transaction

- `GET /price`
  - nguồn dữ liệu: `PriceHistory`
  - trả danh sách record, không aggregate
  - filter theo `gardenId`
  - `vegetableId` là optional
  - `date` là optional
  - nếu không truyền `date` thì dùng ngày hiện tại theo giờ local
  - `week` bắt đầu từ thứ hai

- `GET /all/price`
  - nguồn dữ liệu: `Sale`
  - aggregate doanh thu theo `day|week|month`
  - `date` là optional
  - nếu không truyền `date` thì dùng ngày hiện tại theo giờ local
  - endpoint này trả tổng hợp theo đúng `period`, không breakdown chi tiết bên trong period

### 6.4. Cách test tay

#### Sales

1. Tạo vegetable có `price`
2. Gọi `POST /sales`
3. Kiểm tra:
  - `Sale` được tạo
  - `quantityOut` tăng đúng
  - `unitPrice` là snapshot đúng thời điểm bán
  - `totalPrice` tính đúng

#### Reports

1. `GET /price` với `gardenId + period`
2. `GET /price` với `gardenId + period + date`
3. `GET /price` với `gardenId + vegetableId + date`
4. `GET /all/price` với `gardenId + period + date`

#### Edge cases nên test

- Bán vượt tồn kho -> `400`
- Bán khi `price = null` -> `400`
- `gardenId` không khớp `vegetableId` -> `400`
- Garden hoặc vegetable đã soft delete -> `404`
- Body có `unitPrice`, `totalPrice`, `quantityOut` -> `400`
- `GET /price` thiếu `gardenId` -> `400`
- `GET /price` hỏi `vegetableId` không thuộc `gardenId` -> `400`
- `GET /all/price` garden người khác -> `403`
- `date` sai format -> `400`
- test tháng ở mốc:
  - `date=2026-01-31&period=month`
  - `date=2026-02-01&period=month`
- test tuần cắt qua tháng:
  - `date=2026-01-26&period=week`

### 6.5. Kết quả mong đợi

- Tạo sale đúng nghiệp vụ
- Snapshot giá bán đúng
- Tồn kho bán ra được cập nhật đúng
- Report giá lấy đúng từ `PriceHistory`
- Report doanh thu lấy đúng từ `Sale`

## 7. Phase 5 - MQTT + Sensors + WebSocket

### 7.1. Mục tiêu

- Nhận dữ liệu sensor qua MQTT
- Lưu `SensorData` vào DB
- Push realtime qua WebSocket
- Điều khiển LED qua MQTT

### 7.2. Đã triển khai

#### MQTT

- Kết nối broker HiveMQ
- Subscribe topic sensor
- Parse payload JSON
- Delegate xuống `SensorsService`
- Publish LED command

#### Sensors

- `GET /sensors?gardenId=&period=day|week|month&date=optional`

#### WebSocket

- JWT auth ở handshake
- Join room theo `gardenId`
- Emit realtime đúng room

#### LED control

- `POST /gardens/:id/led`

### 7.3. Logic chính

#### Sensor flow

1. Thiết bị publish vào topic MQTT
2. `MqttService` nhận message
3. Parse payload
4. `SensorsService` lưu `SensorData`
5. `WsGateway` emit `sensor.updated` vào room đúng `gardenId`

#### WebSocket flow

1. Client kết nối socket bằng JWT
2. Nếu token sai -> bị chặn ngay ở handshake bằng `connect_error`
3. Nếu token hợp lệ -> socket được kết nối
4. Client gửi `garden.join`
5. Server check ownership
6. Nếu pass -> `garden.joined`
7. Nếu fail -> `garden.join.error`

#### LED flow

1. Client gọi `POST /gardens/:id/led`
2. Update desired state trong DB
3. Publish MQTT command
4. Nếu publish thành công -> update `ledSyncedAt`

### 7.4. Cách test tay

#### Sensors

1. Gọi `GET /sensors?gardenId=...&period=day`
2. Dùng MQTTX publish sensor message vào topic sensor
3. Gọi lại `GET /sensors`
4. Kiểm tra có record mới
5. Test thêm `date=YYYY-MM-DD` để xem dữ liệu của ngày / tuần / tháng cụ thể

#### WebSocket

1. Connect socket bằng JWT hợp lệ
2. Gửi `garden.join`
3. Kiểm tra nhận `garden.joined`
4. Publish sensor data vào MQTT
5. Kiểm tra socket nhận `sensor.updated`

#### LED

1. Gọi `POST /gardens/:id/led`
2. Subscribe MQTT topic điều khiển LED bằng MQTTX
3. Kiểm tra có message gửi đúng topic
4. Kiểm tra DB update `ledSyncedAt`

#### Edge cases nên test

- MQTT payload không phải JSON -> không lưu DB
- MQTT payload sai schema -> không lưu DB
- `GET /sensors` thiếu `gardenId` -> `400`
- User đọc sensor garden người khác -> `403`
- `date` sai format -> `400`
- `period=week` bắt đầu từ thứ hai
- Token WebSocket sai -> `connect_error`
- Join sai garden -> `garden.join.error`
- Body LED rỗng -> `400`
- User khác điều khiển LED -> `403`
- Garden soft delete -> không query sensor, không điều khiển LED được

### 7.5. Kết quả mong đợi

- Sensor data được lưu đúng
- Realtime đúng room
- Token sai bị chặn ở handshake
- Join room có ownership check
- LED control publish đúng ra broker

## 8. Phase 6 - Hoàn thiện & kiểm thử tổng

### 8.1. Mục tiêu

- Polish tài liệu
- Rà lại consistency của error message
- Rà lại README
- Kiểm thử end-to-end toàn bộ flow

### 8.2. Gợi ý test tổng thể

Flow nên test từ đầu đến cuối:

1. Register / Login
2. Tạo garden
3. Tạo vegetable
4. Set giá
5. Tạo sale
6. Xem report giá
7. Xem report doanh thu
8. Publish sensor data qua MQTT
9. Xem realtime qua WebSocket
10. Điều khiển LED qua API và kiểm tra MQTT topic

### 8.3. Ghi chú

Một số điểm đã nhận diện nhưng chưa ưu tiên xử lý:
- Race condition khi register đồng thời
- Race condition oversell khi nhiều request bán đồng thời
- Login với email có khoảng trắng đầu/cuối có thể fail do `LocalAuthGuard` đọc raw body trước DTO transform

## 9. Gợi ý cho mentor khi review

Nếu muốn review nhanh, có thể đọc theo thứ tự:

1. `README.md`
2. `prisma/schema.prisma`
3. `ROADMAP.md`
4. Module theo thứ tự:
   - `auth`
   - `gardens`
   - `vegetables`
   - `sales`
   - `reports`
   - `mqtt`
   - `sensors`
   - `websocket`
