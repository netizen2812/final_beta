
export const calculateZakat = async (req, res) => {
    try {
        const { cash, gold_grams, silver_grams, investments, liabilities, prices } = req.body;

        // Prices in Indian Rupees (INR) — default approximate market rates
        let PRICE_GOLD_PER_GRAM = 7200.0;  // INR
        let PRICE_SILVER_PER_GRAM = 85.0;  // INR

        if (prices && prices.gold && prices.silver) {
            PRICE_GOLD_PER_GRAM = prices.gold;
            PRICE_SILVER_PER_GRAM = prices.silver;
        }

        // Nisab Thresholds (weight in grams)
        const NISAB_GOLD_GRAMS = 87.48;
        const NISAB_SILVER_GRAMS = 612.36;

        const goldValue = (parseFloat(gold_grams) || 0) * PRICE_GOLD_PER_GRAM;
        const silverValue = (parseFloat(silver_grams) || 0) * PRICE_SILVER_PER_GRAM;
        const cashValue = parseFloat(cash) || 0;
        const investmentsValue = parseFloat(investments) || 0;
        const liabilitiesValue = parseFloat(liabilities) || 0;

        const totalAssets = goldValue + silverValue + cashValue + investmentsValue;
        const netAssets = totalAssets - liabilitiesValue;

        // Using Silver Nisab as the safer (lower) threshold — fully in INR
        // Nisab (silver) = 612.36g × ₹85/g = ₹52,050.6
        const nisabThreshold = NISAB_SILVER_GRAMS * PRICE_SILVER_PER_GRAM;

        let zakatDue = 0;
        if (netAssets >= nisabThreshold) {
            zakatDue = netAssets * 0.025;
        }

        res.status(200).json({
            netAssets,
            nisabThreshold,
            zakatDue,
            currency: "INR",
            breakdown: {
                goldValue,
                silverValue,
                cashValue,
                investmentsValue,
                liabilitiesValue
            }
        });

    } catch (error) {
        console.error("Zakat Calculation Error:", error);
        res.status(500).json({ message: "Error calculating Zakat" });
    }
};
