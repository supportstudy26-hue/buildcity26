-- Additive campaign + compact city payload migration. No player rows reset.
begin;
create table if not exists private.bc26_mission_catalogue(id text primary key,xp integer not null,money numeric not null,prerequisites jsonb not null);
create table if not exists private.bc26_mission_checkpoints(city_id uuid primary key references public.cities(id) on delete cascade,checkpoint jsonb not null,updated_at timestamptz not null default now());
create table if not exists private.bc26_mission_claims(city_id uuid not null references public.cities(id) on delete cascade,catalogue_id text not null,mission_id text not null references private.bc26_mission_catalogue(id),source_revision bigint not null,signature text not null,created_at timestamptz not null default now(),primary key(city_id,catalogue_id,mission_id));
alter table private.bc26_mission_catalogue enable row level security;
alter table private.bc26_mission_checkpoints enable row level security;
alter table private.bc26_mission_claims enable row level security;
revoke all on private.bc26_mission_catalogue,private.bc26_mission_checkpoints,private.bc26_mission_claims from public,anon,authenticated;
insert into private.bc26_mission_catalogue(id,xp,money,prerequisites) values
('bc26-main-001-a',60,7650,'[]'::jsonb),
('bc26-main-001-b',60,7650,'[]'::jsonb),
('bc26-main-001-c',80,15300,'["bc26-main-001-a", "bc26-main-001-b"]'::jsonb),
('bc26-main-002-a',87,10600,'["bc26-main-001-c"]'::jsonb),
('bc26-main-002-b',87,10600,'["bc26-main-001-c"]'::jsonb),
('bc26-main-002-c',118,21200,'["bc26-main-001-c", "bc26-main-002-a", "bc26-main-002-b"]'::jsonb),
('bc26-main-003-a',122,13850,'["bc26-main-002-c"]'::jsonb),
('bc26-main-003-b',122,13850,'["bc26-main-002-c"]'::jsonb),
('bc26-main-003-c',164,27700,'["bc26-main-002-c", "bc26-main-003-a", "bc26-main-003-b"]'::jsonb),
('bc26-main-004-a',164,17400,'["bc26-main-003-c"]'::jsonb),
('bc26-main-004-b',164,17400,'["bc26-main-003-c"]'::jsonb),
('bc26-main-004-c',220,34800,'["bc26-main-003-c", "bc26-main-004-a", "bc26-main-004-b"]'::jsonb),
('bc26-main-005-a',213,21250,'["bc26-main-004-c"]'::jsonb),
('bc26-main-005-b',213,21250,'["bc26-main-004-c"]'::jsonb),
('bc26-main-005-c',286,42500,'["bc26-main-004-c", "bc26-main-005-a", "bc26-main-005-b"]'::jsonb),
('bc26-main-006-a',270,25400,'["bc26-main-005-c"]'::jsonb),
('bc26-main-006-b',270,25400,'["bc26-main-005-c"]'::jsonb),
('bc26-main-006-c',360,50800,'["bc26-main-005-c", "bc26-main-006-a", "bc26-main-006-b"]'::jsonb),
('bc26-main-007-a',333,29850,'["bc26-main-006-c"]'::jsonb),
('bc26-main-007-b',333,29850,'["bc26-main-006-c"]'::jsonb),
('bc26-main-007-c',446,59700,'["bc26-main-006-c", "bc26-main-007-a", "bc26-main-007-b"]'::jsonb),
('bc26-main-008-a',404,34600,'["bc26-main-007-c"]'::jsonb),
('bc26-main-008-b',404,34600,'["bc26-main-007-c"]'::jsonb),
('bc26-main-008-c',540,69200,'["bc26-main-007-c", "bc26-main-008-a", "bc26-main-008-b"]'::jsonb),
('bc26-main-009-a',482,39650,'["bc26-main-008-c"]'::jsonb),
('bc26-main-009-b',482,39650,'["bc26-main-008-c"]'::jsonb),
('bc26-main-009-c',644,79300,'["bc26-main-008-c", "bc26-main-009-a", "bc26-main-009-b"]'::jsonb),
('bc26-main-010-a',567,45000,'["bc26-main-009-c"]'::jsonb),
('bc26-main-010-b',567,45000,'["bc26-main-009-c"]'::jsonb),
('bc26-main-010-c',758,90000,'["bc26-main-009-c", "bc26-main-010-a", "bc26-main-010-b"]'::jsonb),
('bc26-main-011-a',660,50650,'["bc26-main-010-c"]'::jsonb),
('bc26-main-011-b',660,50650,'["bc26-main-010-c"]'::jsonb),
('bc26-main-011-c',880,101300,'["bc26-main-010-c", "bc26-main-011-a", "bc26-main-011-b"]'::jsonb),
('bc26-main-012-a',759,56600,'["bc26-main-011-c"]'::jsonb),
('bc26-main-012-b',759,56600,'["bc26-main-011-c"]'::jsonb),
('bc26-main-012-c',1014,113200,'["bc26-main-011-c", "bc26-main-012-a", "bc26-main-012-b"]'::jsonb),
('bc26-main-013-a',866,62850,'["bc26-main-012-c"]'::jsonb),
('bc26-main-013-b',866,62850,'["bc26-main-012-c"]'::jsonb),
('bc26-main-013-c',1156,125700,'["bc26-main-012-c", "bc26-main-013-a", "bc26-main-013-b"]'::jsonb),
('bc26-main-014-a',980,69400,'["bc26-main-013-c"]'::jsonb),
('bc26-main-014-b',980,69400,'["bc26-main-013-c"]'::jsonb),
('bc26-main-014-c',1308,138800,'["bc26-main-013-c", "bc26-main-014-a", "bc26-main-014-b"]'::jsonb),
('bc26-main-015-a',1101,76250,'["bc26-main-014-c"]'::jsonb),
('bc26-main-015-b',1101,76250,'["bc26-main-014-c"]'::jsonb),
('bc26-main-015-c',1470,152500,'["bc26-main-014-c", "bc26-main-015-a", "bc26-main-015-b"]'::jsonb),
('bc26-main-016-a',1230,83400,'["bc26-main-015-c"]'::jsonb),
('bc26-main-016-b',1230,83400,'["bc26-main-015-c"]'::jsonb),
('bc26-main-016-c',1640,166800,'["bc26-main-015-c", "bc26-main-016-a", "bc26-main-016-b"]'::jsonb),
('bc26-main-017-a',1365,90850,'["bc26-main-016-c"]'::jsonb),
('bc26-main-017-b',1365,90850,'["bc26-main-016-c"]'::jsonb),
('bc26-main-017-c',1822,181700,'["bc26-main-016-c", "bc26-main-017-a", "bc26-main-017-b"]'::jsonb),
('bc26-main-018-a',1508,98600,'["bc26-main-017-c"]'::jsonb),
('bc26-main-018-b',1508,98600,'["bc26-main-017-c"]'::jsonb),
('bc26-main-018-c',2012,197200,'["bc26-main-017-c", "bc26-main-018-a", "bc26-main-018-b"]'::jsonb),
('bc26-main-019-a',1658,106650,'["bc26-main-018-c"]'::jsonb),
('bc26-main-019-b',1658,106650,'["bc26-main-018-c"]'::jsonb),
('bc26-main-019-c',2212,213300,'["bc26-main-018-c", "bc26-main-019-a", "bc26-main-019-b"]'::jsonb),
('bc26-main-020-a',1815,115000,'["bc26-main-019-c"]'::jsonb),
('bc26-main-020-b',1815,115000,'["bc26-main-019-c"]'::jsonb),
('bc26-main-020-c',2422,230000,'["bc26-main-019-c", "bc26-main-020-a", "bc26-main-020-b"]'::jsonb),
('bc26-main-021-a',1980,123650,'["bc26-main-020-c"]'::jsonb),
('bc26-main-021-b',1980,123650,'["bc26-main-020-c"]'::jsonb),
('bc26-main-021-c',2640,247300,'["bc26-main-020-c", "bc26-main-021-a", "bc26-main-021-b"]'::jsonb),
('bc26-main-022-a',2151,132600,'["bc26-main-021-c"]'::jsonb),
('bc26-main-022-b',2151,132600,'["bc26-main-021-c"]'::jsonb),
('bc26-main-022-c',2870,265200,'["bc26-main-021-c", "bc26-main-022-a", "bc26-main-022-b"]'::jsonb),
('bc26-main-023-a',2330,141850,'["bc26-main-022-c"]'::jsonb),
('bc26-main-023-b',2330,141850,'["bc26-main-022-c"]'::jsonb),
('bc26-main-023-c',3108,283700,'["bc26-main-022-c", "bc26-main-023-a", "bc26-main-023-b"]'::jsonb),
('bc26-main-024-a',2516,151400,'["bc26-main-023-c"]'::jsonb),
('bc26-main-024-b',2516,151400,'["bc26-main-023-c"]'::jsonb),
('bc26-main-024-c',3356,302800,'["bc26-main-023-c", "bc26-main-024-a", "bc26-main-024-b"]'::jsonb),
('bc26-main-025-a',2709,161250,'["bc26-main-024-c"]'::jsonb),
('bc26-main-025-b',2709,161250,'["bc26-main-024-c"]'::jsonb),
('bc26-main-025-c',3614,322500,'["bc26-main-024-c", "bc26-main-025-a", "bc26-main-025-b"]'::jsonb),
('bc26-main-026-a',2910,171400,'["bc26-main-025-c"]'::jsonb),
('bc26-main-026-b',2910,171400,'["bc26-main-025-c"]'::jsonb),
('bc26-main-026-c',3880,342800,'["bc26-main-025-c", "bc26-main-026-a", "bc26-main-026-b"]'::jsonb),
('bc26-main-027-a',3117,181850,'["bc26-main-026-c"]'::jsonb),
('bc26-main-027-b',3117,181850,'["bc26-main-026-c"]'::jsonb),
('bc26-main-027-c',4158,363700,'["bc26-main-026-c", "bc26-main-027-a", "bc26-main-027-b"]'::jsonb),
('bc26-main-028-a',3332,192600,'["bc26-main-027-c"]'::jsonb),
('bc26-main-028-b',3332,192600,'["bc26-main-027-c"]'::jsonb),
('bc26-main-028-c',4444,385200,'["bc26-main-027-c", "bc26-main-028-a", "bc26-main-028-b"]'::jsonb),
('bc26-main-029-a',3554,203650,'["bc26-main-028-c"]'::jsonb),
('bc26-main-029-b',3554,203650,'["bc26-main-028-c"]'::jsonb),
('bc26-main-029-c',4740,407300,'["bc26-main-028-c", "bc26-main-029-a", "bc26-main-029-b"]'::jsonb),
('bc26-main-030-a',3783,215000,'["bc26-main-029-c"]'::jsonb),
('bc26-main-030-b',3783,215000,'["bc26-main-029-c"]'::jsonb),
('bc26-main-030-c',5046,430000,'["bc26-main-029-c", "bc26-main-030-a", "bc26-main-030-b"]'::jsonb),
('bc26-main-031-a',4020,226650,'["bc26-main-030-c"]'::jsonb),
('bc26-main-031-b',4020,226650,'["bc26-main-030-c"]'::jsonb),
('bc26-main-031-c',5360,453300,'["bc26-main-030-c", "bc26-main-031-a", "bc26-main-031-b"]'::jsonb),
('bc26-main-032-a',4263,238600,'["bc26-main-031-c"]'::jsonb),
('bc26-main-032-b',4263,238600,'["bc26-main-031-c"]'::jsonb),
('bc26-main-032-c',5686,477200,'["bc26-main-031-c", "bc26-main-032-a", "bc26-main-032-b"]'::jsonb),
('bc26-main-033-a',4514,250850,'["bc26-main-032-c"]'::jsonb),
('bc26-main-033-b',4514,250850,'["bc26-main-032-c"]'::jsonb),
('bc26-main-033-c',6020,501700,'["bc26-main-032-c", "bc26-main-033-a", "bc26-main-033-b"]'::jsonb),
('bc26-main-034-a',4772,263400,'["bc26-main-033-c"]'::jsonb),
('bc26-main-034-b',4772,263400,'["bc26-main-033-c"]'::jsonb),
('bc26-main-034-c',6364,526800,'["bc26-main-033-c", "bc26-main-034-a", "bc26-main-034-b"]'::jsonb),
('bc26-main-035-a',5037,276250,'["bc26-main-034-c"]'::jsonb),
('bc26-main-035-b',5037,276250,'["bc26-main-034-c"]'::jsonb),
('bc26-main-035-c',6718,552500,'["bc26-main-034-c", "bc26-main-035-a", "bc26-main-035-b"]'::jsonb),
('bc26-main-036-a',5310,289400,'["bc26-main-035-c"]'::jsonb),
('bc26-main-036-b',5310,289400,'["bc26-main-035-c"]'::jsonb),
('bc26-main-036-c',7080,578800,'["bc26-main-035-c", "bc26-main-036-a", "bc26-main-036-b"]'::jsonb),
('bc26-main-037-a',5589,302850,'["bc26-main-036-c"]'::jsonb),
('bc26-main-037-b',5589,302850,'["bc26-main-036-c"]'::jsonb),
('bc26-main-037-c',7454,605700,'["bc26-main-036-c", "bc26-main-037-a", "bc26-main-037-b"]'::jsonb),
('bc26-main-038-a',5876,316600,'["bc26-main-037-c"]'::jsonb),
('bc26-main-038-b',5876,316600,'["bc26-main-037-c"]'::jsonb),
('bc26-main-038-c',7836,633200,'["bc26-main-037-c", "bc26-main-038-a", "bc26-main-038-b"]'::jsonb),
('bc26-main-039-a',6170,330650,'["bc26-main-038-c"]'::jsonb),
('bc26-main-039-b',6170,330650,'["bc26-main-038-c"]'::jsonb),
('bc26-main-039-c',8228,661300,'["bc26-main-038-c", "bc26-main-039-a", "bc26-main-039-b"]'::jsonb),
('bc26-main-040-a',6471,345000,'["bc26-main-039-c"]'::jsonb),
('bc26-main-040-b',6471,345000,'["bc26-main-039-c"]'::jsonb),
('bc26-main-040-c',8630,690000,'["bc26-main-039-c", "bc26-main-040-a", "bc26-main-040-b"]'::jsonb),
('bc26-main-041-a',6780,359650,'["bc26-main-040-c"]'::jsonb),
('bc26-main-041-b',6780,359650,'["bc26-main-040-c"]'::jsonb),
('bc26-main-041-c',9040,719300,'["bc26-main-040-c", "bc26-main-041-a", "bc26-main-041-b"]'::jsonb),
('bc26-main-042-a',7095,374600,'["bc26-main-041-c"]'::jsonb),
('bc26-main-042-b',7095,374600,'["bc26-main-041-c"]'::jsonb),
('bc26-main-042-c',9462,749200,'["bc26-main-041-c", "bc26-main-042-a", "bc26-main-042-b"]'::jsonb),
('bc26-main-043-a',7418,389850,'["bc26-main-042-c"]'::jsonb),
('bc26-main-043-b',7418,389850,'["bc26-main-042-c"]'::jsonb),
('bc26-main-043-c',9892,779700,'["bc26-main-042-c", "bc26-main-043-a", "bc26-main-043-b"]'::jsonb),
('bc26-main-044-a',7748,405400,'["bc26-main-043-c"]'::jsonb),
('bc26-main-044-b',7748,405400,'["bc26-main-043-c"]'::jsonb),
('bc26-main-044-c',10332,810800,'["bc26-main-043-c", "bc26-main-044-a", "bc26-main-044-b"]'::jsonb),
('bc26-main-045-a',8085,421250,'["bc26-main-044-c"]'::jsonb),
('bc26-main-045-b',8085,421250,'["bc26-main-044-c"]'::jsonb),
('bc26-main-045-c',10782,842500,'["bc26-main-044-c", "bc26-main-045-a", "bc26-main-045-b"]'::jsonb),
('bc26-main-046-a',8430,437400,'["bc26-main-045-c"]'::jsonb),
('bc26-main-046-b',8430,437400,'["bc26-main-045-c"]'::jsonb),
('bc26-main-046-c',11240,874800,'["bc26-main-045-c", "bc26-main-046-a", "bc26-main-046-b"]'::jsonb),
('bc26-main-047-a',8781,453850,'["bc26-main-046-c"]'::jsonb),
('bc26-main-047-b',8781,453850,'["bc26-main-046-c"]'::jsonb),
('bc26-main-047-c',11710,907700,'["bc26-main-046-c", "bc26-main-047-a", "bc26-main-047-b"]'::jsonb),
('bc26-main-048-a',9140,470600,'["bc26-main-047-c"]'::jsonb),
('bc26-main-048-b',9140,470600,'["bc26-main-047-c"]'::jsonb),
('bc26-main-048-c',12188,941200,'["bc26-main-047-c", "bc26-main-048-a", "bc26-main-048-b"]'::jsonb),
('bc26-main-049-a',9506,487650,'["bc26-main-048-c"]'::jsonb),
('bc26-main-049-b',9506,487650,'["bc26-main-048-c"]'::jsonb),
('bc26-main-049-c',12676,975300,'["bc26-main-048-c", "bc26-main-049-a", "bc26-main-049-b"]'::jsonb),
('bc26-main-050-a',9879,505000,'["bc26-main-049-c"]'::jsonb),
('bc26-main-050-b',9879,505000,'["bc26-main-049-c"]'::jsonb),
('bc26-main-050-c',13174,1010000,'["bc26-main-049-c", "bc26-main-050-a", "bc26-main-050-b"]'::jsonb),
('bc26-main-051-a',10260,522650,'["bc26-main-050-c"]'::jsonb),
('bc26-main-051-b',10260,522650,'["bc26-main-050-c"]'::jsonb),
('bc26-main-051-c',13680,1045300,'["bc26-main-050-c", "bc26-main-051-a", "bc26-main-051-b"]'::jsonb),
('bc26-main-052-a',10647,540600,'["bc26-main-051-c"]'::jsonb),
('bc26-main-052-b',10647,540600,'["bc26-main-051-c"]'::jsonb),
('bc26-main-052-c',14198,1081200,'["bc26-main-051-c", "bc26-main-052-a", "bc26-main-052-b"]'::jsonb),
('bc26-main-053-a',11042,558850,'["bc26-main-052-c"]'::jsonb),
('bc26-main-053-b',11042,558850,'["bc26-main-052-c"]'::jsonb),
('bc26-main-053-c',14724,1117700,'["bc26-main-052-c", "bc26-main-053-a", "bc26-main-053-b"]'::jsonb),
('bc26-main-054-a',11444,577400,'["bc26-main-053-c"]'::jsonb),
('bc26-main-054-b',11444,577400,'["bc26-main-053-c"]'::jsonb),
('bc26-main-054-c',15260,1154800,'["bc26-main-053-c", "bc26-main-054-a", "bc26-main-054-b"]'::jsonb),
('bc26-main-055-a',11853,596250,'["bc26-main-054-c"]'::jsonb),
('bc26-main-055-b',11853,596250,'["bc26-main-054-c"]'::jsonb),
('bc26-main-055-c',15806,1192500,'["bc26-main-054-c", "bc26-main-055-a", "bc26-main-055-b"]'::jsonb),
('bc26-main-056-a',12270,615400,'["bc26-main-055-c"]'::jsonb),
('bc26-main-056-b',12270,615400,'["bc26-main-055-c"]'::jsonb),
('bc26-main-056-c',16360,1230800,'["bc26-main-055-c", "bc26-main-056-a", "bc26-main-056-b"]'::jsonb),
('bc26-main-057-a',12693,634850,'["bc26-main-056-c"]'::jsonb),
('bc26-main-057-b',12693,634850,'["bc26-main-056-c"]'::jsonb),
('bc26-main-057-c',16926,1269700,'["bc26-main-056-c", "bc26-main-057-a", "bc26-main-057-b"]'::jsonb),
('bc26-main-058-a',13124,654600,'["bc26-main-057-c"]'::jsonb),
('bc26-main-058-b',13124,654600,'["bc26-main-057-c"]'::jsonb),
('bc26-main-058-c',17500,1309200,'["bc26-main-057-c", "bc26-main-058-a", "bc26-main-058-b"]'::jsonb),
('bc26-main-059-a',13562,674650,'["bc26-main-058-c"]'::jsonb),
('bc26-main-059-b',13562,674650,'["bc26-main-058-c"]'::jsonb),
('bc26-main-059-c',18084,1349300,'["bc26-main-058-c", "bc26-main-059-a", "bc26-main-059-b"]'::jsonb),
('bc26-main-060-a',14007,695000,'["bc26-main-059-c"]'::jsonb),
('bc26-main-060-b',14007,695000,'["bc26-main-059-c"]'::jsonb),
('bc26-main-060-c',18678,1390000,'["bc26-main-059-c", "bc26-main-060-a", "bc26-main-060-b"]'::jsonb),
('bc26-main-061-a',14460,715650,'["bc26-main-060-c"]'::jsonb),
('bc26-main-061-b',14460,715650,'["bc26-main-060-c"]'::jsonb),
('bc26-main-061-c',19280,1431300,'["bc26-main-060-c", "bc26-main-061-a", "bc26-main-061-b"]'::jsonb),
('bc26-main-062-a',14919,736600,'["bc26-main-061-c"]'::jsonb),
('bc26-main-062-b',14919,736600,'["bc26-main-061-c"]'::jsonb),
('bc26-main-062-c',19894,1473200,'["bc26-main-061-c", "bc26-main-062-a", "bc26-main-062-b"]'::jsonb),
('bc26-main-063-a',15386,757850,'["bc26-main-062-c"]'::jsonb),
('bc26-main-063-b',15386,757850,'["bc26-main-062-c"]'::jsonb),
('bc26-main-063-c',20516,1515700,'["bc26-main-062-c", "bc26-main-063-a", "bc26-main-063-b"]'::jsonb),
('bc26-main-064-a',15860,779400,'["bc26-main-063-c"]'::jsonb),
('bc26-main-064-b',15860,779400,'["bc26-main-063-c"]'::jsonb),
('bc26-main-064-c',21148,1558800,'["bc26-main-063-c", "bc26-main-064-a", "bc26-main-064-b"]'::jsonb),
('bc26-main-065-a',16341,801250,'["bc26-main-064-c"]'::jsonb),
('bc26-main-065-b',16341,801250,'["bc26-main-064-c"]'::jsonb),
('bc26-main-065-c',21790,1602500,'["bc26-main-064-c", "bc26-main-065-a", "bc26-main-065-b"]'::jsonb),
('bc26-main-066-a',16830,823400,'["bc26-main-065-c"]'::jsonb),
('bc26-main-066-b',16830,823400,'["bc26-main-065-c"]'::jsonb),
('bc26-main-066-c',22440,1646800,'["bc26-main-065-c", "bc26-main-066-a", "bc26-main-066-b"]'::jsonb),
('bc26-main-067-a',17325,845850,'["bc26-main-066-c"]'::jsonb),
('bc26-main-067-b',17325,845850,'["bc26-main-066-c"]'::jsonb),
('bc26-main-067-c',23102,1691700,'["bc26-main-066-c", "bc26-main-067-a", "bc26-main-067-b"]'::jsonb),
('bc26-main-068-a',17828,868600,'["bc26-main-067-c"]'::jsonb),
('bc26-main-068-b',17828,868600,'["bc26-main-067-c"]'::jsonb),
('bc26-main-068-c',23772,1737200,'["bc26-main-067-c", "bc26-main-068-a", "bc26-main-068-b"]'::jsonb),
('bc26-main-069-a',18338,891650,'["bc26-main-068-c"]'::jsonb),
('bc26-main-069-b',18338,891650,'["bc26-main-068-c"]'::jsonb),
('bc26-main-069-c',24452,1783300,'["bc26-main-068-c", "bc26-main-069-a", "bc26-main-069-b"]'::jsonb),
('bc26-main-070-a',18855,915000,'["bc26-main-069-c"]'::jsonb),
('bc26-main-070-b',18855,915000,'["bc26-main-069-c"]'::jsonb),
('bc26-main-070-c',25142,1830000,'["bc26-main-069-c", "bc26-main-070-a", "bc26-main-070-b"]'::jsonb),
('bc26-main-071-a',19380,938650,'["bc26-main-070-c"]'::jsonb),
('bc26-main-071-b',19380,938650,'["bc26-main-070-c"]'::jsonb),
('bc26-main-071-c',25840,1877300,'["bc26-main-070-c", "bc26-main-071-a", "bc26-main-071-b"]'::jsonb),
('bc26-main-072-a',19911,962600,'["bc26-main-071-c"]'::jsonb),
('bc26-main-072-b',19911,962600,'["bc26-main-071-c"]'::jsonb),
('bc26-main-072-c',26550,1925200,'["bc26-main-071-c", "bc26-main-072-a", "bc26-main-072-b"]'::jsonb),
('bc26-main-073-a',20450,986850,'["bc26-main-072-c"]'::jsonb),
('bc26-main-073-b',20450,986850,'["bc26-main-072-c"]'::jsonb),
('bc26-main-073-c',27268,1973700,'["bc26-main-072-c", "bc26-main-073-a", "bc26-main-073-b"]'::jsonb),
('bc26-main-074-a',20996,1011400,'["bc26-main-073-c"]'::jsonb),
('bc26-main-074-b',20996,1011400,'["bc26-main-073-c"]'::jsonb),
('bc26-main-074-c',27996,2022800,'["bc26-main-073-c", "bc26-main-074-a", "bc26-main-074-b"]'::jsonb),
('bc26-main-075-a',21549,1036250,'["bc26-main-074-c"]'::jsonb),
('bc26-main-075-b',21549,1036250,'["bc26-main-074-c"]'::jsonb),
('bc26-main-075-c',28734,2072500,'["bc26-main-074-c", "bc26-main-075-a", "bc26-main-075-b"]'::jsonb),
('bc26-main-076-a',22110,1061400,'["bc26-main-075-c"]'::jsonb),
('bc26-main-076-b',22110,1061400,'["bc26-main-075-c"]'::jsonb),
('bc26-main-076-c',29480,2122800,'["bc26-main-075-c", "bc26-main-076-a", "bc26-main-076-b"]'::jsonb),
('bc26-main-077-a',22677,1086850,'["bc26-main-076-c"]'::jsonb),
('bc26-main-077-b',22677,1086850,'["bc26-main-076-c"]'::jsonb),
('bc26-main-077-c',30238,2173700,'["bc26-main-076-c", "bc26-main-077-a", "bc26-main-077-b"]'::jsonb),
('bc26-main-078-a',23252,1112600,'["bc26-main-077-c"]'::jsonb),
('bc26-main-078-b',23252,1112600,'["bc26-main-077-c"]'::jsonb),
('bc26-main-078-c',31004,2225200,'["bc26-main-077-c", "bc26-main-078-a", "bc26-main-078-b"]'::jsonb),
('bc26-main-079-a',23834,1138650,'["bc26-main-078-c"]'::jsonb),
('bc26-main-079-b',23834,1138650,'["bc26-main-078-c"]'::jsonb),
('bc26-main-079-c',31780,2277300,'["bc26-main-078-c", "bc26-main-079-a", "bc26-main-079-b"]'::jsonb),
('bc26-main-080-a',24423,1165000,'["bc26-main-079-c"]'::jsonb),
('bc26-main-080-b',24423,1165000,'["bc26-main-079-c"]'::jsonb),
('bc26-main-080-c',32566,2330000,'["bc26-main-079-c", "bc26-main-080-a", "bc26-main-080-b"]'::jsonb),
('bc26-main-081-a',25020,1191650,'["bc26-main-080-c"]'::jsonb),
('bc26-main-081-b',25020,1191650,'["bc26-main-080-c"]'::jsonb),
('bc26-main-081-c',33360,2383300,'["bc26-main-080-c", "bc26-main-081-a", "bc26-main-081-b"]'::jsonb),
('bc26-main-082-a',25623,1218600,'["bc26-main-081-c"]'::jsonb),
('bc26-main-082-b',25623,1218600,'["bc26-main-081-c"]'::jsonb),
('bc26-main-082-c',34166,2437200,'["bc26-main-081-c", "bc26-main-082-a", "bc26-main-082-b"]'::jsonb),
('bc26-main-083-a',26234,1245850,'["bc26-main-082-c"]'::jsonb),
('bc26-main-083-b',26234,1245850,'["bc26-main-082-c"]'::jsonb),
('bc26-main-083-c',34980,2491700,'["bc26-main-082-c", "bc26-main-083-a", "bc26-main-083-b"]'::jsonb),
('bc26-main-084-a',26852,1273400,'["bc26-main-083-c"]'::jsonb),
('bc26-main-084-b',26852,1273400,'["bc26-main-083-c"]'::jsonb),
('bc26-main-084-c',35804,2546800,'["bc26-main-083-c", "bc26-main-084-a", "bc26-main-084-b"]'::jsonb),
('bc26-main-085-a',27477,1301250,'["bc26-main-084-c"]'::jsonb),
('bc26-main-085-b',27477,1301250,'["bc26-main-084-c"]'::jsonb),
('bc26-main-085-c',36638,2602500,'["bc26-main-084-c", "bc26-main-085-a", "bc26-main-085-b"]'::jsonb),
('bc26-main-086-a',28110,1329400,'["bc26-main-085-c"]'::jsonb),
('bc26-main-086-b',28110,1329400,'["bc26-main-085-c"]'::jsonb),
('bc26-main-086-c',37480,2658800,'["bc26-main-085-c", "bc26-main-086-a", "bc26-main-086-b"]'::jsonb),
('bc26-main-087-a',28749,1357850,'["bc26-main-086-c"]'::jsonb),
('bc26-main-087-b',28749,1357850,'["bc26-main-086-c"]'::jsonb),
('bc26-main-087-c',38334,2715700,'["bc26-main-086-c", "bc26-main-087-a", "bc26-main-087-b"]'::jsonb),
('bc26-main-088-a',29396,1386600,'["bc26-main-087-c"]'::jsonb),
('bc26-main-088-b',29396,1386600,'["bc26-main-087-c"]'::jsonb),
('bc26-main-088-c',39196,2773200,'["bc26-main-087-c", "bc26-main-088-a", "bc26-main-088-b"]'::jsonb),
('bc26-main-089-a',30050,1415650,'["bc26-main-088-c"]'::jsonb),
('bc26-main-089-b',30050,1415650,'["bc26-main-088-c"]'::jsonb),
('bc26-main-089-c',40068,2831300,'["bc26-main-088-c", "bc26-main-089-a", "bc26-main-089-b"]'::jsonb),
('bc26-main-090-a',30711,1445000,'["bc26-main-089-c"]'::jsonb),
('bc26-main-090-b',30711,1445000,'["bc26-main-089-c"]'::jsonb),
('bc26-main-090-c',40950,2890000,'["bc26-main-089-c", "bc26-main-090-a", "bc26-main-090-b"]'::jsonb),
('bc26-main-091-a',31380,1474650,'["bc26-main-090-c"]'::jsonb),
('bc26-main-091-b',31380,1474650,'["bc26-main-090-c"]'::jsonb),
('bc26-main-091-c',41840,2949300,'["bc26-main-090-c", "bc26-main-091-a", "bc26-main-091-b"]'::jsonb),
('bc26-main-092-a',32055,1504600,'["bc26-main-091-c"]'::jsonb),
('bc26-main-092-b',32055,1504600,'["bc26-main-091-c"]'::jsonb),
('bc26-main-092-c',42742,3009200,'["bc26-main-091-c", "bc26-main-092-a", "bc26-main-092-b"]'::jsonb),
('bc26-main-093-a',32738,1534850,'["bc26-main-092-c"]'::jsonb),
('bc26-main-093-b',32738,1534850,'["bc26-main-092-c"]'::jsonb),
('bc26-main-093-c',43652,3069700,'["bc26-main-092-c", "bc26-main-093-a", "bc26-main-093-b"]'::jsonb),
('bc26-main-094-a',33428,1565400,'["bc26-main-093-c"]'::jsonb),
('bc26-main-094-b',33428,1565400,'["bc26-main-093-c"]'::jsonb),
('bc26-main-094-c',44572,3130800,'["bc26-main-093-c", "bc26-main-094-a", "bc26-main-094-b"]'::jsonb),
('bc26-main-095-a',34125,1596250,'["bc26-main-094-c"]'::jsonb),
('bc26-main-095-b',34125,1596250,'["bc26-main-094-c"]'::jsonb),
('bc26-main-095-c',45502,3192500,'["bc26-main-094-c", "bc26-main-095-a", "bc26-main-095-b"]'::jsonb),
('bc26-main-096-a',34830,1627400,'["bc26-main-095-c"]'::jsonb),
('bc26-main-096-b',34830,1627400,'["bc26-main-095-c"]'::jsonb),
('bc26-main-096-c',46440,3254800,'["bc26-main-095-c", "bc26-main-096-a", "bc26-main-096-b"]'::jsonb),
('bc26-main-097-a',35541,1658850,'["bc26-main-096-c"]'::jsonb),
('bc26-main-097-b',35541,1658850,'["bc26-main-096-c"]'::jsonb),
('bc26-main-097-c',47390,3317700,'["bc26-main-096-c", "bc26-main-097-a", "bc26-main-097-b"]'::jsonb),
('bc26-main-098-a',36260,1690600,'["bc26-main-097-c"]'::jsonb),
('bc26-main-098-b',36260,1690600,'["bc26-main-097-c"]'::jsonb),
('bc26-main-098-c',48348,3381200,'["bc26-main-097-c", "bc26-main-098-a", "bc26-main-098-b"]'::jsonb),
('bc26-main-099-a',36986,1722650,'["bc26-main-098-c"]'::jsonb),
('bc26-main-099-b',36986,1722650,'["bc26-main-098-c"]'::jsonb),
('bc26-main-099-c',49316,3445300,'["bc26-main-098-c", "bc26-main-099-a", "bc26-main-099-b"]'::jsonb),
('bc26-main-100-a',37719,1755000,'["bc26-main-099-c"]'::jsonb),
('bc26-main-100-b',37719,1755000,'["bc26-main-099-c"]'::jsonb),
('bc26-main-100-c',50294,3510000,'["bc26-main-099-c", "bc26-main-100-a", "bc26-main-100-b"]'::jsonb)
on conflict(id) do nothing;

create or replace function public.bc26_mission_read(p_city_id uuid,p_owner uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.cities; cp jsonb;
begin
 select * into c from public.cities where id=p_city_id and owner_id=p_owner;
 if c.id is null then raise exception 'BC26_MISSION_OWNER' using errcode='42501';end if;
 select checkpoint into cp from private.bc26_mission_checkpoints where city_id=c.id;
 return jsonb_build_object('city',to_jsonb(c),'checkpoint',cp);
end $$;
create or replace function public.bc26_mission_commit(p_city_id uuid,p_owner uuid,p_revision bigint,p_mission_id text,p_state jsonb,p_checkpoint jsonb,p_signature text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.cities; m private.bc26_mission_catalogue; previous jsonb; receipt jsonb; delta numeric;
begin
 select * into c from public.cities where id=p_city_id and owner_id=p_owner for update;
 if c.id is null then raise exception 'BC26_MISSION_OWNER' using errcode='42501';end if;
 if p_mission_id is not null and exists(select 1 from private.bc26_mission_claims where city_id=c.id and catalogue_id='bc26-main-300-v1' and mission_id=p_mission_id) then return jsonb_build_object('city',to_jsonb(c),'applied',false);end if;
 if c.revision<>p_revision then raise exception 'BC26_CONFLICT' using errcode='PT409';end if;
 if p_state->>'schemaVersion' is distinct from '6' or p_state#>>'{progression,campaign,version}' is distinct from 'bc26-main-300-v1' or octet_length(p_state::text)>2000000 or p_checkpoint->'state' is distinct from p_state or char_length(p_signature)<>64 then raise exception 'BC26_MISSION_STATE' using errcode='22023';end if;
 previous:=coalesce((select checkpoint#>'{state,progression,campaign,claims}' from private.bc26_mission_checkpoints where city_id=c.id),'[]'::jsonb);
 if p_mission_id is not null then
  select * into m from private.bc26_mission_catalogue where id=p_mission_id;
  if m.id is null or exists(select 1 from jsonb_array_elements_text(m.prerequisites) x where not exists(select 1 from private.bc26_mission_claims r where r.city_id=c.id and r.catalogue_id='bc26-main-300-v1' and r.mission_id=x.value)) then raise exception 'BC26_MISSION_PREREQUISITE' using errcode='22023';end if;
  receipt:=(select x from jsonb_array_elements(p_state#>'{progression,campaign,claims}') x where x->>'id'=m.id);
  if receipt is null or (receipt->>'revision')::bigint<>p_revision or jsonb_array_length(p_state#>'{progression,campaign,claims}')<>jsonb_array_length(previous)+1 or exists(select 1 from jsonb_array_elements(previous) x where not p_state#>'{progression,campaign,claims}' @> jsonb_build_array(x)) then raise exception 'BC26_MISSION_RECEIPT' using errcode='22023';end if;
  if not p_state#>'{ledger,receipts}' @> jsonb_build_array('mission:bc26-main-300-v1:'||m.id) or not exists(select 1 from jsonb_array_elements(p_state#>'{ledger,entries}') x where x->>'id'='mission:bc26-main-300-v1:'||m.id and (x->>'amount')::numeric=m.money) then raise exception 'BC26_MISSION_LEDGER' using errcode='22023';end if;
  delta:=(select coalesce(sum((x->>'amount')::numeric),0) from jsonb_array_elements(p_state#>'{ledger,entries}') x where not c.state#>'{ledger,receipts}' @> jsonb_build_array(x->>'id'));
  if (p_state->>'money')::numeric<>(c.state->>'money')::numeric+delta then raise exception 'BC26_MISSION_CASH' using errcode='22023';end if;
  insert into private.bc26_mission_claims values(c.id,'bc26-main-300-v1',m.id,p_revision,p_signature,now());
 elsif p_state#>'{progression,campaign,claims}' is distinct from previous or p_state->'money' is distinct from c.state->'money' or p_state->'ledger' is distinct from c.state->'ledger' then raise exception 'BC26_MISSION_OBSERVATION' using errcode='22023';
 end if;
 update public.cities set state=p_state,revision=revision+1,updated_at=clock_timestamp() where id=c.id returning * into c;
 insert into private.bc26_mission_checkpoints(city_id,checkpoint) values(c.id,p_checkpoint) on conflict(city_id) do update set checkpoint=excluded.checkpoint,updated_at=now();
 return jsonb_build_object('city',to_jsonb(c),'applied',p_mission_id is not null);
end $$;
revoke all on function public.bc26_mission_read(uuid,uuid) from public,anon,authenticated;
revoke all on function public.bc26_mission_commit(uuid,uuid,bigint,text,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.bc26_mission_read(uuid,uuid) to service_role;
grant execute on function public.bc26_mission_commit(uuid,uuid,bigint,text,jsonb,jsonb,text) to service_role;
-- A stale tab cannot remove or fabricate already paid campaign receipts.
create or replace function public.bc26_guard_campaign_claims() returns trigger
language plpgsql security definer set search_path='' as $$
declare canonical jsonb; source_id uuid;
begin
 if auth.uid() is null then return new;end if;
 select checkpoint#>'{state,progression,campaign,claims}' into canonical from private.bc26_mission_checkpoints where city_id=new.id;
 if tg_op='INSERT' and canonical is null and jsonb_array_length(coalesce(new.state#>'{progression,campaign,claims}','[]'::jsonb))>0 then
  source_id:=(new.state#>>'{progression,campaign,originCity}')::uuid;
  select p.checkpoint#>'{state,progression,campaign,claims}' into canonical from private.bc26_mission_checkpoints p join public.cities c on c.id=p.city_id where c.id=source_id and c.owner_id=auth.uid();
 end if;
 if coalesce(new.state#>'{progression,campaign,claims}','[]'::jsonb) is distinct from coalesce(canonical,'[]'::jsonb) then raise exception 'BC26_CONFLICT: mission receipts require server' using errcode='PT409';end if;
 return new;
end $$;
revoke all on function public.bc26_guard_campaign_claims() from public,anon,authenticated;
drop trigger if exists cities_campaign_claim_guard on public.cities;
create trigger cities_campaign_claim_guard before insert or update on public.cities for each row execute function public.bc26_guard_campaign_claims();
-- Copy/restore a verified owned city without repaying its received missions.
create or replace function public.bc26_copy_campaign_checkpoint() returns trigger
language plpgsql security definer set search_path='' as $$
declare source_id uuid; cp jsonb; progress jsonb;
begin
 if auth.uid() is null or jsonb_array_length(coalesce(new.state#>'{progression,campaign,claims}','[]'::jsonb))=0 then return new;end if;
 source_id:=(new.state#>>'{progression,campaign,originCity}')::uuid;
 select p.checkpoint into cp from private.bc26_mission_checkpoints p join public.cities c on c.id=p.city_id where c.id=source_id and c.owner_id=auth.uid();
 if cp is null or cp#>'{state,progression,campaign,claims}' is distinct from new.state#>'{progression,campaign,claims}' then raise exception 'BC26_CONFLICT: cannot copy unverified claims' using errcode='PT409';end if;
 progress:=cp#>'{state,progression,campaign}';
 progress:=jsonb_set(jsonb_set(progress,'{originCity}',to_jsonb(new.id::text)),'{lastSaveRevision}','0'::jsonb);
 cp:=jsonb_build_object('state',jsonb_set(new.state,'{progression,campaign}',progress),'wallMs',floor(extract(epoch from clock_timestamp())*1000));
 insert into private.bc26_mission_checkpoints(city_id,checkpoint) values(new.id,cp);
 insert into private.bc26_mission_claims select new.id,catalogue_id,mission_id,source_revision,signature,created_at from private.bc26_mission_claims where city_id=source_id;
 return new;
end $$;
revoke all on function public.bc26_copy_campaign_checkpoint() from public,anon,authenticated;
drop trigger if exists cities_campaign_copy on public.cities;
create trigger cities_campaign_copy after insert on public.cities for each row execute function public.bc26_copy_campaign_checkpoint();
notify pgrst,'reload schema';
commit;
