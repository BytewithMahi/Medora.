const { supabase } = require('../services/db/supabaseService');

const getTradeStatus = async (req, res) => {
    try {
        res.json({
            success: true,
            status: 'Operational',
            domain: 'Medora Trade Marketplace',
            active_trades: 0,
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createTrade = async (req, res) => {
    try {
        const { assetId, amount } = req.body;
        // Placeholder for trade creation logic
        res.json({
            success: true,
            message: 'Trade request received',
            tradeId: Math.random().toString(36).substring(7),
            assetId,
            amount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const recordTokenDeployment = async (req, res) => {
    try {
        const { address, name, symbol, totalSupply, basePrice, manufacturer } = req.body;

        if (!address || !name || !symbol) {
            return res.status(400).json({ success: false, message: 'Missing required token data' });
        }

        // 1. Insert token metadata
        const { data: token, error: tokenError } = await supabase
            .from('tokens')
            .upsert({
                address,
                name,
                symbol,
                total_supply: totalSupply,
                base_price: basePrice,
                manufacturer
            })
            .select()
            .single();

        if (tokenError) throw tokenError;

        // 2. record initial price in token_worth
        const { error: priceError } = await supabase
            .from('token_worth')
            .insert({
                token_address: address,
                price: basePrice
            });

        if (priceError) console.error("Error recording initial price:", priceError);

        // 3. record manufacturer as the first holder
        const { error: holderError } = await supabase
            .from('token_holders')
            .upsert({
                token_address: address,
                holder_address: manufacturer,
                balance: totalSupply
            });

        if (holderError) console.error("Error recording initial holder:", holderError);

        res.json({
            success: true,
            message: 'Token deployment recorded in Supabase',
            token
        });
    } catch (error) {
        console.error("Supabase error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getManufacturerTokens = async (req, res) => {
    try {
        const { address } = req.params;
        const { data, error } = await supabase
            .from('tokens')
            .select('*')
            .eq('manufacturer', address)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTokenHolders = async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        const { data, error } = await supabase
            .from('token_holders')
            .select('*')
            .eq('token_address', tokenAddress)
            .order('balance', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getTradeStatus,
    createTrade,
    recordTokenDeployment,
    getManufacturerTokens,
    getTokenHolders
};
