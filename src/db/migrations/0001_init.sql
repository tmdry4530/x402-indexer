CREATE TABLE IF NOT EXISTS function_signatures (
  selector varchar(10) PRIMARY KEY,
  name varchar(255) NOT NULL,
  source varchar(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS address_registry (
  address varchar(42) PRIMARY KEY,
  type varchar(30) NOT NULL,
  name varchar(100),
  valid_from_block bigint,
  valid_to_block bigint
);

CREATE TABLE IF NOT EXISTS price_snapshots (
  token_address varchar(42) NOT NULL,
  timestamp timestamptz NOT NULL,
  price_usd numeric(20, 8) NOT NULL,
  source varchar(30) NOT NULL,
  PRIMARY KEY (token_address, timestamp)
);

CREATE TABLE IF NOT EXISTS backfill_jobs (
  id bigserial PRIMARY KEY,
  start_block bigint NOT NULL,
  end_block bigint NOT NULL,
  status varchar(20) NOT NULL,
  retry_count integer NOT NULL DEFAULT 0,
  error_message text
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_backfill_jobs_range
  ON backfill_jobs (start_block, end_block);

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  worker_name varchar(50) PRIMARY KEY,
  last_processed_block bigint NOT NULL DEFAULT 0,
  last_processed_hash varchar(66) NOT NULL DEFAULT '0x0',
  status varchar(20) NOT NULL DEFAULT 'idle',
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocks (
  number bigint PRIMARY KEY,
  hash varchar(66) NOT NULL UNIQUE,
  parent_hash varchar(66) NOT NULL,
  timestamp timestamptz NOT NULL,
  is_orphaned boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks (timestamp);
CREATE INDEX IF NOT EXISTS idx_blocks_orphaned_number ON blocks (is_orphaned, number);

CREATE TABLE IF NOT EXISTS transactions (
  hash varchar(66) PRIMARY KEY,
  block_number bigint NOT NULL REFERENCES blocks(number),
  from_address varchar(42) NOT NULL,
  to_address varchar(42),
  input text,
  value numeric(78, 0) NOT NULL DEFAULT 0,
  status smallint NOT NULL,
  gas_used bigint NOT NULL,
  effective_gas_price numeric(78, 0) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_block_number ON transactions (block_number);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions (from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions (to_address);

CREATE TABLE IF NOT EXISTS logs (
  id bigserial PRIMARY KEY,
  transaction_hash varchar(66) NOT NULL REFERENCES transactions(hash),
  log_index integer NOT NULL,
  block_number bigint NOT NULL REFERENCES blocks(number),
  address varchar(42) NOT NULL,
  topic0 varchar(66),
  topic1 varchar(66),
  topic2 varchar(66),
  topic3 varchar(66),
  data text,
  UNIQUE (transaction_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_logs_address_topic0 ON logs (address, topic0);
CREATE INDEX IF NOT EXISTS idx_logs_block_number ON logs (block_number);

CREATE TABLE IF NOT EXISTS services (
  address varchar(42) PRIMARY KEY,
  name varchar(100),
  category varchar(50)
);

CREATE TABLE IF NOT EXISTS agents (
  address varchar(42) PRIMARY KEY,
  is_contract boolean NOT NULL,
  first_seen_block bigint NOT NULL REFERENCES blocks(number),
  last_seen_block bigint NOT NULL REFERENCES blocks(number)
);

CREATE TABLE IF NOT EXISTS x402_evidence (
  id bigserial PRIMARY KEY,
  transaction_hash varchar(66) NOT NULL REFERENCES transactions(hash),
  log_index integer NOT NULL,
  block_number bigint NOT NULL REFERENCES blocks(number),
  detection_method varchar(30) NOT NULL,
  confidence smallint NOT NULL,
  payer varchar(42) NOT NULL,
  pay_to varchar(42) NOT NULL,
  asset varchar(42) NOT NULL,
  amount numeric(78, 0) NOT NULL,
  UNIQUE (transaction_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_x402_evidence_confidence ON x402_evidence (confidence);
CREATE INDEX IF NOT EXISTS idx_x402_evidence_detection_method ON x402_evidence (detection_method);

CREATE TABLE IF NOT EXISTS payments (
  transaction_hash varchar(66) NOT NULL REFERENCES transactions(hash),
  log_index integer NOT NULL,
  evidence_id bigint NOT NULL REFERENCES x402_evidence(id),
  block_number bigint NOT NULL REFERENCES blocks(number),
  block_timestamp timestamptz NOT NULL,
  payer varchar(42) NOT NULL REFERENCES agents(address),
  pay_to varchar(42) NOT NULL REFERENCES services(address),
  asset varchar(42) NOT NULL,
  amount numeric(78, 0) NOT NULL,
  amount_usd numeric(20, 6),
  PRIMARY KEY (transaction_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments (payer);
CREATE INDEX IF NOT EXISTS idx_payments_pay_to ON payments (pay_to);
CREATE INDEX IF NOT EXISTS idx_payments_block_timestamp ON payments (block_timestamp);

CREATE TABLE IF NOT EXISTS interactions (
  id bigserial PRIMARY KEY,
  transaction_hash varchar(66) NOT NULL REFERENCES transactions(hash),
  block_number bigint NOT NULL REFERENCES blocks(number),
  block_timestamp timestamptz NOT NULL,
  agent_address varchar(42) NOT NULL REFERENCES agents(address),
  target_contract varchar(42),
  function_selector varchar(10),
  UNIQUE (transaction_hash, agent_address, target_contract, function_selector)
);

CREATE INDEX IF NOT EXISTS idx_interactions_agent_address ON interactions (agent_address);
CREATE INDEX IF NOT EXISTS idx_interactions_block_timestamp ON interactions (block_timestamp);

CREATE TABLE IF NOT EXISTS agent_daily_stats (
  agent_address varchar(42) NOT NULL REFERENCES agents(address),
  date date NOT NULL,
  tx_count integer NOT NULL DEFAULT 0,
  payment_count integer NOT NULL DEFAULT 0,
  total_spent_usd numeric(20, 6) NOT NULL DEFAULT 0,
  total_gas_usd numeric(20, 6) NOT NULL DEFAULT 0,
  total_revenue_usd numeric(20, 6) NOT NULL DEFAULT 0,
  unique_services integer NOT NULL DEFAULT 0,
  PRIMARY KEY (agent_address, date)
);
