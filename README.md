# Garden_SN

## 1. Muc tieu du an

Xay dung he thong IoT quan ly khu vuon bang `NestJS + PostgreSQL + Prisma`, gom:
- quan ly nhieu garden theo user
- quan ly vegetable, ton kho, gia hien tai va lich su gia
- tao giao dich ban hang va tinh doanh thu
- nhan du lieu sensor qua MQTT
- day realtime qua WebSocket
- dieu khien LED qua MQTT
- xac thuc JWT va phan quyen `ADMIN` / `USER`

Business rule da chot:
- `1 User co nhieu Garden`

## 2. Stack ky thuat

- Backend: `NestJS`
- Database: `PostgreSQL`
- ORM: `Prisma 7`
- Auth: `JWT`, `Passport`
- Validation: `class-validator`, `class-transformer`
- Password hash: `bcrypt`
- API docs: `Swagger`
- IoT: `MQTT`
- Realtime: `WebSocket` / `socket.io`

## 3. Trang thai hien tai

Da hoan thanh:
- `Phase 1 - Project setup & Database`
- `Phase 2 - Auth Module`
- `Phase 3 - Garden & Vegetable Module`
- `Phase 4 - Sales & Reports Module`

Chua lam:
- `Phase 5 - MQTT + Sensors + WebSocket`
- `Phase 6 - Hoan thien & kiem thu cuoi`

Da verify thuc te:
- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run build`
- test tay bang API that cho `auth`, `gardens`, `vegetables`, `price`, `sales`, `reports`

## 4. Cach chay du an

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

## 5. Cau truc source hien tai

```text
garden_SN/
|-- src/
|   |-- common/
|   |-- config/
|   |   |-- app.config.ts
|   |   |-- jwt.config.ts
|   |   `-- mqtt.config.ts
|   |-- modules/
|   |   |-- auth/
|   |   |-- gardens/
|   |   |-- reports/
|   |   |-- sales/
|   |   |-- users/
|   |   `-- vegetables/
|   |-- prisma/
|   |   |-- prisma.module.ts
|   |   `-- prisma.service.ts
|   |-- app.module.ts
|   `-- main.ts
|-- prisma/
|   |-- migrations/
|   |-- manual-partial-index.sql
|   `-- schema.prisma
|-- prisma.config.ts
|-- .env
`-- .env.example
```

## 6. Database da chot

Schema nguon hien tai nam o:
- `prisma/schema.prisma`

### Enum

- `Role`: `ADMIN`, `USER`
- `LedState`: `On`, `Off`
- `PriceAction`: `SET`, `UPDATE`, `DELETE`

### User

Y nghia:
- luu tai khoan nguoi dung
- mot user co nhieu garden

Field chinh:
- `id`
- `email` unique
- `name`
- `password`
- `role`
- `createdAt`
- `updatedAt`

### Garden

Y nghia:
- garden thuoc ve mot user
- luu desired state cua 3 LED
- dung soft delete

Field chinh:
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

Quan he:
- `Garden -> User`
- `Garden -> Vegetable[]`
- `Garden -> SensorData[]`
- `Sale.gardenId` tham chieu Garden o muc nghiep vu de query/report, nhung khong khai bao Prisma relation truc tiep

### Vegetable

Y nghia:
- rau thuoc ve mot garden
- co ton kho nhap, ton kho da ban
- gia hien tai luu o `price`
- lich su gia luu rieng o `PriceHistory`
- dung soft delete

Field chinh:
- `id`
- `name`
- `quantityIn`
- `quantityOut`
- `price`
- `gardenId`
- `createdAt`
- `updatedAt`
- `deletedAt`

Quan he:
- `Vegetable -> Garden`
- `Vegetable -> Sale[]`
- `Vegetable -> PriceHistory[]`

### PriceHistory

Y nghia:
- luu lich su thao tac gia
- phuc vu `GET /price`

Field chinh:
- `id`
- `vegetableId`
- `price`
- `action`
- `createdAt`

Ghi chu:
- `price` co the `null` khi `action = DELETE`

### Sale

Y nghia:
- luu lich su giao dich ban
- `unitPrice` la snapshot gia tai thoi diem ban
- `totalPrice` tinh o server-side

Field chinh:
- `id`
- `vegetableId`
- `gardenId`
- `quantity`
- `unitPrice`
- `totalPrice`
- `soldAt`

Thiet ke quan trong:
- `gardenId` trong `Sale` la scalar de query nhanh
- toan ven du lieu duoc dam bao bang composite relation:
  `Sale(vegetableId, gardenId) -> Vegetable(id, gardenId)`

### SensorData

Y nghia:
- luu du lieu nhiet do, do am theo thoi gian

Field chinh:
- `id`
- `gardenId`
- `temperature`
- `humidity`
- `recordedAt`

### Precision quan trong

- `Vegetable.price`, `PriceHistory.price`, `Sale.unitPrice`: `Decimal(10,2)`
- `Sale.totalPrice`: `Decimal(14,2)`
- `Vegetable.quantityIn`, `Vegetable.quantityOut`, `Sale.quantity`: `Decimal(10,2)`
- `SensorData.temperature`, `SensorData.humidity`: `Decimal(5,2)`

## 7. Rule nghiep vu da chot

### Ownership va phan quyen

- `ADMIN` thay va quan ly toan bo garden
- `USER` chi thay va quan ly garden cua minh
- moi thao tac tren `Vegetable`, `Sale`, `SensorData`, `PriceHistory report` deu phai di qua check ownership cua `Garden`

### Soft delete

`Garden` va `Vegetable` dung `deletedAt`

Rule bat buoc:
- moi query active mac dinh loc `deletedAt: null`
- khong thao tac tren `Garden` da soft delete
- khong thao tac tren `Vegetable` da soft delete
- khi soft delete `Garden`, service se soft delete luon toan bo `Vegetable` active ben duoi trong cung transaction

### Ton kho

- `quantityOut` khong duoc sua truc tiep bang endpoint `vegetables`
- `quantityOut` chi duoc update trong `SalesService`
- luon dam bao:

```text
quantityOut <= quantityIn
```

### Gia va lich su gia

- gia hien tai luu trong `Vegetable.price`
- moi thao tac `set/update/delete` gia phai ghi them `PriceHistory`
- `GET /vegetables/:id/price` la doc gia hien tai
- `GET /price` la doc danh sach lich su gia tu `PriceHistory`, khong phai aggregate

### Sale

- `POST /sales` khong nhan `unitPrice`, `totalPrice` tu client
- `totalPrice = quantity * unitPrice`
- `unitPrice` la snapshot gia tai thoi diem ban
- tao sale va tang `quantityOut` trong cung transaction
- neu transaction fail thi DB khong doi dang nua chung

### Report

- `GET /price` lay du lieu tu `PriceHistory`
- `GET /all/price` lay du lieu tu `Sale`
- `GET /price` hien tai chi xem duoc ky hien tai:
  - `period=day` -> ngay hien tai
  - `period=week` -> tuan hien tai
  - `period=month` -> thang hien tai
- chua ho tro truyen ngay moc nhu `date=2026-03-10`

### LED

Rule da chot:
- DB luu desired state, tuc la trang thai ma API muon thiet bi thuc hien
- flow: API nhan request -> update DB -> publish MQTT -> neu publish thanh cong thi update `ledSyncedAt`
- neu `ledSyncedAt < updatedAt` thi hieu la dang co lenh chua sync xuong thiet bi
- conflict giua desired state va actual state cua thiet bi chua xu ly trong scope hien tai

## 8. Partial unique index

Do `Vegetable` dung soft delete nen khong dung:

```prisma
@@unique([gardenId, name])
```

Ly do:
- can cho phep tao lai rau cung ten trong cung garden sau khi record cu da bi soft delete

Giai phap da dung:
- raw SQL migration tao partial unique index chi cho record active

SQL:

```sql
CREATE UNIQUE INDEX "vegetable_garden_name_active_unique"
ON "Vegetable" ("gardenId", "name")
WHERE "deletedAt" IS NULL;
```

File lien quan:
- `prisma/manual-partial-index.sql`
- `prisma/migrations/20260324091200_add_vegetable_active_unique_index/migration.sql`

## 9. Cau truc module

```text
src/
|-- config/
|-- common/
|-- prisma/
`-- modules/
    |-- auth/
    |-- users/
    |-- gardens/
    |-- vegetables/
    |-- sales/
    |-- reports/
    |-- mqtt/
    |-- sensors/
    `-- websocket/
```

Giai thich:
- `config/`: config app, jwt, mqtt
- `common/`: decorator, guard, filter, pipe dung chung
- `prisma/`: PrismaModule va PrismaService global
- `modules/`: toan bo module nghiep vu

## 10. Roadmap theo phase

### Phase 1 - Project setup & Database

Trang thai: `DONE`

Checklist:
- [x] Khoi tao NestJS project
- [x] Cai dependency nen
- [x] Setup ConfigModule + `.env`
- [x] Setup Prisma + PostgreSQL
- [x] Viet schema Prisma final
- [x] Chay migration init
- [x] Them partial unique index bang raw SQL migration
- [x] Setup PrismaModule + PrismaService
- [x] Setup Swagger trong `main.ts`
- [x] Setup global ValidationPipe

### Phase 2 - Auth Module

Trang thai: `DONE`

Da co:
- `UsersModule + UsersService`
  - `findByEmail`
  - `findById`
- `AuthModule`
  - `POST /auth/register`
  - `POST /auth/login`
- common auth components:
  - `JwtAuthGuard`
  - `RolesGuard`
  - `@Roles()`
  - `@CurrentUser()`
  - `@Public()`

Logic chot:
- register: hash password roi moi luu user
- login: validate email/password bang bcrypt, tra ve JWT access token
- `JwtStrategy` decode token roi attach user cho request
- `JwtAuthGuard` va `RolesGuard` duoc apply global bang `APP_GUARD`

Open issue da biet, chua fix:
- login voi email co khoang trang dau/cuoi hien tai co the fail do `LocalAuthGuard` / `passport-local` doc raw body truoc khi DTO transform co hieu luc

### Phase 3 - Garden & Vegetable Module

Trang thai: `DONE`

Da co:
- `GardensModule`
  - `POST /gardens`
  - `GET /gardens`
  - `GET /gardens/:id`
  - `PUT /gardens/:id`
  - `DELETE /gardens/:id`
- `GardenOwnershipGuard` trong `common/guards`
- `VegetablesModule`
  - `POST /vegetables`
  - `GET /vegetables?gardenId=`
  - `PUT /vegetables/:id`
  - `DELETE /vegetables/:id`
- `PriceService` trong `VegetablesModule`
  - `POST /vegetables/:id/price`
  - `PUT /vegetables/:id/price`
  - `DELETE /vegetables/:id/price`
  - `GET /vegetables/:id/price`

Logic chot:
- garden delete la soft delete
- vegetable delete la soft delete
- user chi thay garden cua minh, admin thay tat ca
- `GET /vegetables` bat buoc co `gardenId`
- moi thao tac gia phai ghi `PriceHistory`
- khi xoa mem garden, service xoa mem luon vegetable con active

### Phase 4 - Sales & Reports Module

Trang thai: `DONE`

Da co:
- `SalesModule`
  - `POST /sales`
- `ReportsModule`
  - `GET /price?gardenId=&period=day|week|month&vegetableId=optional`
  - `GET /all/price?gardenId=&period=day|week|month`

#### 4.1 SalesModule

Request body:

```json
{
  "gardenId": 1,
  "vegetableId": 10,
  "quantity": 2.5
}
```

Rule nghiep vu:
- route dung `GardenOwnershipGuard` theo `body.gardenId`
- service check `Garden` con active
- service check `Vegetable` con active
- service check `Vegetable` thuoc dung `gardenId`
- service check `Vegetable.price != null`
- service check ton kho:
  - `available = quantityIn - quantityOut`
  - `quantity <= available`
- tao `Sale` va tang `Vegetable.quantityOut` trong cung transaction
- `unitPrice` lay tu `Vegetable.price` tai thoi diem ban
- `totalPrice` tinh o server-side
- response da serialize Decimal thanh number

Nhung gi client khong duoc tu truyen:
- `unitPrice`
- `totalPrice`
- `quantityOut`

Do project dang dung:
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`

nen cac field thua se bi `400`, khong bi ignore.

#### 4.2 ReportsModule - GET /price

Y nghia:
- lay danh sach `PriceHistory` theo `gardenId`
- `vegetableId` la optional filter
- khong aggregate `min/max/avg`

Response hien tai moi record gom:
- `id`
- `vegetableId`
- `vegetableName`
- `action`
- `price`
- `createdAt`

Rule:
- route dung `GardenOwnershipGuard` theo `query.gardenId`
- neu co `vegetableId` thi phai thuoc dung `gardenId`
- chi cho query vegetable con active
- chi lay record cua vegetable con active
- `period=day|week|month` hien tai duoc tinh theo thoi diem hien tai cua server

Vi du:
- `period=day` -> danh sach record trong ngay hien tai
- `period=week` -> danh sach record trong tuan hien tai
- `period=month` -> danh sach record trong thang hien tai

#### 4.3 ReportsModule - GET /all/price

Y nghia:
- report doanh thu theo thoi gian
- du lieu lay tu `Sale`

Response hien tai:

```json
{
  "total": 45,
  "data": [
    {
      "periodStart": "2026-03-25T00:00:00.000Z",
      "salesCount": 2,
      "totalQuantity": 3.5,
      "totalRevenue": 45
    }
  ]
}
```

Rule:
- route dung `GardenOwnershipGuard` theo `query.gardenId`
- aggregate theo `date_trunc(day|week|month, soldAt)` bang PostgreSQL
- du lieu raw tu `$queryRaw` duoc serialize lai truoc khi tra API
  - `bigint -> number`
  - `decimal text -> number`

#### 4.4 Phase 4 da test thuc te

Da test tay va verify DB cho cac case:
- sale khi chua co gia -> `400`
- sale `quantity = 0` -> `400`
- sale `quantity < 0` -> `400`
- sale body co field thua -> `400`
- sale vuot ton kho -> `400`
- sale fail giua chung -> DB khong doi
- sale `gardenId` khong khop `vegetableId` -> `400`
- user ban vao garden nguoi khac -> `403`
- admin ban o garden cua user khac -> pass
- vegetable soft delete -> `404`
- garden soft delete -> `404`
- `GET /price` thieu `gardenId` -> `400`
- `GET /price` garden nguoi khac -> `403`
- `GET /price` garden rong -> `[]`
- `GET /price` voi `vegetableId` sai garden -> `400`
- `GET /price` voi `vegetableId` da soft delete -> bi chan
- `GET /all/price` thieu `gardenId` -> `400`
- `GET /all/price` garden nguoi khac -> `403`
- `GET /all/price` garden rong -> `{ total: 0, data: [] }`

### Phase 5 - MQTT + Sensors + WebSocket

Trang thai: `TODO`

Muc tieu:
- `MqttModule`
  - ket noi HiveMQ
  - subscribe sensor topic
  - publish LED control
- `SensorsModule`
  - luu `SensorData`
  - `GET /sensors?gardenId=&period=`
- LED control qua MQTT
  - `POST /gardens/:id/led`
- `WebSocket Gateway`
  - xac thuc JWT luc handshake
  - client join room theo `gardenId`
  - push realtime sensor data dung room

### Phase 6 - Hoan thien & kiem thu

Trang thai: `TODO`

Muc tieu:
- them Swagger annotation day du
- xu ly Decimal serialization dong bo
- chuan hoa exception/filter
- test toan bo flow bang Swagger/Postman/MQTTX

## 11. Endpoint hien tai

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
- `GET /vegetables?gardenId=`
- `PUT /vegetables/:id`
- `DELETE /vegetables/:id`
- `POST /vegetables/:id/price`
- `PUT /vegetables/:id/price`
- `DELETE /vegetables/:id/price`
- `GET /vegetables/:id/price`

### Sales / Reports

- `POST /sales`
- `GET /price?gardenId=&period=day|week|month&vegetableId=optional`
- `GET /all/price?gardenId=&period=day|week|month`

## 12. File quan trong can doc truoc neu ban giao tiep

Core:
- `src/app.module.ts`
- `src/main.ts`
- `src/prisma/prisma.service.ts`
- `prisma/schema.prisma`

Auth:
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/strategies/local.strategy.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`
- `src/common/guards/jwt-auth.guard.ts`
- `src/common/guards/roles.guard.ts`

Ownership:
- `src/common/guards/garden-ownership.guard.ts`
- `src/common/decorators/ownership.decorator.ts`

Garden / Vegetable / Price:
- `src/modules/gardens/gardens.service.ts`
- `src/modules/vegetables/vegetables.service.ts`
- `src/modules/vegetables/price.service.ts`

Sales / Reports:
- `src/modules/sales/sales.service.ts`
- `src/modules/sales/utils/sale.serializer.ts`
- `src/modules/reports/reports.service.ts`
- `src/modules/reports/utils/report.serializer.ts`

## 13. Luu y cho nguoi lam tiep

- project hien tai da co nen auth, ownership, garden, vegetable, price, sales, reports
- open issue dang de sau:
  - trim email trong flow `POST /auth/login`
  - `GET /price` hien tai chi support ky hien tai, chua support xem mot ngay/tuan/thang tuy chon
- truoc khi lam `Phase 5`, can giu nguyen cac nguon chan ly:
  - gia hien tai: `Vegetable.price`
  - lich su gia: `PriceHistory`
  - giao dich ban: `Sale`
  - doanh thu report: tinh tu `Sale`
  - so luong da ban: `Vegetable.quantityOut`
