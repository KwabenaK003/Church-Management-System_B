alter table pledge_campaigns
  drop column if exists member_id,
  drop column if exists status;
