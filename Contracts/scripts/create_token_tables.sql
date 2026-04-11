-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    total_supply NUMERIC NOT NULL,
    base_price NUMERIC NOT NULL,
    manufacturer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create token_holders table (for tracking ownership)
CREATE TABLE IF NOT EXISTS token_holders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_address TEXT NOT NULL REFERENCES tokens(address) ON DELETE CASCADE,
    holder_address TEXT NOT NULL,
    balance NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(token_address, holder_address)
);

-- Create token_worth table (for price history tracking)
CREATE TABLE IF NOT EXISTS token_worth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_address TEXT NOT NULL REFERENCES tokens(address) ON DELETE CASCADE,
    price NUMERIC NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add public policies
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_worth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for tokens" ON tokens FOR SELECT USING (true);
CREATE POLICY "Allow public read for token_holders" ON token_holders FOR SELECT USING (true);
CREATE POLICY "Allow public read for token_worth" ON token_worth FOR SELECT USING (true);

-- For development purposes, allow anonymous insert/update (same as your existing init_db.js)
CREATE POLICY "Allow public write for tokens" ON tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for tokens" ON tokens FOR UPDATE USING (true);
CREATE POLICY "Allow public write for token_holders" ON token_holders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for token_holders" ON token_holders FOR UPDATE USING (true);
CREATE POLICY "Allow public write for token_worth" ON token_worth FOR INSERT WITH CHECK (true);
