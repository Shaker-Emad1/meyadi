-- بيانات تجريبية: صالون النور
INSERT INTO shops(slug,name,type,phone,address,admin_key) VALUES
 ('demo-salon','صالون النور للحلاقة','barber','01000000000','المعادي، القاهرة','demo-admin-2026');
INSERT INTO services(shop_id,name,duration_min,price_egp) VALUES
 (1,'حلاقة شعر + ذقن',45,120),(1,'تحديد ذقن',20,50),(1,'عناية بالبشرة',30,90);
INSERT INTO staff(shop_id,name,pin) VALUES (1,'أحمد','1111'),(1,'محمود','2222'),(1,'كريم','3333');
INSERT INTO customers(shop_id,phone,name,no_shows,visits) VALUES
 (1,'01022227296','شاكر',0,4),(1,'01099998888','طارق',3,7),(1,'01055554444','محمد سامي',0,11);
INSERT INTO coupons(shop_id,code,pct) VALUES (1,'AHLAN10',10);
