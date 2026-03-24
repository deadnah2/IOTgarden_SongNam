# Garden_SN

## 1. Mục tiêu dự án

Xây dựng hệ thống IoT quản lý khu vườn bằng `NestJS + PostgreSQL + Prisma`, có:
- quản lý nhiều khu vườn theo user
- quản lý rau, tồn kho, giá bán
- lưu lịch sử bán hàng và tính doanh thu
- nhận dữ liệu cảm biến qua MQTT
- đẩy realtime qua WebSocket
- điều khiển LED qua MQTT
- xác thực JWT và phân quyền `ADMIN` / `USER`

Điểm chốt nghiệp vụ đã thống nhất:
- `1 User có nhiều Garden`

## 2. Stack kỹ thuật đã chốt

- Backend: `NestJS`
- Database: `PostgreSQL`
- ORM: `Prisma 7`
- Auth: `JWT`, `Passport`
- IoT: `MQTT`
- Realtime: `WebSocket` / `socket.io`
- API docs: `Swagger`
- Validation: `class-validator`, `class-transformer`
- Password hash: `bcrypt`

## 3. Trạng thái hiện tại

### Đã hoàn thành

`Phase 1 - Project setup & Database`

Đã làm xong:
- tạo project NestJS mới tại `d:\huibeta\songnam\garden_SN`
- cài dependency nền
- setup `ConfigModule`
- setup `.env` và `.env.example`
- setup Prisma 7 theo kiểu mới với `prisma.config.ts`
- setup `PrismaModule` và `PrismaService`
- viết schema Prisma final
- chạy migration init thành công
- thêm migration raw SQL cho partial unique index
- generate Prisma Client thành công
- setup Swagger trong `main.ts`
- setup global `ValidationPipe`

### Đã verify

Đã chạy thành công:
- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run build`

### Trạng thái source hiện tại

Đã có:
- `src/config/`
- `src/prisma/`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `prisma.config.ts`

Chưa làm:
- `auth/`
- `users/`
- `common/`
- `gardens/`
- `vegetables/`
- `sales/`
- `reports/`
- `mqtt/`
- `sensors/`
- `websocket/`

## 4. Cách chạy dự án

```bash
npm install
```

```bash
npm run start:dev
```

Swagger:

```text
http://localhost:3000/api
```

Prisma:

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:studio
```

## 5. Cấu trúc hiện tại

```text
garden_SN/
├─ src/
│  ├─ config/
│  │  ├─ app.config.ts
│  │  ├─ jwt.config.ts
│  │  └─ mqtt.config.ts
│  ├─ prisma/
│  │  ├─ prisma.module.ts
│  │  └─ prisma.service.ts
│  ├─ app.module.ts
│  └─ main.ts
├─ prisma/
│  ├─ migrations/
│  ├─ manual-partial-index.sql
│  └─ schema.prisma
├─ prisma.config.ts
├─ .env
└─ .env.example
```

## 6. Database final đã chốt

Schema nguồn hiện tại nằm ở:
- `prisma/schema.prisma`

### Enum

- `Role`: `ADMIN`, `USER`
- `LedState`: `On`, `Off`
- `PriceAction`: `SET`, `UPDATE`, `DELETE`

### Bảng User

Ý nghĩa:
- lưu tài khoản người dùng
- một user có nhiều garden

Trường chính:
- `id`
- `email` unique
- `name`
- `password`
- `role`
- `createdAt`
- `updatedAt`

### Bảng Garden

Ý nghĩa:
- khu vườn thuộc về một user
- lưu desired state của 3 LED
- dùng soft delete

Trường chính:
- `id`
- `name`
- `userId`
- `led1State`
- `led2State`
- `led3State`
- `ledSyncedAt`
- `createdAt`
- `updatedAt`
- `deletedAt`

Quan hệ:
- `Garden -> User`
- `Garden -> Vegetable[]`
- `Garden -> SensorData[]`

### Bảng Vegetable

Ý nghĩa:
- rau thuộc về một garden
- có tồn kho nhập, tồn kho bán
- giá hiện tại lưu ở `price`
- lịch sử giá lưu riêng ở `PriceHistory`
- dùng soft delete

Trường chính:
- `id`
- `name`
- `quantityIn`
- `quantityOut`
- `price`
- `gardenId`
- `createdAt`
- `updatedAt`
- `deletedAt`

Quan hệ:
- `Vegetable -> Garden`
- `Vegetable -> Sale[]`
- `Vegetable -> PriceHistory[]`

### Bảng PriceHistory

Ý nghĩa:
- lưu lịch sử thao tác giá
- hỗ trợ các API xem giá theo thời gian

Trường chính:
- `id`
- `vegetableId`
- `price`
- `action`
- `createdAt`

Ghi chú:
- `price` có thể `null` khi action là `DELETE`

### Bảng Sale

Ý nghĩa:
- lưu lịch sử giao dịch bán
- `unitPrice` là snapshot giá tại thời điểm bán
- `totalPrice` tính ở server-side

Trường chính:
- `id`
- `vegetableId`
- `gardenId`
- `quantity`
- `unitPrice`
- `totalPrice`
- `soldAt`

Thiết kế quan trọng:
- `gardenId` trong `Sale` chỉ là scalar để query nhanh
- toàn vẹn dữ liệu được đảm bảo bằng composite relation:
  `Sale(vegetableId, gardenId) -> Vegetable(id, gardenId)`

### Bảng SensorData

Ý nghĩa:
- lưu dữ liệu cảm biến nhiệt độ và độ ẩm theo thời gian

Trường chính:
- `id`
- `gardenId`
- `temperature`
- `humidity`
- `recordedAt`

## 7. Rule nghiệp vụ đã chốt

### Ownership và phân quyền

- `ADMIN` thấy và quản lý toàn bộ garden
- `USER` chỉ thấy và quản lý garden của mình
- mọi thao tác trên `Vegetable`, `Sale`, `SensorData` phải đi qua check ownership của `Garden`

### Soft delete

`Garden` và `Vegetable` dùng `deletedAt`

Hệ quả bắt buộc ở service layer:
- mọi query mặc định phải lọc `deletedAt: null`
- không tạo `Sale` cho `Vegetable` đã soft delete
- không sửa giá cho `Vegetable` đã soft delete
- không thao tác trên `Garden` đã soft delete

### Tồn kho

- `quantityOut` không cho endpoint khác sửa trực tiếp
- `quantityOut` chỉ được update trong `SalesService` bằng transaction
- luôn đảm bảo:

```text
quantityOut <= quantityIn
```

### Giá và lịch sử giá

- giá hiện tại lưu trong `Vegetable.price`
- mọi thao tác set/update/delete giá phải đồng thời ghi `PriceHistory`
- hành vi nên thực hiện trong transaction

### Sale

- `totalPrice` không nhận từ client
- `totalPrice = quantity * unitPrice`
- `unitPrice` là snapshot lúc bán, không phụ thuộc `Vegetable.price` sau này

### LED

Thiết kế đang hiểu theo hướng:
- DB lưu desired state
- API update trạng thái đèn
- publish MQTT
- khi publish thành công thì cập nhật `ledSyncedAt`

## 8. Partial unique index quan trọng

Do `Vegetable` dùng soft delete nên không thể dùng:

```prisma
@@unique([gardenId, name])
```

Lý do:
- nếu soft delete một rau rồi, vẫn phải cho phép tạo lại rau cùng tên trong cùng garden

Giải pháp đã áp dụng:
- dùng raw SQL migration để tạo partial unique index chỉ cho record active

SQL đã dùng:

```sql
CREATE UNIQUE INDEX "vegetable_garden_name_active_unique"
ON "Vegetable" ("gardenId", "name")
WHERE "deletedAt" IS NULL;
```

File liên quan:
- `prisma/manual-partial-index.sql`
- `prisma/migrations/20260324091200_add_vegetable_active_unique_index/migration.sql`

## 9. Quy ước module sẽ triển khai

Mục tiêu cấu trúc cuối cùng:

```text
src/
├─ config/
├─ common/
├─ prisma/
└─ modules/
   ├─ auth/
   ├─ users/
   ├─ gardens/
   ├─ vegetables/
   ├─ sales/
   ├─ reports/
   ├─ mqtt/
   ├─ sensors/
   └─ websocket/
```

Giải thích nhanh:
- `config/`: config app, jwt, mqtt
- `common/`: decorator, guard, filter, pipe dùng chung
- `prisma/`: PrismaModule và PrismaService global
- `modules/`: toàn bộ module nghiệp vụ của dự án
  - `auth/`: register, login, local strategy, jwt strategy
  - `users/`: lấy user phục vụ auth và profile
  - `gardens/`: CRUD garden
  - `vegetables/`: CRUD vegetable và giá
  - `sales/`: giao dịch bán hàng
  - `reports/`: thống kê giá và doanh thu
  - `mqtt/`: integration layer cho MQTT
  - `sensors/`: lưu và query dữ liệu sensor
  - `websocket/`: realtime gateway

## 10. Roadmap theo phase

### Phase 1 - Project setup & Database

Trạng thái: `DONE`

Checklist:
- [x] Khởi tạo NestJS project
- [x] Cài dependency nền
- [x] Setup ConfigModule + `.env`
- [x] Setup Prisma + PostgreSQL
- [x] Viết schema Prisma final
- [x] Chạy migration init
- [x] Thêm partial unique index bằng raw SQL migration
- [x] Setup PrismaModule + PrismaService
- [x] Setup Swagger trong `main.ts`
- [x] Setup global ValidationPipe

### Phase 2 - Auth Module

Trạng thái: `TODO`

Mục tiêu:
- `UsersModule + UsersService`
  - `findByEmail`
  - `findById`
- `LocalStrategy + JwtStrategy`
- `POST /auth/register`
- `POST /auth/login`
- common auth components:
  - `JwtAuthGuard`
  - `RolesGuard`
  - `@Roles()`
  - `@CurrentUser()`

Logic chốt:
- register: hash password rồi mới lưu user
- login: validate email/password bằng bcrypt, trả về JWT access token
- `JwtStrategy` decode token rồi attach user cho request

### Phase 3 - Garden & Vegetable Module

Trạng thái: `TODO`

Mục tiêu:
- `GardensModule`
  - `POST /gardens`
  - `GET /gardens`
  - `GET /gardens/:id`
  - `PUT /gardens/:id`
  - `DELETE /gardens/:id`
- `GardenOwnershipGuard` trong `common/guards`
- `VegetablesModule`
  - `POST /vegetables`
  - `GET /vegetables`
  - `PUT /vegetables/:id`
  - `DELETE /vegetables/:id`
- `PriceService` trong `VegetablesModule`
  - `POST /vegetables/:id/price`
  - `PUT /vegetables/:id/price`
  - `DELETE /vegetables/:id/price`
  - `GET /vegetables/:id/price`

Logic chốt:
- Garden delete là soft delete
- Vegetable delete là soft delete
- mọi query phải lọc `deletedAt: null`
- user chỉ thấy garden của mình, admin thấy tất cả
- mọi thao tác giá phải ghi `PriceHistory`

### Phase 4 - Sales & Reports Module

Trạng thái: `TODO`

Mục tiêu:
- `SalesModule`
  - `POST /sales`
- `ReportsModule`
  - `GET /price?period=day|week|month`
  - `GET /all/price?period=day|week|month`

Logic chốt:
- tạo sale bằng transaction
- validate tồn kho trước khi bán
- update `quantityOut` trong cùng transaction
- `totalPrice` tính server-side
- report giá lấy từ `PriceHistory`
- report doanh thu lấy từ `Sale`

### Phase 5 - MQTT + Sensors + WebSocket

Trạng thái: `TODO`

Mục tiêu:
- `MqttModule`
  - kết nối HiveMQ
  - subscribe sensor topic
  - publish LED control
- `SensorsModule`
  - lưu `SensorData`
  - `GET /sensors?gardenId=&period=`
- LED control qua MQTT
  - `POST /gardens/:id/led`
- `WebSocket Gateway`
  - xác thực JWT lúc handshake
  - client join room theo `gardenId`
  - push realtime sensor data đúng room

Logic chốt:
- `mqtt/` chỉ là integration layer, không chứa business logic nặng
- message từ MQTT parse xong delegate xuống `SensorsService`
- WebSocket chỉ push realtime, không tự tính logic nghiệp vụ

### Phase 6 - Hoàn thiện & kiểm thử

Trạng thái: `TODO`

Mục tiêu:
- thêm Swagger annotation đầy đủ
- xử lý Decimal serialization trong response
- chuẩn hóa exception/filter
- test toàn bộ flow bằng Swagger/Postman/MQTTX

Flow test cuối nên cover:
- đăng ký
- đăng nhập
- tạo garden
- thêm vegetable
- set giá
- bán hàng
- xem report
- publish sensor data
- theo dõi realtime
- điều khiển LED

## 11. Endpoint định hướng cần có

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`

### Gardens

- `POST /gardens`
- `GET /gardens`
- `GET /gardens/:id`
- `PUT /gardens/:id`
- `DELETE /gardens/:id`

### Vegetables

- `POST /vegetables`
- `GET /vegetables`
- `PUT /vegetables/:id`
- `DELETE /vegetables/:id`
- `POST /vegetables/:id/price`
- `PUT /vegetables/:id/price`
- `DELETE /vegetables/:id/price`
- `GET /vegetables/:id/price`

### Sales / Reports

- `POST /sales`
- `GET /price?period=day|week|month`
- `GET /all/price?period=day|week|month`

### Sensors / IoT

- `GET /sensors?gardenId=&period=day|week|month`
- `POST /gardens/:id/led`

