# Garden_SN

Backend NestJS cho hệ thống IoT quản lý khu vườn.

## 1. Tổng quan

Hệ thống phục vụ các nhu cầu chính:

- 1 user có nhiều garden
- quản lý garden và vegetable theo từng user
- quản lý giá hiện tại và lịch sử giá
- tạo giao dịch bán hàng và tính doanh thu
- nhận dữ liệu cảm biến từ thiết bị qua MQTT
- đẩy dữ liệu thời gian thực qua WebSocket
- điều khiển LED cho từng garden
- xác thực JWT và phân quyền `ADMIN` / `USER`

Điểm chốt của dự án:

- `1 User -> N Garden`

## 2. Công nghệ sử dụng

- Backend: `NestJS`
- Database: `PostgreSQL`
- ORM: `Prisma 7`
- Authentication: `JWT`, `Passport`
- Validation: `class-validator`, `class-transformer`
- API docs: `Swagger`
- IoT: `MQTT`
- Realtime: `Socket.IO`

## 3. Cách chạy dự án

### Cài dependency

```bash
npm install
```

### Prisma

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:dev
```

### Chạy app

```bash
npm run start:dev
```

Swagger:

```text
http://localhost:3000/api
```

## 4. Cấu trúc source

```text
src/
├─ config/
├─ common/
├─ prisma/
├─ modules/
│  ├─ auth/
│  ├─ users/
│  ├─ gardens/
│  ├─ vegetables/
│  ├─ sales/
│  ├─ reports/
│  ├─ mqtt/
│  ├─ sensors/
│  └─ websocket/
├─ app.module.ts
└─ main.ts
```

Ý nghĩa:

- `config/`: cấu hình app, jwt, mqtt
- `common/`: decorator, guard, enum, service, util dùng chung
- `prisma/`: `PrismaModule`, `PrismaService`
- `modules/`: toàn bộ code nghiệp vụ

## 5. Thiết kế dữ liệu

Schema nằm ở:

- `prisma/schema.prisma`

### 5.1. Bảng chính

`User`
- lưu thông tin người dùng
- hỗ trợ role `ADMIN` / `USER`

`Garden`
- thuộc về một user
- có 3 trạng thái LED
- dùng soft delete

`Vegetable`
- thuộc về một garden
- lưu số lượng nhập, số lượng đã bán, giá hiện tại
- dùng soft delete

`PriceHistory`
- lưu lịch sử thay đổi giá

`Sale`
- lưu lịch sử giao dịch bán
- `unitPrice` là snapshot tại thời điểm bán
- `totalPrice` được tính ở server

`SensorData`
- lưu nhiệt độ, độ ẩm theo thời gian

### 5.2. Quan hệ

- `User 1 - N Garden`
- `Garden 1 - N Vegetable`
- `Garden 1 - N SensorData`
- `Vegetable 1 - N PriceHistory`
- `Vegetable 1 - N Sale`

### 5.3. Precision quan trọng

- `Vegetable.price`, `PriceHistory.price`, `Sale.unitPrice`: `Decimal(10,2)`
- `Sale.totalPrice`: `Decimal(14,2)`
- `Vegetable.quantityIn`, `Vegetable.quantityOut`, `Sale.quantity`: `Decimal(10,2)`
- `SensorData.temperature`, `SensorData.humidity`: `Decimal(5,2)`

### 5.4. Partial unique index

Tên vegetable chỉ được unique trong cùng garden khi record còn active.

SQL:

```sql
CREATE UNIQUE INDEX "vegetable_garden_name_active_unique"
ON "Vegetable" ("gardenId", "name")
WHERE "deletedAt" IS NULL;
```

## 6. Rule nghiệp vụ đã chốt

### 6.1. Quyền truy cập

- `ADMIN` thấy và quản lý toàn bộ garden
- `USER` chỉ thao tác trên garden của mình
- quyền ở `vegetable`, `sale`, `sensor`, `report`, `websocket room` đều đi qua ownership của garden

### 6.2. Soft delete

- `Garden` và `Vegetable` dùng `deletedAt`
- mọi query active đều phải lọc `deletedAt: null`
- khi soft delete `Garden`, service soft delete luôn `Vegetable` active bên dưới

### 6.3. Tồn kho

- `quantityOut` không sửa trực tiếp ở `vegetables`
- `quantityOut` chỉ tăng trong `SalesService`
- luôn giữ `quantityOut <= quantityIn`

### 6.4. Giá

- `Vegetable.price` là giá hiện tại
- mọi thao tác set / update / delete giá đều ghi `PriceHistory`
- `GET /vegetables/:id/price` lấy giá hiện tại
- `GET /price` lấy danh sách lịch sử giá từ `PriceHistory`

### 6.5. Sale

- `POST /sales` không nhận `unitPrice`, `totalPrice` từ client
- `unitPrice` lấy từ `Vegetable.price` tại thời điểm bán
- `totalPrice = quantity * unitPrice`
- tạo `Sale` và tăng `quantityOut` trong cùng transaction

### 6.6. LED

- DB lưu `desired state`
- flow: API nhận request -> update DB -> publish MQTT -> nếu publish thành công thì update `ledSyncedAt`
- nếu `ledSyncedAt < updatedAt` thì hiểu là còn lệnh chưa sync xuống thiết bị

## 7. Trạng thái theo phase

### Phase 1 - Setup & Database

Trạng thái: `DONE`

Đã làm:

- setup project NestJS
- setup `ConfigModule`, `.env`, `.env.example`
- setup Prisma + PostgreSQL
- migrate schema
- setup partial unique index
- setup `PrismaModule`, `PrismaService`
- setup Swagger
- setup global `ValidationPipe`

### Phase 2 - Auth

Trạng thái: `DONE`

Đã có:

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `JwtAuthGuard`
- `RolesGuard`
- `@Roles()`
- `@CurrentUser()`
- `@Public()`

### Phase 3 - Gardens & Vegetables

Trạng thái: `DONE`

Đã có:

- CRUD `gardens`
- CRUD `vegetables`
- CRUD giá trong `vegetables/:id/price`
- soft delete `garden`
- soft delete `vegetable`
- ownership guard cho `garden` và `vegetable`

### Phase 4 - Sales & Reports

Trạng thái: `DONE`

Đã có:

- `POST /sales`
- `GET /price?gardenId=&period=day|week|month&vegetableId=optional`
- `GET /all/price?gardenId=&period=day|week|month`

Nguồn dữ liệu:

- report giá lấy từ `PriceHistory`
- report doanh thu lấy từ `Sale`

### Phase 5 - MQTT + Sensors + WebSocket

Trạng thái: `DONE`

Đã có:

- `MqttModule`
- `SensorsModule`
- `WsModule`
- `GET /sensors?gardenId=&period=day|week|month`
- `POST /gardens/:id/led`

MQTT:

- subscribe topic `garden/+/sensor`
- parse JSON và validate payload sensor
- lưu DB qua `SensorsService`
- publish LED command ra `garden/{gardenId}/led/control`

Sensors:

- lưu `SensorData` khi nhận dữ liệu từ MQTT
- query dữ liệu theo `gardenId` và `period`
- chỉ owner hoặc admin mới xem được

WebSocket:

- xác thực JWT lúc handshake
- client join room bằng `garden.join`
- join thành công trả `garden.joined`
- join sai quyền trả `garden.join.error`
- lỗi auth trả `auth.error`
- sensor realtime emit bằng `sensor.updated` đúng room `garden:{id}`

LED control:

- API update desired state trong DB trước
- publish MQTT sau
- publish thành công mới cập nhật `ledSyncedAt`
- nếu broker lỗi thì trả `503`, nhưng desired state vẫn giữ trong DB

### Phase 6 - Hoàn thiện & kiểm thử cuối

Trạng thái: `TODO`

## 8. API hiện có

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`

### Gardens

- `POST /gardens`
- `GET /gardens`
- `GET /gardens/:id`
- `PUT /gardens/:id`
- `POST /gardens/:id/led`
- `DELETE /gardens/:id`

### Vegetables

- `POST /vegetables`
- `GET /vegetables?gardenId=...`
- `PUT /vegetables/:id`
- `DELETE /vegetables/:id`
- `POST /vegetables/:id/price`
- `PUT /vegetables/:id/price`
- `DELETE /vegetables/:id/price`
- `GET /vegetables/:id/price`

### Sales & Reports

- `POST /sales`
- `GET /price?gardenId=&period=day|week|month&vegetableId=optional`
- `GET /all/price?gardenId=&period=day|week|month`

### Sensors

- `GET /sensors?gardenId=&period=day|week|month`

## 9. Ghi chú

- để test WebSocket bằng Postman, nên listen các event:
  - `garden.joined`
  - `garden.join.error`
  - `sensor.updated`
  - `auth.error`
- với Socket.IO, không dùng event tên `error` cho lỗi nghiệp vụ vì dễ làm client test hiểu nhầm là lỗi kết nối
