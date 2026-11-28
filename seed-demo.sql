-- demo day 2026-11-28
INSERT OR IGNORE INTO customers(id,shop_id,phone,name,visits) VALUES (4,1,'01111111114','محمود عبد الله',3),(5,1,'01111111115','كريم سامي',6),(6,1,'01111111116','أحمد فؤاد',0),(7,1,'01111111117','يوسف مصطفى',2),(8,1,'01111111118','زياد حسن',1),(9,1,'01111111119','عمر خالد',5),(10,1,'01111111110','طارق نبيل',7),(11,1,'01111111111','زياد حسن',1);
INSERT OR IGNORE INTO bookings(shop_id,service_id,staff_id,customer_id,code,date,start_min,end_min,status,kind,arrived_at) VALUES (1,1,1,4,'MQ-A1','2026-11-28',49,94,'done','online',datetime('now'));
INSERT OR IGNORE INTO bookings(shop_id,service_id,staff_id,customer_id,code,date,start_min,end_min,status,kind,arrived_at) VALUES (1,2,2,5,'MQ-A2','2026-11-28',84,104,'done','online',datetime('now'));
INSERT OR IGNORE INTO bookings(shop_id,service_id,staff_id,customer_id,code,date,start_min,end_min,status,kind,arrived_at) VALUES (1,1,3,6,'MQ-A3','2026-11-28',116,161,'in_service','online',datetime('now'));
INSERT OR IGNORE INTO bookings(shop_id,service_id,staff_id,customer_id,code,date,start_min,end_min,status,kind,arrived_at) VALUES (1,1,1,7,'MQ-A4','2026-11-28',149,194,'confirmed','online',datetime('now'));
INSERT OR IGNORE INTO bookings(shop_id,service_id,staff_id,customer_id,code,date,start_min,end_min,status,kind,arrived_at) VALUES (1,2,2,8,'MQ-A5','2026-11-28',174,194,'confirmed','online',NULL);
INSERT OR IGNORE INTO bookings(shop_id,service_id,staff_id,customer_id,code,date,start_min,end_min,status,kind,arrived_at) VALUES (1,3,3,9,'MQ-A6','2026-11-28',204,234,'confirmed','online',NULL);
INSERT OR IGNORE INTO bookings(shop_id,service_id,staff_id,customer_id,code,date,start_min,end_min,status,kind,arrived_at) VALUES (1,1,1,10,'MQ-A7','2026-11-28',234,279,'pending_confirm','online',NULL);
INSERT OR IGNORE INTO bookings(shop_id,service_id,staff_id,customer_id,code,date,start_min,end_min,status,kind,arrived_at) VALUES (1,2,2,11,'MQ-A8','2026-11-28',29,49,'no_show','online',NULL);
